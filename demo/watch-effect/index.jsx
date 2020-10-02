import 'regenerator-runtime/runtime'

/** @jsx h */
import { ref } from '../../packages/reactivity'
import { h, createRenderer, watchEffect, computed } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const Displayer = {
  setup(props) {
    return () => {
      console.log('render')
      return <div>{props.children.value}</div>
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

    watchEffect(async (onInvalidate) => {
      onInvalidate(cancel)
      await logger(count.value)
    })

    return () => (
      <div>
        {/* {count.value % 2 ? <Displayer>{count.value}</Displayer> : null} */}
        <Displayer>{count}</Displayer>
        <button onClick={inc}> + </button>
      </div>
    )
  }
}

createApp(App).mount('#root')
