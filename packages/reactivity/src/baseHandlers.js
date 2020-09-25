import { ReactiveFlags, readonly, reactive, readonlyMap, reactiveMap } from './reactive.js'
import { TrackOpTypes, TriggerOpTypes } from './operations.js'
import { track, trigger, ITERATE_KEY } from './effect.js'
import { hasOwn, hasChanged, isObject } from '../../shared/index.js'

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly
    if (
      key === ReactiveFlags.RAW &&
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)
    ) {
      return target
    }

    const res = Reflect.get(target, key, receiver)
    if (!isReadonly) track(target, TrackOpTypes.GET, key)
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}

const get = createGetter()
const readonlyGet = createGetter(true)

function createSetter() {
  return function set(target, key, value, receiver) {
    const oldValue = target[key]
    const res = Reflect.set(target, key, value, receiver)
    if (target === receiver[ReactiveFlags.RAW] && hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key)
    }
    return res
  }
}

const set = createSetter()

// delete proxy.key
function deleteProperty(target, key) {
  const result = Reflect.deleteProperty(target, key)
  if (result && hasOwn(target, key)) trigger(target, TriggerOpTypes.DELETE, key)
  return result
}

// 'key' in proxy
function has(target, key) {
  track(target, TrackOpTypes.HAS, key)
  return Reflect.has(target, key)
}

// Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、
// Object.keys(proxy)、for...in
// 例如：effect(() => console.log(Object.keys(proxy))) 需要在 proxy 新增或删除元素时触发
function ownKeys(target) {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  },
  deleteProperty(target, key) {
    console.warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  },
}
