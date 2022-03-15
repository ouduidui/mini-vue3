import { currentInstance } from 'runtime-core/component'
import { isFunction } from 'shared/index'

export interface InjectionKey<T> extends Symbol {}

export function provide<T>(key: InjectionKey<T> | string | number, value: T) {
  if (currentInstance) {
    let provides = currentInstance.provides
    const parentProvides = currentInstance.parent && currentInstance.parent.provides

    // 初始化的时候，也就是组件第一次调用provide的时候，绑定通过原型链的方式绑定父级provide
    if (provides === parentProvides)
      provides = currentInstance.provides = Object.create(parentProvides)

    provides[key as string] = value
  }
}

export function inject(key: InjectionKey<any> | string, defaultValue?: unknown) {
  const instance = currentInstance
  if (instance) {
    const provides = instance.parent && instance.provides

    if (provides && (key as string | symbol) in provides)
      return provides[key as string]
    else if (defaultValue)
      return isFunction(defaultValue) ? defaultValue.call(instance.proxy) : defaultValue
  }
}
