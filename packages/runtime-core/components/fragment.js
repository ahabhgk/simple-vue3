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
      n2.node = n1.node
      n2.anchor = n1.anchor
      console.log('update fragment')
      console.log(n1, n2)
      patchChildren(n1, n2, container, isSVG)
    }
  },

  getNode(internals, { vnode }) { // 插入到它的前面，需要从头部拿
    return vnode.node
  },

  getNextSibling({ renderOptions }, { vnode }) { // nextSibling 需要从尾部拿
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
