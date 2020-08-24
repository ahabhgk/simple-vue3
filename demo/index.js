import { reactive, effect } from '../packages/reactivity/index.js'

const $inc = document.querySelector('.inc')
const $dec = document.querySelector('.dec')
const $count = document.querySelector('.count')

const state = reactive({ count: 0 })

effect(() => {
  console.log(state.count)
  $count.innerHTML = state.count
  // debugger
}, {
  onTrack(e) {
    console.log(e)
  }
})

$inc.addEventListener('click', () => {
  // debugger
  state.count++
})

$dec.addEventListener('click', () => {
  // debugger
  state.count--
})
