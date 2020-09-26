/** @jsx h */
import { ref } from '../../packages/reactivity'
import { h, createRenderer, watchEffect, computed } from '../../packages/runtime-core'

const Displayer = {
  setup(props) {
    return () => {
      console.log('render')
      return <div>{props.children.value}</div>
    }
  }
}

const App = {
  setup(props) {
    const count = ref(0)
    const inc = () => count.value++

    watchEffect(() => console.log(count.value), { flush: 'sync' })

    return () => (
      <div>
        {/* {count.value % 2 ? <Displayer>{count.value}</Displayer> : null} */}
        <Displayer>{count}</Displayer>
        <button onClick={inc}> + </button>
      </div>
    )
  }
}

createRenderer().render(<App />, document.querySelector('#root'))
