import { isTracking, trackEffects, triggerEffects } from './effect';
import { hasChanged } from 'shared/index';
import { createDep, Dep } from './dep';
import { toReactive } from './reactive';

export interface Ref<T = any> {
  value: T;
}

type RefBase<T> = {
  dep?: Dep;
  value: T;
};

/**
 * 依赖收集
 * @param ref
 */
function trackRefValue(ref: RefBase<any>) {
  if (isTracking()) {
    if (!ref.dep) {
      // 如果没有dep的话，初始化一个dep
      ref.dep = createDep();
    }
    // 依赖收集
    trackEffects(ref.dep!);
  }
}

/**
 * 触发依赖
 * @param ref
 */
export function triggerRefValue(ref: RefBase<any>) {
  if (ref.dep) {
    // 触发依赖
    triggerEffects(ref.dep);
  }
}

// ref接口
class RefImpl<T> {
  private _value: T; // 响应式处理后的值
  private _rawValue: T; // 存储原始值，主要用于与newVal作比较
  public dep?: Dep;
  public readonly __v_isRef = true; // 用于isRef检验

  constructor(value) {
    this._rawValue = value;
    this._value = toReactive(value);
  }

  get value() {
    // 依赖收集
    trackRefValue(this);
    // 返回值
    return this._value;
  }

  set value(newVal) {
    // 判断newValue是否发生改变
    if (hasChanged(newVal, this._rawValue)) {
      // 赋值
      this._rawValue = newVal;
      this._value = toReactive(newVal);
      // 触发依赖
      triggerRefValue(this);
    }
  }
}

/**
 * ref响应式处理
 * @param value
 */
export function ref(value: any): Ref<any> {
  return new RefImpl(value);
}

/**
 * 判断是否为ref变量
 * @param r
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef);
}

/**
 * 获取ref的value值，如果不是ref就返回本身
 * @param ref
 */
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref;
}

// proxyRefs的处理器
const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key) => unref(Reflect.get(target, key)),
  set: (target, key, value) => {
    const oldValue = target[key];
    // 如果oldValue是一个ref值，而newValue不是，则需要特殊处理
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value);
    }
  }
};

/**
 * ref代理
 * @param objectWithRefs
 */
export function proxyRefs<T extends object>(objectWithRefs: T) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
