export * from './shapeFlags'

const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

// 将所有可枚举属性的值从一个或多个源对象分配到目标对象
export const extend = Object.assign

// 判断是否为字符串
export const isString = (val: unknown): val is string => typeof val === 'string'
// 判断是否为数组
export const isArray = Array.isArray
// 判断是否为函数
export const isFunction = (val: unknown): val is Function => typeof val === 'function'
// 判断是否为对象
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
// 判断对象是否存在该属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

// 判断两个值是否存在变动
export const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue)

// 空函数
export const NOOP = () => {}
// 空对象
export const EMPTY_OBJ = {}
// 空对象
export const EMPTY_ARR = []


/**
 * 利用空间优化执行实行的工具函数
 * @param fn
 */
const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
    // 缓存空间
    const cache: Record<string, string> = Object.create(null)

    return ((str: string) => {
        // 先查看缓存是否存在，不存在则调用函数
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    }) as any
}

const camelizeRE = /-(\w)/g
/**
 * 将中划线命名法转成驼峰命名法
 * @desc hello-world -> helloWorld
 * @private
 */
export const camelize = cacheStringFunction((str: string): string => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

/**
 * 将str首字母大写
 * @private
 */
export const capitalize = cacheStringFunction(
    (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
)

/**
 * 处理为事件Key
 * @private
 */
export const toHandlerKey = cacheStringFunction((str: string) =>
    str ? `on${capitalize(str)}` : ``
)

