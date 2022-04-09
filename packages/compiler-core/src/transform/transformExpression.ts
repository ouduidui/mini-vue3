import type { SimpleExpressionNode } from 'compiler-core/ast'
import { NodeTypes } from 'compiler-core/ast'
import type { NodeTransform } from 'compiler-core/transform'
import type { ExpressionNode } from './../ast'

export const transformExpression: NodeTransform = (node) => {
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
