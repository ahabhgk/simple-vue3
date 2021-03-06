import { isString, isArray, isText, isPromise, isFunction } from '../shared'
import { getParentInstance, isSetupComponent } from './component'
import { isSameVNodeType, h, TextType, isTextType } from './vnode'
import { reactive, effect, stop, isRef } from '../reactivity'
import { setCurrentInstance } from './component'
import { queueJob } from './scheduler'
import { callWithErrorHandling } from './error-handling'
import { getParentSuspense } from './components/suspense'

export function createRenderer(renderOptions) {
  const {
    createText: hostCreateText,
    createElement: hostCreateElement,
    insert: hostInsert,
    nextSibling: hostNextSibling,
    setProperty: hostSetProperty,
    remove: hostRemove,
  } = renderOptions

  const setRef = (ref, oldRef, vnode) => {
    // unset old ref
    if (oldRef != null && oldRef !== ref) {
      if (isRef(oldRef)) oldRef.value = null
    }
    // set new ref
    const value = getRefValue(vnode)
    if (isRef(ref)) {
      ref.value = value
    } else if (isFunction(ref)) {
      callWithErrorHandling(ref, getParentInstance(vnode), [value])
    } else {
      console.warn('Invalid ref type:', value, `(${typeof value})`)
    }
  }

  const getRefValue = (vnode) => {
    const { type } = vnode
    if (isSetupComponent(type)) return vnode.instance
    if (isString(type) || isTextType(type)) return vnode.node
    return type.getRefValue(internals, { vnode })
  }

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
      type.patch(internals, { n1, n2, container, isSVG, anchor })
    }

    if (n2.ref != null) {
      setRef(n2.ref, n1?.ref ?? null, n2)
    }
  }

  const getNode = (vnode) => {
    if (!vnode) return null
    const { type } = vnode
    if (isSetupComponent(type)) return getNode(vnode.instance.subTree)
    if (isString(type) || isTextType(type)) return vnode.node
    return type.getNode(internals, { vnode })
  }

  const getNextSibling = (vnode) => {
    const { type } = vnode
    if (isSetupComponent(type)) return getNextSibling(vnode.instance.subTree)
    if (isString(type) || isTextType(type)) return hostNextSibling(vnode.node)
    return type.getNextSibling(internals, { vnode })
  }

  const move = (vnode, container, anchor) => {
    const { type } = vnode
    if (isSetupComponent(type)) {
      move(vnode.instance.subTree, container, anchor)
    } else if (isString(type) || isTextType(type)) {
      hostInsert(vnode.node, container, anchor)
    } else {
      type.move(internals, { vnode, container, anchor })
    }
  }

  const unmount = (vnode, doRemove = true) => {
    const { type, ref } = vnode
    if (ref != null) {
      setRef(ref, null, vnode)
    }

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
      type.unmount(internals, { vnode, doRemove })
    }
  }

  const processComponent = (n1, n2, container, isSVG, anchor) => {
    if (n1 == null) {
      const instance = n2.instance = {
        props: reactive(n2.props), // initProps
        render: null,
        update: null,
        effects: [],
        subTree: null,
        vnode: n2,
        parent: null,
        provides: null,
      }
      const parentInstance = instance.parent = getParentInstance(n2)
      instance.provides = parentInstance ? parentInstance.provides : Object.create(null)

      setCurrentInstance(instance)
      const render = instance.render = callWithErrorHandling(n2.type.setup, instance, [instance.props])
      setCurrentInstance(null)

      if (isPromise(render)) {
        const suspense = getParentSuspense(n2)
        const placeholder = instance.subTree = h(TextType, { nodeValue: '' })
        patch(null, placeholder, container, anchor)
        suspense.register(
          instance,
          () => setupRenderEffect(
            instance,
            internals.renderOptions.parentNode(instance.subTree.node),
            isSVG,
            internals.renderOptions.nextSibling(instance.subTree.node),
          ),
        )
      } else if (isFunction(render)) {
        setupRenderEffect(instance, container, isSVG, anchor)
      } else {
        console.warn('setup component: ', n2.type, ' need to return a render function')
      }

      function setupRenderEffect(instance, container, isSVG, anchor) {
        instance.update = effect(() => { // component update 的入口
          const renderResult = instance.render() ?? h(TextType, { nodeValue: '' })
          const vnode = instance.vnode
          vnode.children = [renderResult]
          renderResult.parent = vnode
          patch(instance.subTree, renderResult, container, isSVG, anchor)
          instance.subTree = renderResult
        }, {
          scheduler: queueJob,
        })
      }
    } else {
      const instance = n2.instance = n1.instance
      instance.vnode = n2
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
        node.nodeValue = n2.props.nodeValue
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

  const mountChildren = (vnode, container, isSVG, anchor) => {
    let children = vnode.props.children
    children = isArray(children) ? children : [children]
    vnode.children = []
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      if (child == null) continue
      child = isText(child) ? h(TextType, { nodeValue: child }) : child
      vnode.children[i] = child
      child.parent = vnode
      patch(null, child, container, isSVG, anchor)
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
      newChild = isText(newChild) ? h(TextType, { nodeValue: newChild }) : newChild
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
            const refNode = getNextSibling(newChildren[i - 1])
            move(oldChild, container, refNode)
          } else { // no need to move
            lastIndex = j
          }
          break
        }
      }
      // mount
      if (!find) {
        const refNode = i - 1 < 0
          ? getNode(oldChildren[0])
          : getNextSibling(newChildren[i - 1])
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

  const internals = {
    patch,
    getNode,
    getNextSibling,
    move,
    unmount,
    getRefValue,
    mountChildren,
    patchChildren,
    renderOptions,
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
