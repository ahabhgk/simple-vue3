import { isObject } from '../shared'

export const Text = Symbol('Text')
export const isTextType = (v) => v === Text

export const isSetupComponent = (c) => isObject(c) && 'setup' in c

let currentInstance
export const getCurrentInstance = () => currentInstance
export const setCurrentInstance = (instance) => currentInstance = instance

export const recordInstanceBoundEffect = (effect) => {
  if (currentInstance) currentInstance.effects.push(effect)
}
