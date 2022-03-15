import { extend } from 'shared/index'
import type { Dep } from './dep'
import { createDep } from './dep'

// 存储正在被收集依赖的ReactiveEffect实例
let activeEffect: ReactiveEffect | undefined

// 判断是否依赖收集
let shouldTrack = true
// 存放修改状态前 shouldTrack 状态
const trackStack: boolean[] = []

export type EffectScheduler = (...args: any[]) => any

/**
 * 暂停依赖收集
 */
export function pauseTrack() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

/**
 * 重置依赖收集
 */
export function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export class ReactiveEffect<T = any> {
  public fn: () => T
  public scheduler: EffectScheduler | null = null
  // 存储那些收集到该effect的dep
  public deps: Dep[] = []
  active = true
  onStop?: () => void

  constructor(fn, scheduler: EffectScheduler | null = null) {
    this.fn = fn // 保存fn
    this.scheduler = scheduler
  }

  run() {
    // 当active为false时，即已经取消响应式监听，则无需再进行依赖收集
    if (!this.active)
      return this.fn() // 执行fn函数，并将结果返回

    activeEffect = this // 将实例赋值给activeEffect，用于依赖收集
    shouldTrack = true
    const res = this.fn()
    shouldTrack = false
    activeEffect = undefined
    return res
  }

  stop() {
    if (this.active) {
      // 从依赖中将该effect删除
      cleanupEffect(this)
      // 执行onStop函数
      if (this.onStop)
        this.onStop()

      // 将active设置为false，避免反复调用stop反复
      this.active = false
    }
  }
}

/**
 * 将effect从依赖中清空
 * @param effect {ReactiveEffect}
 */
function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })
  // 清空掉effect.deps
  effect.deps.length = 0
}

type KeyToDepMap = Map<Dep, any>
// 用于存储target依赖  target -> depsMap
const targetMap = new WeakMap<any, KeyToDepMap>()

/**
 * 依赖收集
 * @desc  通过target和key拿到对应的dep依赖收集容器（没有则新建），然后将对应的ReactiveEffect实例存储进去
 * @param target 目标对象
 * @param key key值
 */
export function track(target: object, key) {
  // 判断是否可以收集依赖
  if (!isTracking()) return

  // 获取对应依赖的depsMap
  let depsMap = targetMap.get(target)
  // 没有则初始化
  if (!depsMap)
    targetMap.set(target, (depsMap = new Map()))

  // 获取对应key值的依赖dep
  let dep = depsMap.get(key)
  // 没有则初始化
  if (!dep)
    depsMap.set(key, (dep = createDep()))

  // 存储依赖
  trackEffects(dep)
}

/**
 * 收集effects
 * @param dep
 */
export function trackEffects(dep: Dep) {
  if (!dep.has(activeEffect!)) {
    // 将activeEffect存储到dep中
    dep.add(activeEffect! /* 非空断言 */)
    // 反向存储dep
    activeEffect!.deps.push(dep)
  }
}

/**
 * 判断是否可以收集依赖
 */
export function isTracking(): boolean {
  return shouldTrack && activeEffect !== undefined
}

/**
 * 触发依赖
 * @desc 根据target和key获取到对应的dep，然后遍历其中所有的依赖
 * @param target
 * @param key
 */
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  // 执行effects
  triggerEffects(dep)
}

/**
 * 遍历所有依赖，执行effect
 * @param dep
 */
export function triggerEffects(dep: Dep) {
  // 遍历所有依赖，遍历执行
  for (const effect of dep) {
    if (effect.scheduler) {
      // 如果存在scheduler调度函数，则执行
      effect.scheduler()
    }
    else {
      // 否则执行run函数
      effect.run()
    }
  }
}

interface ReactiveEffectOptions {
  scheduler?: EffectScheduler // 调度函数
  onStop?: () => void // 停止监听时触发
}

interface ReactiveEffectRunner<T = any> {
  (): T

  effect: ReactiveEffect
}

/**
 * 主要负责依赖收集
 * @param fn {Function} 依赖方法
 * @param options {ReactiveEffectOptions} 选项
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions): ReactiveEffectRunner {
  // 新建ReactiveEffect示例，将fn存储起来
  const _effect = new ReactiveEffect(fn)

  if (options) {
    // 合并options到_effect中
    extend(_effect, options)
  }

  // 执行run方法，调用fn函数，从而触发fn中的响应式数据进行依赖收集
  _effect.run()

  // 返回一个runner函数
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

/**
 * 停止runner的响应式监听
 * @param runner
 */
export function stop(runner: ReactiveEffectRunner) {
  return runner.effect.stop()
}
