/** @jsx h */
import { ref } from '../../packages/reactivity'
import { h, createRenderer, watchEffect, computed, provide, inject } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const CounterKey = Symbol('Counter')

const Displayer = {
  setup() {
    const counter = inject(CounterKey)
    return () => <div>{counter.value}</div>
  }
}

const Wrapper = {
  setup() {
    return () => <div><Displayer /></div>
  }
}

const Counter = {
  setup(props) {
    const count = ref(0)
    const inc = () => count.value++
    provide(CounterKey, count)

    return () => (
      <div>
        <Wrapper />
        <button onClick={inc}> + </button>
      </div>
    )
  }
}

const App = {
  setup(props) {
    return () => (
      <Counter />
    )
  }
}

createApp(App).mount('#root')
