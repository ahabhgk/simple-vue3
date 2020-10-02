import { effect, stop } from '../reactivity'
import { getCurrentInstance, recordInstanceBoundEffect } from './component'
import { queueJob, afterPaint } from './scheduler'

export const watchEffect = (cb, { onTrack, onTrigger } = {}) => {
  let cleanup
  const onInvalidate = (fn) => cleanup = e.options.onStop = fn
  const getter = () => {
    if (cleanup) {
      cleanup()
    }
    return cb(onInvalidate)
  }

  const scheduler = (job) => queueJob(() => afterPaint(job))
  const e = effect(getter, {
    onTrack,
    onTrigger,
    lazy: true,
    scheduler,
  })
  scheduler(e) // init run

  recordInstanceBoundEffect(e)
  const instance = getCurrentInstance()

  return () => {
    stop(e)
    if (instance) {
      const { effects } = instance
      const i = effects.indexOf(e)
      if (i > -1) effects.splice(i, 1)
    }
  }
}
