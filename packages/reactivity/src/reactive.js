import { def } from '../../shared/index.js'
import { mutableHandlers, readonlyHandlers } from './handlers.js'

export const ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw',
  REACTIVE: '__v_reactive',
  READONLY: '__v_readonly'
}

export function reactive(target) {
  if (isReactive(target)) return target
  if (target[ReactiveFlags.REACTIVE] != null)
    return target[ReactiveFlags.REACTIVE]

  const observed = new Proxy(target, mutableHandlers)
  def(target, ReactiveFlags.REACTIVE, observed)
  return observed
}

export function readonly(target) {
  if (isReadonly(target)) return target
  if (target[ReactiveFlags.READONLY] != null)
    return target[ReactiveFlags.READONLY]

  const observed = new Proxy(target, readonlyHandlers)
  def(target, ReactiveFlags.READONLY, observed)
  return observed
}

export function isReactive(target) {
  return !!(target && target[ReactiveFlags.IS_REACTIVE])
}
export function isReadonly(target) {
  return !!(target && target[ReactiveFlags.IS_READONLY])
}
