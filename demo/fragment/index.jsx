/** @jsx h */
import { effect, reactive, ref } from '../../packages/reactivity'
import { h, watchEffect, computed, Fragment } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const Li = {
  setup(props) {
    return () => <Fragment>
      <li>{props.children}</li>
      <li>{props.children}</li>
    </Fragment>
  }
}

const App = {
  setup(props) {
    const list = reactive([1, 2, 3, 4, 5])
    const shuffle = () => list.sort(() => Math.random() < 0.5 ? 1 : -1)
    const swapTwo = () => {
      const first = Math.floor(Math.random() * list.length)
      const second = Math.floor(Math.random() * list.length)
      ;[list[first], list[second]] = [list[second], list[first]]
      console.log(first, second)
    }
    const insert = () => {
      const num = Math.floor(Math.random() * list.length)
      list.splice(num, 0, Math.random() * list.length)
      console.log(num)
    }

    return () => (
      <div>
        <ul>
          {list.map(e => <Fragment><Li key={e}>{e}</Li></Fragment>)}
        </ul>
        <button onClick={swapTwo}>swapTwo</button>
        <button onClick={shuffle}>shuffle</button>
        <button onClick={insert}>insert</button>
      </div>
    )
  }
}

createApp(App).mount('#root')
