export const Fragment = {
  patch({ mountChildren, patchChildren, renderOptions }, { n1, n2, container, isSVG, anchor }) {
    if (n1 == null) {
      const {
        createText: hostCreateText,
        insert: hostInsert,
      } = renderOptions
      const fragmentStartAnchor = n2.node = hostCreateText('')
      const fragmentEndAnchor = n2.anchor = hostCreateText('')
      hostInsert(fragmentStartAnchor, container, anchor)
      hostInsert(fragmentEndAnchor, container, anchor)
      mountChildren(n2, container, isSVG, fragmentEndAnchor)
    } else {
      patchChildren(n1, n2, container, isSVG)
    }
  },

  getNode(internals, { vnode }) {
    return vnode.node
  },

  getNextSibling({ renderOptions }, { vnode }) {
    return renderOptions.nextSibling(vnode.anchor)
  },

  move({ move, renderOptions }, { vnode, container, anchor }) {
    const { insert: hostInsert } = renderOptions
    const fragmentStartAnchor = vnode.node
    const fragmentEndAnchor = vnode.anchor
    hostInsert(fragmentStartAnchor, container, anchor)
    for (let child of vnode.children) {
      move(child, container, anchor)
    }
    hostInsert(fragmentEndAnchor, container, anchor)
  },

  unmount({ unmount, renderOptions }, { vnode, doRemove }) {
    const { remove: hostRemove } = renderOptions
    hostRemove(vnode.node)
    vnode.children.forEach(c => unmount(c, doRemove))
    hostRemove(vnode.anchor)
  },
}
