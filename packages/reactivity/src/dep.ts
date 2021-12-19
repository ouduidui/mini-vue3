import { ReactiveEffect } from './effect'

export type Dep = Set<ReactiveEffect>

/**
 * 创建一个依赖收集容器Dep
 * @param effects
 */
export const createDep = (effects?: ReactiveEffect[]): Dep => {
    return new Set<ReactiveEffect>(effects) as Dep
}
