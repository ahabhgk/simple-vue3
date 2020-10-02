import { isFunction } from '../shared'
import { getCurrentInstance, getParentInstance } from './component'

export const provide = (key, value) => {
  const currentInstance = getCurrentInstance()
  if (!currentInstance) {
    if (__DEV__) {
      warn(`provide() can only be used inside setup().`)
    }
  } else {
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent && currentInstance.parent.provides
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
    console.log(provides)
  }
}

export const inject = (key, defaultValue) => {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const { provides } = currentInstance
    console.log(provides)
    if (key in provides) {
      return provides[key]
    } else if (arguments.length > 1) { // defaultValue 可以传入 undefined
      return isFunction(defaultValue)
        ? defaultValue()
        : defaultValue
    } else {
      warn(`injection "${String(key)}" not found.`)
    }
  } else {
    warn(`inject() can only be used inside setup() or functional components.`)
  }
}
