import { TriggerOpTypes } from './operations.js'
import { isArray } from '../../shared/index.js'

const targetMap = new WeakMap()

let activeEffect
let effectStack = []

export const ITERATE_KEY = Symbol('iterate')

export function isEffect(fn) {
  return fn && fn._isEffect === true
}

export function effect(fn, options = {}) {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}

export function stop(effect) {
  if (effect.active) {
    cleanup(effect)
    if (effect.options.onStop) effect.options.onStop()
    effect.active = false
  }
}

function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effect.active) return effect.options.scheduler ? undefined : fn()
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        effectStack.push(effect)
        activeEffect = effect
        return fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = []
  effect.options = options
  return effect
}

function cleanup(effect) {
  const { deps } = effect
  deps.forEach(dep => dep.delete(effect)) // deps 中的 dep 清 effect
  deps.length = 0 // 清空 effect 的 deps
}

export function track(target, type, key) {
  if (activeEffect == null) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
    if (activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      })
    }
  }
}

export function trigger(target, type, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  // 需要新建一个 set，如果直接 const effect = depsMap.get(key)
  // effect 函数执行时 track 的依赖就也会在这一轮 trigger 执行，导致无限循环
  const effects = new Set()
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        // 不要添加自己当前的 effect，否则之后 run（mutate）的时候
        // 遇到 effect(() => foo.value++) 会导致无限循环
        if (effect !== activeEffect) effects.add(effect)
      })
    }
  }

  // SET | ADD | DELETE
  if (key !== undefined) {
    add(depsMap.get(key))
  }
  const shouldTriggerIteration =
    (type === TriggerOpTypes.ADD) ||
    (type === TriggerOpTypes.DELETE)
  // iteration key on ADD | DELETE
  if (shouldTriggerIteration) {
    add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
  }

  const run = (effect) => {
    if (effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
      })
    }
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }
  effects.forEach(run)
}
