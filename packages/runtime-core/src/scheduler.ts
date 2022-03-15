/**
 * 异步更新机制
 *
 * 在vue3中分为三种任务：job、pre、post；执行顺序为pre、job、post；
 *  - pre任务常用于watch api（watch api也可以自定义为其他任务类型，默认为pre）
 *  - job任务常用于组件更新
 *  - post任务常用于组件生命周期hook函数
 */

import { isArray } from 'shared/index'

export type SchedulerJobs = SchedulerJob | SchedulerJob[]

export interface SchedulerJob extends Function {
  id?: number
}

// 判断是否正在执行异步任务
let isFlushing = false
// 判断是否预备执行异步任务，也就是将异步任务加入异步队列中
let isFlushPending = false

// job类型任务队列
const queue: SchedulerJob[] = []
// 正在执行的job任务下标
let flushIndex = 0

// 等待处理的Pre任务队列
const pendingPreFlushCbs: SchedulerJob[] = []
// 正在异步执行的Pre任务队列
let activePreFlushCbs: SchedulerJob[] | null = null
// 当前正在执行的Pre任务下标
let preFlushIndex = 0

// 等待处理的Post任务队列
const pendingPostFlushCbs: SchedulerJob[] = []
// 正在异步执行的Post任务队列
let activePostFlushCbs: SchedulerJob[] | null = null
// 当前正在执行的Post任务下标
let postFlushIndex = 0

// 默认Promise
const resolvedPromise: Promise<any> = Promise.resolve()
// 当前执行的异步队列Promise
let currentFlushPromise: Promise<void> | null = null

const getId = (job: SchedulerJob): number => (job.id == null ? Infinity : job.id)

/**
 * 在下一个异步周期执行fn
 * @param fn
 */
export function nextTick<T = void>(fn?: (this: T) => void) {
  // 获取Promise
  // 如当前正在执行异步操作，可以直接使用当前异步操作的Promise
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

/**
 * 插入队列
 * @param cb
 * @param activeQueue
 * @param pendingQueue
 * @param index
 */
function queueCb(cb: SchedulerJobs, activeQueue: SchedulerJob[] | null, pendingQueue: SchedulerJob[], index: number) {
  if (!isArray(cb)) {
    // 判断是否存在同样的cb，不存在再插入
    if (!activeQueue || !activeQueue.includes(cb, index))
      pendingQueue.push(cb)
  }
  else {
    pendingQueue.push(...cb)
  }
  // 进行冲洗队列
  queueFlush()
}

/**
 * 添加job类型任务
 * @param job
 */
export function queueJob(job: SchedulerJob) {
  // 如果queue队列为空，直接插入队列
  // 如果queue有值，判断未执行的任务是否有相同的，没有则插入队列
  if (!queue.length || !queue.includes(job, flushIndex))
    queue.push(job)

  // 进行冲洗队列
  queueFlush()
}

/**
 * 添加pre类型任务
 * @param cb
 */
export function queuePreFlushCb(cb: SchedulerJob) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex)
}

/**
 * 添加post类型任务
 * @param cb
 */
export function queuePostFlushCb(cb: SchedulerJobs) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex)
}

/**
 * 冲洗队列
 */
function queueFlush() {
  // 判断是否正在冲洗队列或执行异步操作
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    // 将冲洗任务加入异步队列
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

/**
 * 冲洗任务
 */
function flushJobs() {
  // 修改状态
  isFlushPending = false
  isFlushing = true
  // 冲洗Pre任务
  flushPreFlushCbs()

  // 冲洗job任务
  // 将queue队列根据id排序
  queue.sort((a, b) => getId(a) - getId(b))
  try {
    // 遍历queue队列，一一执行
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      job()
    }
  }
  finally {
    // 重置Job队列
    flushIndex = 0
    queue.length = 0

    // 冲洗Post任务
    flushPostFlushCbs()

    // 重置
    isFlushing = false
    currentFlushPromise = null

    // 最后判断在本次异步执行过程中队列中是否会有新的值
    // 是的话重新调用flushJobs进行冲洗
    if (queue.length || pendingPreFlushCbs.length || pendingPostFlushCbs.length)
      flushJobs()
  }
}

/**
 * 冲洗执行Pre任务
 */
export function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    // 将pendingPreFlushCbs队列更新到activePreFlushCbs队列，并去重
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
    // 清空pendingPreFlushCbs
    pendingPreFlushCbs.length = 0

    // 遍历activePreFlushCbs，一一调用执行
    for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++)
      activePreFlushCbs[preFlushIndex]()

    // 重置
    activePreFlushCbs = null
    preFlushIndex = 0

    // 自调用，以防在本次执行过程pendingPreFlushCbs有新值
    // 为了确保pre任务在job任务之前执行
    flushPreFlushCbs()
  }
}

/**
 * 冲洗Post任务
 */
export function flushPostFlushCbs() {
  if (pendingPostFlushCbs.length) {
    // 将pendingPostFlushCbs赋值给deduped并进行去重
    const deduped = [...new Set(pendingPostFlushCbs)]
    // 清空pendingPostFlushCbs
    pendingPostFlushCbs.length = 0

    if (activePostFlushCbs) {
      // 如果当前activePostFlushCbs有值的话，则代表正在进行冲洗Post任务
      // 因此直接将deduped插入activePostFlushCbs队列即可
      activePostFlushCbs.push(...deduped)
      return
    }

    // 赋值activePostFlushCbs
    activePostFlushCbs = deduped
    // 根据id进行排序
    activePostFlushCbs.sort((a, b) => getId(a) - getId(b))

    // 遍历执行
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++)
      activePostFlushCbs[postFlushIndex]()

    // 重置
    activePostFlushCbs = null
    postFlushIndex = 0
  }
}
