import { isString } from 'shared/index'
import type { InterpolationNode, JSChildNode, RootNode, TemplateChildNode, TextNode } from './ast'
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

  push('return')

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

function genInterpolation(
  node: InterpolationNode,
  context: CodegenContext,
) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}
