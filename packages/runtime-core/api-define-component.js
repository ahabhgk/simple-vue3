import { ref } from '../reactivity'
import { isFunction } from '../shared'
import { h } from './vnode'
import { getCurrentInstance } from './component'
import { getParentSuspense } from './components/suspense'
import { handleError } from './error-handling'

export const defineComponent = (options) => isFunction(options) ? { setup: options } : options

export const defineAsyncComponent = (options) => {
  if (isFunction(options)) options = { loader: options }

  const {
    loader,
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout,
    suspensible = true,
    onError,
  } = options

  let resolvedComponent = null

  let retries = 0
  const retry = () => {
    retries++
    return load()
  }

  const load = () => loader()
    .catch(e => {
      if (onError) {
        return new Promise((resolve, reject) => {
          onError(
            e,
            () => resolve(retry()),
            () => reject(e),
            retries,
          )
        })
      } else {
        throw e
      }
    })
    .then((comp) => {
      if (
        comp &&
        (comp.__esModule || comp[Symbol.toStringTag] === 'Module')
      ) {
        comp = comp.default
      }
      resolvedComponent = comp
      return comp
    })

  return defineComponent((props) => {
    const instance = getCurrentInstance()
    if (resolvedComponent) return () => h(resolvedComponent, props)
    if (suspensible && getParentSuspense(instance.vnode)) {
      return load()
        .then(comp => {
          return () => h(comp, props)
        })
        .catch(e => {
          handleError(e, instance)
          return () => errorComponent ? h(errorComponent, { error: e }) : null
        })
    }

    const error = ref()
    const loading = ref(true)
    const delaying = ref(!!delay) // 延后出现 LoadingComponent

    if (delay) {
      setTimeout(() => delaying.value = false, delay)
    }
    if (timeout) {
      setTimeout(() => {
        // 超时
        if (loading.value && !error.value) {
          const err = new Error(`Async component timed out after ${timeout}ms.`)
          handleError(err, instance)
          error.value = err
        }
      }, timeout)
    }

    load()
      .then(() => loading.value = false)
      .catch(e => {
        handleError(e, instance)
        error.value = e
      })

    return () => {
      if (!loading.value && resolvedComponent) return h(resolvedComponent, props)
      // loading.value === true
      else if (error.value && errorComponent) return h(errorComponent, { error: error.value })
      else if (loadingComponent && !delaying.value) return h(loadingComponent)
      return null
    }
  })
}
