import { reactive } from './reactive.js'
import { track, trigger } from './effect.js'
import { TrackOpTypes, TriggerOpTypes } from './operations.js'

export const RefFlags = {
  IS_REF: '__v_isRef',
}

export function customRef(factory) {
  const { get, set } = factory(
    () => track(ref, TrackOpTypes.GET, 'value'),
    () => trigger(ref, TriggerOpTypes.SET, 'value'),
  )
  const ref = {
    [RefFlags.IS_REF]: true,
    get value() {
      return get()
    },
    set value(v) {
      set(v)
    },
  }
  return ref
}

export function ref(value) {
  return customRef((track, trigger) => ({
    get: () => {
      track()
      return value
    },
    set: (newValue) => {
      value = newValue
      trigger()
    },
  }))
}

export const isRef = v => v && v[RefFlags.IS_REF] === true
