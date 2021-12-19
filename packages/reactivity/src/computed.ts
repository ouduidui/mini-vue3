import {isFunction, NOOP} from "shared/index";
import {ReactiveEffect} from "./effect";

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
    get: ComputedGetter<T>
    set: ComputedSetter<T>
}

class ComputedRefImpl<T> {
    private readonly _setter;
    public readonly effect: ReactiveEffect<T>;
    private _dirty = true;  // 为true的话代表需要更新数据
    private _value!: T; // 保存缓存值
    public readonly __v_isRef = true

    constructor(
        getter: ComputedGetter<T>,
        setter: ComputedSetter<T>
    ) {
        this._setter = setter;

        // 新建ReactiveEffect示例，并且配置scheduler函数，避免响应式数据更新时调用run，从而实现computed缓存特性
        this.effect = new ReactiveEffect(getter, () => {
            // 将_dirty设置为true，代表下次调用computed值时需要更新数据
            if (!this._dirty) {
                this._dirty = true;
            }
        });
    }

    get value() {
        if (this._dirty) {  // 更新value
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value;
    }

    set value(newValue: T) {
        this._setter(newValue)
    }
}

/**
 * 计算属性
 * @param getterOrOptions
 */
export function computed<T>(
    getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
    let getter: ComputedGetter<T>
    let setter: ComputedSetter<T>

    // 判断getterOrOptions是getter还是options
    const onlyGetter = isFunction(getterOrOptions);
    if (onlyGetter) {
        getter = getterOrOptions as ComputedGetter<T>
        setter = NOOP
    } else {
        getter = (getterOrOptions as WritableComputedOptions<T>).get
        setter = (getterOrOptions as WritableComputedOptions<T>).set
    }

    return new ComputedRefImpl(getter, setter)
}
