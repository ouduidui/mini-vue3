import { isArray, isString, isSymbol } from 'shared/index'
import type { CompoundExpressionNode, InterpolationNode, JSChildNode, RootNode, SimpleExpressionNode, TemplateChildNode, TextNode, VNodeCall } from './ast'
import { NodeTypes } from './ast'
import type { CodegenOptions } from './options'
import { OPEN_BLOCK, TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'
import { getVNodeBlockHelper, getVNodeHelper } from './utils'

type CodegenNode = TemplateChildNode | JSChildNode

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

function genNode(node: CodegenNode | symbol | string, context: CodegenContext) {
  if (node === undefined) return
  if (isString(node)) {
    context.push(node)
    return
  }

  if (isSymbol(node)) {
    context.push(context.helper(node))
    return
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode, context)
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
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
  }
}

function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { push, helper } = context
  const { tag, props, children, isBlock, isComponent } = node
  if (isBlock)
    push(`(${helper(OPEN_BLOCK)}(), `)

  const callHelper: symbol = isBlock ? getVNodeBlockHelper(isComponent) : getVNodeHelper(isComponent)
  push(`${helper(callHelper)}(`)
  genNodeList(
    genNullableArgs([tag, props, children]),
    context,
  )
  push(')')
  if (isBlock)
    push(')')
}

function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--)
    if (args[i] != null) break
  return args.slice(0, i + 1).map(arg => arg || 'null')
}

function genNodeList(
  nodes: (string | symbol | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext,
) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node))
      push(node)

    else if (isArray(node))
      genNodeListAsArray(node, context)

    else
      genNode(node, context)

    if (i < nodes.length - 1)
      push(',')
  }
}

function genNodeListAsArray(
  nodes: (string | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext,
) {
  context.push('[')
  genNodeList(nodes, context)
  context.push(']')
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

function genCompoundExpression(
  node: CompoundExpressionNode,
  context: CodegenContext,
) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i]
    if (isString(child))
      context.push(child)
    else
      genNode(child, context)
  }
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
