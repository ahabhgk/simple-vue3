import { effect } from '../../reactivity'
import { handleError } from '../error-handling'
import { queueJob } from '../scheduler'

const createSuspense = (vnode, container, isSVG, anchor, internals, placeholder, hiddenContainer) => {
  const suspense = {
    deps: [],
    container,
    anchor,
    hiddenContainer,
    resolve() {
      internals.unmount(vnode.props.fallback)
      internals.move(vnode.props.children, suspense.container, suspense.anchor)
      vnode.node = internals.getNode(vnode.props.children)
    },
    register(instance) {
      suspense.deps.push(instance)
      instance.render
        .then(renderFn => {
          instance.render = renderFn
          instance.update = effect(() => {
            const renderResult = instance.render()
            instance.vnode.children = [renderResult]
            renderResult.parent = instance.vnode
            internals.patch(instance.subTree, renderResult, container, isSVG, placeholder)
            instance.subTree = renderResult
          }, {
            scheduler: queueJob,
          })
          internals.renderOptions.remove(placeholder)
          const index = suspense.deps.indexOf(instance)
          suspense.deps.splice(index, 1)
          if (suspense.deps.length === 0) {
            suspense.resolve()
          }
        })
        .catch(e => {
          handleError(e, instance)
        })
    },
  }
  return suspense
}

export const Suspense = {
  patch(
    internals,
    { n1, n2, container, isSVG, anchor },
  ) {
    if (n1 == null) {
      const placeholder = internals.renderOptions.createText('')
      const hiddenContainer = internals.renderOptions.createElement('div')
      const suspense = n2.suspense = createSuspense(n2, container, isSVG, anchor, internals, placeholder, hiddenContainer)
      internals.mountChildren(n2, hiddenContainer, isSVG, null)
      internals.renderOptions.insert(placeholder, container)
      if (suspense.deps.length > 0) {
        internals.patch(null, n2.props.fallback, container, isSVG, anchor)
        n2.node = internals.getNode(n2.props.fallback)
      } else {
        suspense.resolve()
      }
    } else {
      // n2.node = n1.node
      // const suspense = n2.suspense = n1.suspense
      // if (suspense.deps.length > 0) {
      //   internals.patchChildren(n1, n2, suspense.hiddenContainer, isSVG, null)
      //   internals.patch(n1.props.fallback, n2.props.fallback, suspense.container, isSVG, anchor)
      // } else {
      //   internals.patchChildren(n1, n2, suspense.container, isSVG, anchor)
      // }
    }
  },

  getNode(internals, { vnode }) {
    return vnode.node
  },

  getNextSibling({ renderOptions }, { vnode }) {
    return renderOptions.nextSibling(vnode.node)
  },

  move({ move }, { vnode, container, anchor }) {
    if (vnode.suspense.deps.length) {
      move(vnode.props.fallback, container, anchor)
    } else {
      move(vnode.props.children, container, anchor)
    }
    vnode.suspense.container = container
    vnode.suspense.anchor = anchor
  },

  unmount({ unmount }, { vnode, doRemove }) {
    if (vnode.suspense.deps.length) {
      unmount(vnode.props.fallback, doRemove)
    } else {
      unmount(vnode.props.children, doRemove)
    }
  },
}

export const getParentSuspense = (vnode) => {
  vnode = vnode.parent
  while (vnode) {
    if (vnode.type === Suspense) return vnode.suspense
    vnode = vnode.parent
  }
  return null
}
