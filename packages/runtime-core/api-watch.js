import { effect, stop } from '../reactivity'
import { recordInstanceBoundEffect } from './component'

export const watchEffect = (cb) => {
  const e = effect(cb)
  recordInstanceBoundEffect(e)
  return () => stop(e)
}
