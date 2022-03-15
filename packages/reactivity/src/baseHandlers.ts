import { extend, isObject } from 'shared/index'
import { track, trigger } from './effect'
import { ReactiveFlags, reactive, readonly } from './reactive'

const get = createGetter() // 响应式
const shallowGet = createGetter(false, true) // 浅响应式
const readonlyGet = createGetter(true) // 只读
const shallowReadonlyGet = createGetter(true, true) // 浅只读

/**
 * 创建Proxy的get处理函数
 * @param isReadonly {boolean} 是否只读
 * @param shallow {boolean} 是否浅处理
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    // 用于isReactive方法，判断是否为reactive
    if (key === ReactiveFlags.IS_REACTIVE)
      return !isReadonly

    if (key === ReactiveFlags.IS_READONLY)
      return isReadonly

    // 获取对应结果
    const res = Reflect.get(target, key)

    if (!isReadonly) {
      // 只读情况下不需要依赖收集
      track(target, key) // 依赖收集
    }

    // 浅处理无需只想下列的递归处理
    if (shallow)
      return res

    // 如果res是对象的话，再次进行处理
    if (isObject(res))
      return isReadonly ? readonly(res) : reactive(res)

    // 将结果返回出去
    return res
  }
}

const set = createSetter() // 响应式

/**
 * 创建Proxy的set处理函数
 */
function createSetter() {
  return function set(target, key, value) {
    // 执行set操作，并获取新的value值
    const res = Reflect.set(target, key, value)

    // 触发依赖
    trigger(target, key)

    // 将结果返回
    return res
  }
}

// 可变的Proxy的handler
export const mutableHandlers: ProxyHandler<object> = {
  get, // 拦截获取操作
  set, // 拦截设置操作
}

// 浅处理响应式的handler
export const shallowReactiveHandlers = extend({}, mutableHandlers, { get: shallowGet })

// 只读的handler
export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set(target, key) {
    // 当被设置时发出警告
    console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target)
    return true
  },
}

// 浅处理只读的handler
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet })
