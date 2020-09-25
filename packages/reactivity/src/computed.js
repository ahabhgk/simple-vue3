import { isFunction } from '../../shared/index.js'
import { effect, trigger } from './effect.js'
import { customRef } from './ref.js'

export function computed(options) {
  let getter
  let setter
  if (isFunction(options)) {
    getter = options
    setter = () => {}
  } else {
    getter = options.get
    setter = options.set
  }

  return createComputedRef(getter, setter)
}

function createComputedRef(getter, setter) {
  let dirty = true
  let value
  const computedRef = customRef((track, trigger) => {
    const computeEffect = effect(getter, {
      lazy: true,
      scheduler() {
        if (!dirty) {
          dirty = true
          trigger()
        }
      },
    })
    computedRef.effect = computeEffect // runtime-core 组件拿 effect 用
    return {
      get: () => {
        if (dirty) {
          value = computeEffect()
          dirty = false
        }
        track()
        return value
      },
      set: (newValue) => {
        setter(newValue)
      },
    }
  })
  return computedRef
}
