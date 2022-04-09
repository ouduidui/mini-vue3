import type { RootNode, SimpleExpressionNode, TemplateChildNode } from 'compiler-core/ast'
import { NodeTypes } from 'compiler-core/ast'
import type { ExpressionNode } from './../ast'

export function transformExpression(
  node: RootNode | TemplateChildNode,
) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(
      node.content as SimpleExpressionNode,
    )
  }
}

function processExpression(
  node: SimpleExpressionNode,
): ExpressionNode {
  node.content = `_ctx.${node.content}`
  return node
}
