import { isObject } from '../../shared/index.js'
import { mutableHandlers, readonlyHandlers } from './baseHandlers.js'
import { mutableCollectionHandlers, readonlyCollectionHandlers } from './collectionHandler.js'

export const ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw',
}

const TargetType = {
  COMMON: 'COMMON',
  COLLECTION: 'COLLECTION',
  INVALID: 'INVALID',
}

export const reactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()

const getTargetType = (target) => {
  const getTypeString = (target) => {
    return Object.prototype.toString.call(target).slice(8, -1)
  }
  const typeString = getTypeString(target)
  switch (typeString) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    default:
      return TargetType.INVALID
  }
}

function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
  if (!isObject(target)) {
    throw new Error(`value cannot be made reactive: ${String(target)}`)
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // 已经有了对应的 proxy
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // 获取 typeString 判断是不是 collectionType
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }

  const observed = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  proxyMap.set(target, observed)
  return observed
}

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers)
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers)
}

export function isReactive(target) {
  return !!(target && target[ReactiveFlags.IS_REACTIVE])
}

export function isReadonly(target) {
  return !!(target && target[ReactiveFlags.IS_READONLY])
}

export function toRaw(ob) {
  return (ob && toRaw(ob[ReactiveFlags.RAW])) || ob
}
