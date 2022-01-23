export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION // 插值
}

export interface Node {
  type: NodeTypes;
}

export type ExpressionNode = SimpleExpressionNode;

export interface SimpleExpressionNode {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
}

// 插值节点类型
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION;
  content: ExpressionNode;
}

export type TemplateChildNode = InterpolationNode;

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
