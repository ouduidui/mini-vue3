import {VNode} from "runtime-core/vnode";
import {EMPTY_OBJ, isFunction, isObject} from "shared/index";
import {proxyRefs} from "reactivity/ref";
import {PublicInstanceProxyHandlers} from "runtime-core/componentPublicInstance";
import {initProps} from "runtime-core/componentProps";
import {shallowReadonly} from "reactivity/reactive";
import {emit, EmitFn} from "runtime-core/componentEmit";
import {initSlots, InternalSlots} from "runtime-core/componentSlots";


export type Component = any;

export type Data = Record<string, unknown>

export interface ComponentInternalInstance {
    vnode: VNode,
    type: any,
    parent: ComponentInternalInstance | null,
    render: any,

    proxy: any  // 代理this

    ctx: Data,

    provides: Data,

    // state
    setupState: Data,
    props: Data,
    slots: InternalSlots,
    emit: EmitFn
}

export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance = (): ComponentInternalInstance | null => currentInstance;

export const setCurrentInstance = (instance: ComponentInternalInstance) => currentInstance = instance

export const unsetCurrentInstance = () => currentInstance = null

/**
 * 创建组件实例
 * @param vnode
 * @param parent
 */
export function createComponentInstance(
    vnode: VNode,
    parent: ComponentInternalInstance | null
): ComponentInternalInstance {
    const instance: ComponentInternalInstance = {
        vnode,
        type: vnode.type,
        parent,
        render: null,
        proxy: null,
        provides: parent ? parent.provides : EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        props: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        emit: null!,
        ctx: EMPTY_OBJ
    }

    instance.ctx = {_: instance};
    instance.emit = emit.bind(null, instance);
    return instance;
}

/**
 * 初始化组件
 * @param instance
 */
export function setupComponent(instance: ComponentInternalInstance) {
    const {props, children} = instance.vnode;
    // 初始化属性
    initProps(instance, props);

    // 初始化插槽
    initSlots(instance, children);

    // 处理成有状态的组件
    setupStatefulComponent(instance);
}

/**
 * 组件状态化
 * @param instance
 */
function setupStatefulComponent(instance: ComponentInternalInstance) {
    const Component = instance.type;
    const {setup} = Component;

    // 初始化组件代理
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
    if (setup) {  // 处理setup钩子
        setCurrentInstance(instance);

        const setupResult = setup(
            shallowReadonly(instance.props), {
                emit: instance.emit
            }
        );

        unsetCurrentInstance();

        // 处理setup返回值
        handleSetupResult(instance, setupResult)
    }
}

/**
 * 处理setup返回值
 * @param instance
 * @param setupResult
 */
function handleSetupResult(instance: ComponentInternalInstance, setupResult: unknown) {
    if (isFunction(setupResult)) {
        // TODO function
    } else if (isObject(setupResult)) {
        // 将setupResult响应式，并赋值给实例
        instance.setupState = proxyRefs(setupResult);
    }

    // 当组件状态化后，实现render函数
    finishComponentSetup(instance)
}

/**
 * 当组件状态化后，实现render函数
 * @param instance
 */
function finishComponentSetup(instance: ComponentInternalInstance) {
    const Component = instance.type;

    if (Component.render) {
        instance.render = Component.render;
    }
}
