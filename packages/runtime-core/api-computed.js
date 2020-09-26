import { effect, stop, computed as _computed } from '../reactivity'
import { recordInstanceBoundEffect } from './component'

export const computed = (options) => {
  const computedRef = _computed(options)
  recordInstanceBoundEffect(computedRef.effect) // computed 内部实现也用到了 effect 哦
  return computedRef
}
