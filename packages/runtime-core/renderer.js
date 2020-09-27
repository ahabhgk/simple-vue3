import { isString, isArray, isText } from '../shared'
import { Text, isTextType, isSetupComponent } from './component'
import { isSameVNodeType, h } from './vnode'
import { reactive, effect, stop } from '../reactivity'
import { setCurrentInstance } from './component'
import { queueJob } from './scheduler'

export function createRenderer(options) {
  const patch = (n1, n2, container, isSVG) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    const { type } = n2
    if (isSetupComponent(type)) {
      processComponent(n1, n2, container, isSVG)
    } else if (isString(type)) {
      processElement(n1, n2, container, isSVG)
    } else if (isTextType(type)) {
      processText(n1, n2, container)
    } else {
      type.patch(/* ... */)
    }
  }

  const processComponent = (n1, n2, container, isSVG) => {
    if (n1 == null) {
      const instance = n2.instance = {
        props: reactive(n2.props), // initProps
        update: null,
        effects: [],
      }

      setCurrentInstance(instance)
      const render = n2.type.setup(instance.props)
      setCurrentInstance(null)

      let prevRenderResult = null
      instance.update = effect(() => {
        const renderResult = render()
        n2.children = [renderResult]
        renderResult.parent = n2
        patch(prevRenderResult, renderResult, container, isSVG)
        prevRenderResult = renderResult
      }, {
        scheduler: queueJob,
      })
    } else {
      const instance = n2.instance = n1.instance
      // updateProps, 根据 vnode.props 修改 instance.props
      Object.keys(n2.props).forEach(key => {
        const newValue = n2.props[key]
        const oldValue = instance.props[key]
        if (newValue !== oldValue) {
          instance.props[key] = newValue
        }
      })
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      const node = n2.node = document.createTextNode(n2.props.nodeValue)
      container.appendChild(node)
    } else {
      const node = n2.node = n1.node
      node.nodeValue = n2.props.nodeValue
    }
  }

  const processElement = (n1, n2, container, isSVG) => {
    if (n1 == null) {
      const node = n2.node = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', n2.type)
        : document.createElement(n2.type)
      patchChildren(null, n2, node, isSVG)
      patchProps(null, n2.props, node, isSVG)
      container.appendChild(node)
    } else {
      const node = n2.node = n1.node
      patchChildren(n1, n2, node, isSVG)
      patchProps(n1.props, n2.props, node, isSVG)
    }
  }

  const patchChildren = (n1, n2, container, isSVG = false) => {
    const oldChildren = n1 ? n1.children : []
    let newChildren = n2.props.children
    newChildren = isArray(newChildren) ? newChildren : [newChildren]
    n2.children = []
  
    for (let i = 0; i < newChildren.length; i++) {
      if (newChildren[i] == null) continue
      let newChild = newChildren[i]
      newChild = isText(newChild) ? h(Text, { nodeValue: newChild }) : newChild
      n2.children[i] = newChild
      newChild.parent = n2
  
      let oldChild = null
      for (let j = 0; j < oldChildren.length; j++) {
        if (oldChildren[j] == null) continue
        if (isSameVNodeType(oldChildren[j], newChild)) {
          oldChild = oldChildren[j]
          oldChildren[j] = null
          break
        }
      }
      patch(oldChild, newChild, container, isSVG)
      if (newChild.node) container.appendChild(newChild.node)
    }
  
    for (let oldChild of oldChildren) {
      if (oldChild != null) unmount(oldChild)
    }
  }

  const patchProps = (oldProps, newProps, node, isSVG) => {
    oldProps = oldProps ?? {}
    newProps = newProps ?? {}
    // remove old props
    Object.keys(oldProps).forEach((propName) => {
      if (propName !== 'children' && propName !== 'key' && !(propName in newProps)) {
        setProperty(node, propName, null, oldProps[propName], isSVG);
      }
    });
    // update old props
    Object.keys(newProps).forEach((propName) => {
      if (propName !== 'children' && propName !== 'key' && oldProps[propName] !== newProps[propName]) {
        setProperty(node, propName, newProps[propName], oldProps[propName], isSVG);
      }
    });
  }

  const setProperty = (node, propName, newValue, oldValue, isSVG) => {
    if (propName[0] === 'o' && propName[1] === 'n') {
      const eventType = propName.toLowerCase().slice(2);
  
      if (!node.listeners) node.listeners = {};
      node.listeners[eventType] = newValue;
  
      if (newValue) {
        if (!oldValue) {
          node.addEventListener(eventType, eventProxy);
        }
      } else {
        node.removeEventListener(eventType, eventProxy);
      }
    } else if (newValue !== oldValue) {
      if (propName in node && !isSVG) {
        node[propName] = newValue == null ? '' : newValue
      } else if (newValue == null || newValue === false) {
        node.removeAttribute(propName)
      } else {
        node.setAttribute(propName, newValue)
      }
    }
  }

  function eventProxy(e) {
    // this: node
    this.listeners[e.type](e)
  }

  const unmount = (vnode, doRemove = true) => {
    const { type } = vnode
    if (isSetupComponent(type)) {
      const { instance } = vnode
      instance.effects.forEach(stop)
      stop(instance.update)
      vnode.children.forEach(c => unmount(c, doRemove))
    } else if (isString(type)) {
      vnode.children.forEach(c => unmount(c, false))
      const child = vnode.node
      const parent = child.parentNode
      if (parent && doRemove) parent.removeChild(child)
    } else if (isTextType(type)) {
      const child = vnode.node
      const parent = child.parentNode
      if (parent && doRemove) parent.removeChild(child)
    } else {
      type.unmount(/** */)
    }
  }

  return {
    render(vnode, container) {
      if (vnode == null) {
        if (container.vnode) {
          unmount(container.vnode)
        }
      } else {
        patch(container.vnode ?? null, vnode, container)
      }
      container.vnode = vnode
    },
  }
}
