export const Teleport = {
  patch(
    { renderOptions, mountChildren, patchChildren, move },
    { n1, n2, container, isSVG, anchor },
  ) {
    if (n1 == null) {
      const teleportStartAnchor = n2.node = renderOptions.createText('')
      const teleportEndAnchor = n2.anchor = renderOptions.createText('')
      renderOptions.insert(teleportStartAnchor, container, anchor)
      renderOptions.insert(teleportEndAnchor, container, anchor)
      const target = renderOptions.querySelector(n2.props.to)
      n2.target = target
      mountChildren(n2, target, isSVG, null)
    } else {
      n2.node = n1.node
      n2.anchor = n1.anchor
      n2.target = n1.target
      patchChildren(n1, n2, n2.target, isSVG)

      if (n1.props.to !== n2.props.to) {
        const target = renderOptions.querySelector(n2.props.to)
        n2.target = target
        for (let child of n2.children) {
          move(child, container, null)
        }
      }
    }
  },

  getNode(internals, { vnode }) {
    return vnode.node
  },

  getNextSibling({ renderOptions }, { vnode }) {
    return renderOptions.nextSibling(vnode.anchor)
  },

  move({ renderOptions, move }, { vnode, container, anchor }) {
    const { insert: hostInsert } = renderOptions
    const teleportStartAnchor = vnode.node
    const teleportEndAnchor = vnode.anchor
    hostInsert(teleportStartAnchor, container, anchor)
    hostInsert(teleportEndAnchor, container, anchor)
  },

  unmount({ renderOptions, unmount }, { vnode }) {
    const { remove: hostRemove } = renderOptions
    hostRemove(vnode.node)
    vnode.children.forEach(c => unmount(c))
    hostRemove(vnode.anchor)
  },
}
