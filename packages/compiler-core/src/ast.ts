export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION, // 插值
  ATTRIBUTE // 属性
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE
}

export type TemplateChildNode = InterpolationNode | TextNode | ElementNode;

export interface Node {
  type: NodeTypes;
}

// 文本节点类型
export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}

// 插值节点类型
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION;
  content: ExpressionNode;
}

export type ExpressionNode = SimpleExpressionNode;

export interface SimpleExpressionNode {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
}

// 元素节点类型
export type ElementNode = PlainElementNode | ComponentNode | TemplateNode | SlotOutletNode;

export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT;
  tag: string;
  tagType: ElementTypes;
  isSelfClosing: boolean;
  props: any[];
  children: TemplateChildNode[];
}

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT;
}

export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT;
}

export interface TemplateNode extends BaseElementNode {
  tagType: ElementTypes.TEMPLATE;
}

export interface SlotOutletNode extends BaseElementNode {
  tagType: ElementTypes.SLOT;
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}

// 根节点
export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
}

/**
 * 创建一个根AST
 * @param children
 */
export function createRoot(children: TemplateChildNode[]): RootNode {
  return {
    type: NodeTypes.ROOT,
    children
  };
}
