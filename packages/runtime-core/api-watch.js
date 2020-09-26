import { effect, stop } from '../reactivity'
import { getCurrentInstance, recordInstanceBoundEffect } from './component'
import { queueSyncJob } from './scheduler'

export const watchEffect = (cb, { onTrack, onTrigger } = {}) => {
  const e = effect(cb, {
    onTrack,
    onTrigger,
    scheduler: queueSyncJob,
  })

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
