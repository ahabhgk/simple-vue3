import { ReactiveFlags, readonly, reactive } from './reactive.js'
import { TrackOpTypes, TriggerOpTypes } from './operations.js'
import { track, trigger } from './effect.js'

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly
    if (
      key === ReactiveFlags.RAW &&
      receiver === (isReadonly
        ? target[ReactiveFlags.READONLY]
        : target[ReactiveFlags.REACTIVE])
    ) {
      return target
    }

    const res = Reflect.get(target, key, receiver)
    if (!isReadonly) track(target, key)
    if (res !== null && typeof res === 'object') {
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
    if (target === receiver[ReactiveFlags.RAW]) {
      trigger(target, key)
    }
    return res
  }
}

const set = createSetter()

export const mutableHandlers = {
  get,
  set,
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
}
