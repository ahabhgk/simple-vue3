import { reactive, effect } from '../packages/reactivity/index.js'

const $inc = document.querySelector('.inc')
const $dec = document.querySelector('.dec')
const $count = document.querySelector('.count')

const state = reactive({ count: 0 })

effect(() => {
  $count.innerHTML = state.count
}, {
  onTrack(e) {
    console.log(e)
  }
})

$inc.addEventListener('click', () => {
  state.count++
})

$dec.addEventListener('click', () => {
  state.count--
})
