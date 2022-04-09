import { isString } from 'shared/index'
import type { InterpolationNode, JSChildNode, RootNode, SimpleExpressionNode, TemplateChildNode, TextNode } from './ast'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'

type CodegenNode = TemplateChildNode | JSChildNode

interface CodegenOptions {

}

interface CodegenContext extends CodegenOptions {
  code: string
  push(code: string): void
  helper(key: symbol): string
}

export interface CodegenResult {
  code: string
  ast: RootNode
}

function createCodegenContext(): CodegenContext {
  const context = {
    code: '',
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code) {
      context.code += code
    },
  }

  return context
}

export function generate(ast: RootNode): CodegenResult {
  const context = createCodegenContext()
  const {
    push,
  } = context

  genFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(` function ${functionName}(${signature}){`)

  push('return ')
  if (ast.codegenNode)
    genNode(ast.codegenNode, context)
  else
    push('null')

  push('}')

  return {
    code: context.code,
    ast,
  }
}

function genNode(node: CodegenNode | string, context: CodegenContext) {
  if (node === undefined) return
  if (isString(node)) {
    context.push(node)
    return
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode!, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
  }
}

function genText(
  node: TextNode,
  context: CodegenContext,
) {
  context.push(JSON.stringify(node.content))
}

function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
  const { content } = node
  context.push(content)
}
function genInterpolation(
  node: InterpolationNode,
  context: CodegenContext,
) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genFunctionPreamble(ast: RootNode, context: CodegenContext) {
  const {
    push,
  } = context

  const vueBinding = 'Vue'
  const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

  if (ast.helpers.length > 0)
    push(`const { ${ast.helpers.map(aliasHelper).join(',')} } = ${vueBinding}\n`)

  push('return')
}
