import 'regenerator-runtime/runtime'

/** @jsx h */
import { ref } from '../../packages/reactivity'
import { h, createRenderer, watchEffect, computed, onErrorCaptured } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const Displayer = {
  setup(props) {
    watchEffect(() => {
      console.log(props.children)
      if (Math.random() > 0.5) throw new Error('Displayer: watchEffect error')
    })

    return () => {
      console.log('render')
      return <div>{props.children}</div>
    }
  }
}

const useLogger = () => {
  let id
  return {
    logger: (v, time = 2000) => new Promise(resolve => {
      id = setTimeout(() => {
        console.log(v)
        resolve()
      }, time)
    }),
    cancel: () => {
      clearTimeout(id)
      id = null
    },
  }
}

const App = {
  setup(props) {
    const count = ref(0)
    const inc = () => count.value++
    const { logger, cancel } = useLogger()

    // watchEffect(async (onInvalidate) => {
    //   onInvalidate(cancel)
    //   await logger(count.value)
    // })

    onErrorCaptured(() => {
      console.log('catch error 1')
    })
    onErrorCaptured(() => {
      console.log('catch error 2')
      return true
    })
    onErrorCaptured(() => {
      console.log('catch error 3')
    })

    return () => (
      <div>
        {/* {count.value % 2 ? <Displayer>{count.value}</Displayer> : null} */}
        <Displayer>{count.value}</Displayer>
        <button onClick={inc}> + </button>
      </div>
    )
  }
}

createApp(App).mount('#root')
