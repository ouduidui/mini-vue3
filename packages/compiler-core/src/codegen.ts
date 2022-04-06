import { isString } from 'shared/index'
import type { RootNode } from './ast'
import { NodeTypes } from './ast'

interface CodegenOptions {

}

interface CodegenContext extends CodegenOptions {
  code: string
  push(code: string): void
}

export interface CodegenResult {
  code: string
  ast: RootNode
}

function createCodegenContext(): CodegenContext {
  const context = {
    code: '',
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

function genNode(node: any, context: CodegenContext) {
  if (isString(node)) {
    context.push(node)
    return
  }

  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
  }
}

function genText(
  node: any,
  context: CodegenContext,
) {
  context.push(JSON.stringify(node.content))
}
