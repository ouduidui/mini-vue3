import { mutableHandlers, readonlyHandlers, shallowReactiveHandlers, shallowReadonlyHandlers } from './baseHandlers';
import { isObject } from 'shared/index';

export const enum ReactiveFlags {
	IS_REACTIVE = '__v_isReactive',
	IS_READONLY = '__v_isReadonly'
}

/**
 * 生成响应式对象
 * @param target
 */
export function reactive<T extends object>(target: T) {
	return createReactiveObject(target, mutableHandlers);
}

/**
 * 生成浅响应式对象
 * @param target
 */
export function shallowReactive<T extends object>(target: T) {
	return createReactiveObject(target, shallowReactiveHandlers);
}

/**
 * 生成只读对象
 * @param target
 */
export function readonly<T extends object>(target: T) {
	return createReactiveObject(target, readonlyHandlers);
}

/**
 * 生成浅只读对象
 * @param target
 */
export function shallowReadonly<T extends object>(target: T) {
	return createReactiveObject(target, shallowReadonlyHandlers);
}

/**
 * 创建Proxy
 * @param target
 * @param baseHandlers proxy处理器
 */
function createReactiveObject(target: object, baseHandlers: ProxyHandler<any>) {
	return new Proxy(target, baseHandlers);
}

/**
 * 判断是否为响应式对象
 * @param value
 */
export function isReactive(value: any): boolean {
	return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 判断是否为只读对象
 * @param value
 */
export function isReadonly(value: any): boolean {
	return !!(value && value[ReactiveFlags.IS_READONLY]);
}

/**
 * 判断是否由reactive或readonly生成的proxy
 * @param value
 */
export function isProxy(value: any): boolean {
	return isReactive(value) || isReadonly(value);
}

/**
 * 判断是否为对象，是的话进行响应式处理
 * @param value
 */
export const toReactive = <T extends unknown>(value: T): T => (isObject(value) ? reactive(value) : value);
