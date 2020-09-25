import { ReactiveFlags, toRaw, readonly, reactive } from './reactive.js'
import { hasOwn, isObject } from '../../shared/index.js'
import { track, trigger, ITERATE_KEY } from './effect.js'
import { TrackOpTypes, TriggerOpTypes } from './operations.js'

// const getProto = (v) => Reflect.getPrototypeOf(v)

// Set, WeakSet, Map, WeakMap
const get = (target, key, isReadonly) => {
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  !isReadonly && track(rawTarget, TrackOpTypes.GET, rawKey)
  const res = rawTarget.get(rawKey)
  if (isObject(res)) {
    return isReadonly ? readonly(res) : reactive(res)
  }
  return res
}

// Set, WeakSet, Map, WeakMap
const size = (target, isReadonly) => {
  const rawTarget = toRaw(target)
  !isReadonly && track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY)
  return Reflect.get(rawTarget, 'size', rawTarget)
}

// Set, WeakSet, Map, WeakMap
const has = (target, key, isReadonly) => {
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  !isReadonly && track(rawTarget, TrackOpTypes.HAS, rawKey)
  return rawTarget.has(rawKey)
}

// Set, WeakSet
const add = (target, value, isReadonly) => {
  if (isReadonly) throw new Error(`operation ADD failed: target is readonly.`)
  const rawValue = toRaw(value)
  const rawTarget = toRaw(target)
  const hadKey = rawTarget.has(rawValue)
  const res = rawTarget.add(rawValue)
  if (!hadKey) { // 要先执行 add 后再 trigger，保证 effect 中的函数能执行出正确的结果
    trigger(target, TriggerOpTypes.ADD, value)
  }
  return res
}

// Map, WeakMap
const set = (target, key, value, isReadonly) => {
  if (isReadonly) throw new Error(`operation SET failed: target is readonly.`)
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  const rawValue = toRaw(value)
  const hadKey = rawTarget.has(rawKey)
  const res = rawTarget.set(rawKey, rawValue)
  if (hadKey) {
    trigger(rawTarget, TriggerOpTypes.ADD, rawKey)
  } else {
    trigger(rawTarget, TriggerOpTypes.SET, rawKey)
  }
  return res
}

// Set, WeakSet, Map, WeakMap
const deleteEntry = (target, key, isReadonly) => {
  if (isReadonly) throw new Error(`operation DELETE failed: target is readonly.`)
  const rawTarget = toRaw(target)
  const rawKey = toRaw(key)
  const hadKey = rawTarget.has(rawKey)
  const res = rawTarget.delete(rawKey)
  if (hadKey) {
    trigger(rawTarget, TriggerOpTypes.DELETE, rawKey)
  }
  return res
}

// Set, WeakSet, Map, WeakMap
const clear = (target, isReadonly) => {
  if (isReadonly) throw new Error(`operation CLEAR failed: target is readonly.`)
  const rawTarget = toRaw(target)
  const hadKey = rawTarget.size !== 0
  const res = rawTarget.clear()
  if (hadKey) {
    trigger(rawTarget, TriggerOpTypes.CLEAR, undefined)
  }
  return res
}

// Set, WeakSet, Map, WeakMap
const forEach = (target, callback, thisArg, isReadonly) => {
  const rawTarget = toRaw(target)
  !isReadonly && track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY)
  const wrap = (value) => {
    if (isObject(value)) return isReadonly ? readonly(value) : reactive(value)
    return value
  }
  return rawTarget.forEach((value, key) => {
    return callback.call(thisArg, wrap(value), wrap(key), target)
  })
}

const createIterableMethod = (method, isReadonly) => {
  return (target, ...args) => {
    const rawTarget = toRaw(target)
    const rawIterator = rawTarget[method](...args)
    const wrap = (value) => {
      if (isObject(value)) return isReadonly ? readonly(value) : reactive(value)
      return value
    }
    !isReadonly && track(rawTarget, TrackOpTypes.ITERATE, ITERATE_KEY)
    return {
      // iterator protocol
      next() {
        const { value, done } = rawIterator.next()
        return done
          ? { value, done }
          : {
            value: method === 'entries' ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done,
          }
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this // 返回拦截的 Iterator：rawIterator -> proxyIterator(this)
      },
    }
  }
}

const createInstrumentation = (isReadonly) => ({
  get(key) {
    return get(this, key, isReadonly) // 通过 Reflect 调用时 this 是 receiver（proxy 实例）
  },
  get size() {
    return size(this, isReadonly)
  },
  has(key) {
    return has(this, key, isReadonly)
  },
  add(value) {
    return add(this, value, isReadonly)
  },
  set(key, value) {
    return set(this, key, value, isReadonly)
  },
  delete(key) {
    return deleteEntry(this, key, isReadonly)
  },
  clear() {
    return clear(this, isReadonly)
  },
  forEach(callback, thisArg) {
    return forEach(this, callback, thisArg, isReadonly)
  },
  keys(...args) {
    return createIterableMethod('keys', isReadonly)(this, ...args)
  },
  values(...args) {
    return createIterableMethod('values', isReadonly)(this, ...args)
  },
  entries(...args) {
    return createIterableMethod('values', isReadonly)(this, ...args)
  },
  [Symbol.iterator](...args) {
    return createIterableMethod(Symbol.iterator, isReadonly)(this, ...args)
  },
})

function createInstrumentationGetter(isReadonly) {
  const instrumentations = createInstrumentation(isReadonly)
  
  return (target, key, receiver) => {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly
    if (key === ReactiveFlags.RAW) return target

    return Reflect.get(
      hasOwn(instrumentations, key) && key in target
        ? instrumentations
        : target,
      key,
      receiver,
    )
  }
}

export const mutableCollectionHandlers = {
  get: createInstrumentationGetter(false),
}

export const readonlyCollectionHandlers = {
  get: createInstrumentationGetter(true),
}
