import { isString, isArray, isText } from '../shared'
import { Text, isTextType, isSetupComponent } from './component'
import { isSameVNodeType, h } from './vnode'
import { reactive, effect, stop } from '../reactivity'
import { setCurrentInstance } from './component'
import { queueJob } from './scheduler'

export function createRenderer(renderOptions) {
  const {
    createText: hostCreateText,
    createElement: hostCreateElement,
    insert: hostInsert,
    nextSibling: hostNextSibling,
    setProperty: hostSetProperty,
    remove: hostRemove,
  } = renderOptions

  const patch = (n1, n2, container, isSVG, anchor = null) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    const { type } = n2
    if (isSetupComponent(type)) {
      processComponent(n1, n2, container, isSVG, anchor)
    } else if (isString(type)) {
      processElement(n1, n2, container, isSVG, anchor)
    } else if (isTextType(type)) {
      processText(n1, n2, container, anchor)
    } else {
      type.patch(/* ... */)
    }
  }

  const processComponent = (n1, n2, container, isSVG, anchor) => {
    if (n1 == null) {
      const instance = n2.instance = {
        props: reactive(n2.props), // initProps
        update: null,
        effects: [],
        subTree: null
      }

      setCurrentInstance(instance)
      const render = n2.type.setup(instance.props)
      setCurrentInstance(null)

      instance.update = effect(() => { // component update 的入口
        const renderResult = render()
        n2.children = [renderResult]
        renderResult.parent = n2
        patch(instance.subTree, renderResult, container, isSVG, anchor)
        n2.node = renderResult.node
        instance.subTree = renderResult
      }, {
        scheduler: queueJob,
      })
    } else {
      const instance = n2.instance = n1.instance
      n2.node = n1.node
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

  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      const node = n2.node = hostCreateText(n2.props.nodeValue)
      hostInsert(node, container, anchor)
    } else {
      const node = n2.node = n1.node
      if (node.nodeValue !== n2.props.nodeValue) {
        node.nodeValue !== n2.props.nodeValue
      }
    }
  }

  const processElement = (n1, n2, container, isSVG, anchor) => {
    if (n1 == null) {
      const node = n2.node = hostCreateElement(n2.type, isSVG)
      mountChildren(n2, node, isSVG)
      patchProps(null, n2.props, node, isSVG)
      hostInsert(node, container, anchor)
    } else {
      const node = n2.node = n1.node
      patchChildren(n1, n2, node, isSVG)
      patchProps(n1.props, n2.props, node, isSVG)
    }
  }

  const mountChildren = (vnode, container, isSVG) => {
    let children = vnode.props.children
    children = isArray(children) ? children : [children]
    vnode.children = []
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      if (child == null) continue
      child = isText(child) ? h(Text, { nodeValue: child }) : child
      vnode.children[i] = child
      patch(null, child, container, isSVG)
    }
  }

  const patchChildren = (n1, n2, container, isSVG) => {
    const oldChildren = n1.children
    let newChildren = n2.props.children
    newChildren = isArray(newChildren) ? newChildren : [newChildren]
    n2.children = []

    let lastIndex = 0
    for (let i = 0; i < newChildren.length; i++) {
      if (newChildren[i] == null) continue
      let newChild = newChildren[i]
      newChild = isText(newChild) ? h(Text, { nodeValue: newChild }) : newChild
      n2.children[i] = newChild
      newChild.parent = n2

      let find = false
      for (let j = 0; j < oldChildren.length; j++) {
        if (oldChildren[j] == null) continue
        if (isSameVNodeType(oldChildren[j], newChild)) { // update
          const oldChild = oldChildren[j]
          oldChildren[j] = null
          find = true

          patch(oldChild, newChild, container, isSVG)

          if (j < lastIndex) { // move
            const refNode = hostNextSibling(newChildren[i - 1].node)
            hostInsert(oldChild.node, container, refNode)
          } else { // no need to move
            lastIndex = j
          }
          break
        }
      }
      // mount
      if (!find) {
        const refNode = i - 1 < 0
          ? oldChildren[0].node
          : hostNextSibling(newChildren[i - 1].node)
        patch(null, newChild, container, isSVG, refNode)
      }
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
        hostSetProperty(node, propName, null, oldProps[propName], isSVG);
      }
    });
    // update old props
    Object.keys(newProps).forEach((propName) => {
      if (propName !== 'children' && propName !== 'key' && oldProps[propName] !== newProps[propName]) {
        hostSetProperty(node, propName, newProps[propName], oldProps[propName], isSVG);
      }
    });
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
      if (doRemove) hostRemove(vnode.node)
    } else if (isTextType(type)) {
      if (doRemove) hostRemove(vnode.node)
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
