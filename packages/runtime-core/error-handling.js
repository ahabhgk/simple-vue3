import { isPromise } from '../shared'
import { getCurrentInstance } from './component'

export const onErrorCaptured = (errorHandler) => {
  const instance = getCurrentInstance()
  if (instance.errorCapturedHooks == null) {
    instance.errorCapturedHooks = []
  }
  instance.errorCapturedHooks.push(errorHandler)
}

export const callWithErrorHandling = (fn, instance, args = []) => {
  let res
  try {
    res = fn(...args)
  } catch (e) {
    handleError(e, instance)
  }
  return res
}

export const callWithAsyncErrorHandling = (fn, instance, args = []) => {
  const res = callWithErrorHandling(fn, instance, args)
  if (res && isPromise(res)) {
    res.catch(e => {
      handleError(e, instance)
    })
  }
  return res
}

const handleError = (error, instance) => {
  if (instance) {
    let cur = instance.parent
    while (cur) {
      const errorCapturedHooks = cur.errorCapturedHooks
      if (errorCapturedHooks) {
        for (let errorHandler of errorCapturedHooks) {
          if (errorHandler(error)) {
            return
          }
        }
      }
      cur = cur.parent
    }
  }
  console.warn('Unhandled error', error)
}
