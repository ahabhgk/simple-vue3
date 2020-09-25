import { effect, stop, computed as _computed } from '../reactivity'
import { recordInstanceBoundEffect } from './component'

export const computed = (options) => {
  const ret = _computed(options)
  recordInstanceBoundEffect(ret.effect)
  return ret
}
