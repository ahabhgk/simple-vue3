import { isObject } from '../shared'

export const isSetupComponent = (c) => isObject(c) && 'setup' in c

let currentInstance
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = (instance) => currentInstance = instance

export const recordInstanceBoundEffect = (effect) => {
  if (currentInstance) currentInstance.effects.push(effect)
}

export const getParentInstance = (instance) => {
  let parentVNode = instance.vnode.parent
  while (parentVNode != null) {
    if (parentVNode.instance != null) return parentVNode.instance
    parentVNode = parentVNode.parent
  }
  return null
}
