import { OPEN_BLOCK } from './runtimeHelpers'
import type { TransformContext } from './transform'
import { getVNodeBlockHelper, getVNodeHelper } from './utils'

export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION, // 插值
  ATTRIBUTE, // 属性
  VNODE_CALL, // vnode 调用
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE,
}

export type JSChildNode =
  | VNodeCall
  | ExpressionNode

export type TemplateChildNode = InterpolationNode | TextNode | ElementNode

export interface Node {
  type: NodeTypes
}

// 文本节点类型
export interface TextNode extends Node {
  type: NodeTypes.TEXT
  content: string
}

// 插值节点类型
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION
  content: ExpressionNode
}

export type ExpressionNode = SimpleExpressionNode

export interface SimpleExpressionNode {
  type: NodeTypes.SIMPLE_EXPRESSION
  content: string
}

// 元素节点类型
export type ElementNode = PlainElementNode | ComponentNode | TemplateNode | SlotOutletNode

export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT
  tag: string
  tagType: ElementTypes
  isSelfClosing: boolean
  props: any[]
  children: TemplateChildNode[]
}

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT
  codegenNode: VNodeCall | SimpleExpressionNode
}

export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT
  codegenNode: VNodeCall
}

export interface TemplateNode extends BaseElementNode {
  tagType: ElementTypes.TEMPLATE
  codegenNode: undefined
}

export interface SlotOutletNode extends BaseElementNode {
  tagType: ElementTypes.SLOT
  codegenNode: any
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE
  name: string
  value: TextNode | undefined
}

// 根节点
export interface RootNode extends Node {
  type: NodeTypes.ROOT
  children: TemplateChildNode[]
  codegenNode?: TemplateChildNode | JSChildNode
}

// 父节点
export type ParentNode = RootNode | ElementNode

export interface VNodeCall extends Node {
  type: NodeTypes.VNODE_CALL
  tag: string | symbol
  props: any
  children:
  | TemplateChildNode[] // multiple children
  | SimpleExpressionNode // hoisted
  | undefined
  patchFlag: string | undefined
  isBlock: boolean
  isComponent: boolean
}

/**
 * 创建一个根AST
 * @param children
 */
export function createRoot(children: TemplateChildNode[]): RootNode {
  return {
    type: NodeTypes.ROOT,
    children,
    codegenNode: undefined,
  }
}

export function createVNodeCall(
  context: TransformContext | null,
  tag: VNodeCall['tag'],
  props?: VNodeCall['props'],
  children?: VNodeCall['children'],
  patchFlag?: VNodeCall['patchFlag'],
  isBlock: VNodeCall['isBlock'] = false,
  isComponent: VNodeCall['isComponent'] = false,
): VNodeCall {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK)
      context.helper(getVNodeBlockHelper(isComponent))
    }
    else {
      context.helper(getVNodeHelper(isComponent))
    }
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    isBlock,
    isComponent,
  }
}
