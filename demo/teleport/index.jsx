/** @jsx h */
import { effect, reactive, ref } from '../../packages/reactivity'
import { h, watchEffect, computed, Teleport } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const App = {
  setup(props) {
    const isShow = ref(false)
    const msg = ref('')
    const isOk = ref(false)
    const handleMsgChange = (e) => {
      msg.value = e.target.value
    }
    const toggle = () => isShow.value = !isShow.value

    watchEffect((onInvalidate) => {
      const timer = setInterval(() => isOk.value = !isOk.value, 300)
      onInvalidate(() => clearInterval(timer))
    })

    return () => (
      <div>
        <input type="text" onInput={handleMsgChange} />
        <button onClick={toggle}>toggle</button>
        {isShow.value ? <Teleport to="#tel">
          {isOk.value ? <div>{msg.value}</div> : null}
        </Teleport> : null}
      </div>
    )
  }
}

createApp(App).mount('#root')
