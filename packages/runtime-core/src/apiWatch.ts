import type { Ref } from 'reactivity/ref'
import { isRef } from 'reactivity/ref'
import { currentInstance } from 'runtime-core/component'
import { isReactive } from 'reactivity/reactive'
import { NOOP, hasChanged, isArray, isFunction, isObject, isPlainObject } from 'shared/index'
import type { EffectScheduler } from 'reactivity/effect'
import { ReactiveEffect } from 'reactivity/effect'
import type { SchedulerJob } from 'runtime-core/scheduler'
import { queuePreFlushCb } from 'runtime-core/scheduler'

export type WatchSource<T = any> = Ref<T> | (() => T)

export type WatchEffect = () => void

export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV) => any

export type WatchStopHandle = () => void

export function watchEffect(effect: WatchEffect): WatchStopHandle {
  return doWatch(effect, null)
}

export function watch<T = any>(source: T | WatchSource<T>, cb: any): WatchStopHandle {
  return doWatch(source as any, cb)
}

function doWatch(source: WatchSource | WatchSource[] | WatchEffect, cb: WatchCallback | null): WatchStopHandle {
  const instance = currentInstance
  let getter: () => any
  let deep = false

  if (isRef(source)) {
    getter = () => source.value
  }
  else if (isReactive(source)) {
    getter = () => source
    deep = true
  }
  else if (isArray(source)) {
    getter = () =>
      // eslint-disable-next-line array-callback-return
      source.map((s) => {
        if (isRef(s))
          return s.value
        else if (isReactive(s))
          return s
        else if (isFunction(s))
          return () => s()
      })
  }
  else if (isFunction(source)) {
    getter = () => source()
  }
  else {
    getter = NOOP
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let oldValue = []
  const job: SchedulerJob = () => {
    if (!effect.active) return

    if (cb) {
      const newValue = effect.run()

      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
    else {
      effect.run()
    }
  }

  const scheduler: EffectScheduler = () => {
    if (!instance || instance.isMounted)
      queuePreFlushCb(job)
    else
      job()
  }

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb)
    oldValue = effect.run()
  else
    effect.run()

  return () => {
    effect.stop()
  }
}

function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value))
    return value

  seen = seen || new Set()

  if (seen.has(value)) return value

  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  }
  else if (isArray(value)) {
    for (let i = 0; i < value.length; i++)
      traverse(value[i], seen)
  }
  else if (isPlainObject(value)) {
    for (const key in value)
      traverse((value as any)[key], seen)
  }

  return value
}
