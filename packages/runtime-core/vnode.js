export function h(type, props, ...children) {
  props = props ?? {}

  const key = props.key ?? null
  delete props.key

  if (children.length === 1) {
    props.children = children[0]
  } else if (children.length > 1) {
    props.children = children
  }

  return {
    type, // function, setup, string, Text (internal)
    props, // only for user (props.children)
    key,
    node: null, // hostNode
    instance: null, // setupComponent: component instance, functionalComponent: hooks
    parent: null,
    children: null, // VNode[], for internal vnode structure
  }
}

export const isSameVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key

export const TextType = Symbol('TextType')
export const isTextType = (v) => v === TextType
