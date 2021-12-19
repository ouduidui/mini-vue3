import {Component, Data} from "runtime-core/component";
import {Ref} from "reactivity/ref";
import {RendererNode, RendererElement} from "./renderer"
import {isObject, isString, ShapeFlags} from "shared/index"

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');

export type VNodeTypes =
    | string
    | VNode
    | Component

export type VNodeRef =
    | string
    | Ref

export type VNodeProps = {
    key?: string | number | symbol,
    ref?: VNodeRef
}

export interface VNode<HostNode = RendererNode,
    HostElement = RendererElement,
    ExtraProps = { [key: string]: any }> {
    type: VNodeTypes,
    props: VNodeProps | null,
    children: VNodeNormalizedChildren

    // DOM
    el: HostNode | null

    shapeFlag: number
    // patchFlag: number
}

type VNodeChildAtom =
    | VNode
    | string
    | number
    | boolean
    | null
    | undefined
    | void

export type VNodeArrayChildren = Array<VNodeChild>

export type VNodeChild = VNodeChildAtom | VNodeArrayChildren

export type VNodeNormalizedChildren =
    | string
    | VNodeArrayChildren
    | null

/**
 * 创建vnode
 * @param type
 * @param props
 * @param children
 */
export function createVNode(
    type: VNodeTypes,
    props: (Data & VNodeProps) | null = null,
    children: unknown = null
): VNode {
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
        : ShapeFlags.COMPONENT

    return createBaseVNode(
        type,
        props,
        children,
        0,
        null,
        shapeFlag
    )
}

function createBaseVNode(
    type: VNodeTypes,
    props: (Data & VNodeProps) | null = null,
    children: unknown = null,
    patchFlag = 0,
    dynamicProps: string[] | null = null,
    shapeFlag = 0
): VNode {
    const vnode = {
        type,
        props,
        children,
        shapeFlag,
        el: null
    } as VNode

    if (children) {
        // |= 按位运算符
        vnode.shapeFlag |= isString(children)
            ? ShapeFlags.TEXT_CHILDREN
            : ShapeFlags.ARRAY_CHILDREN

        if ((vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) && isObject(children)) {
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
        }
    }

    return vnode;
}


export function createTextVNode(text: string = ' ') {
    return createVNode(Text, {}, text);
}
