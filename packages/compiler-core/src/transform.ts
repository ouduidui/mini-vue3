import { isArray } from 'shared/index'
import type { ParentNode, RootNode, TemplateChildNode } from './ast'
import { NodeTypes, createVNodeCall } from './ast'
import type { TransformOptions } from './options'
import { FRAGMENT, TO_DISPLAY_STRING } from './runtimeHelpers'
import { isSingleElementRoot } from './transform/hoistStatic'

export interface TransformContext {
  nodeTransforms: NodeTransform[]
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
}

export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | (() => void) | (() => void)[]

/**
 * 初始化上下文
 * @param root
 * @param options
 */
function createTransformContext(
  root: RootNode, {
    nodeTransforms = [],
  }: TransformOptions): TransformContext {
  const context = {
    nodeTransforms,
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
  }
  return context
}

/**
 * 转义AST树
 * @param root
 * @param options
 */
export function transform(root: RootNode, options: TransformOptions) {
  // 创建上下文
  const context = createTransformContext(root, options)
  // 递归遍历节点
  traverseNode(root, context)

  createRootCodegen(root, context)

  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root: RootNode, context: TransformContext) {
  const { helper } = context
  const { children } = root
  if (children.length === 1) {
    const child = children[0]
    if (isSingleElementRoot(root, child) && child.codegenNode)
      root.codegenNode = child.codegenNode
    else
      root.codegenNode = child
  }
  else if (children.length > 1) {
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      root.children,
    )
  }
}

/**
 * 递归遍历节点
 * @param root
 * @param context
 */
function traverseNode(root: RootNode | TemplateChildNode, context: TransformContext) {
  // 获取处理节点插件
  const { nodeTransforms } = context

  const exitFns: (() => void)[] = []
  // 遍历插件，一一执行
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(root, context)
    if (onExit) {
      if (isArray(onExit))
        exitFns.push(...onExit)
      else
        exitFns.push(onExit)
    }
  }

  // 判断节点类型，分别处理
  switch (root.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 遍历子节点
      traverseChildren(root, context)
  }

  let i = exitFns.length
  while (i--)
    exitFns[i]()
}

/**
 * 遍历递归子节点
 * @param parent
 * @param context
 */
function traverseChildren(
  parent: ParentNode,
  context: TransformContext,
) {
  // 遍历所有子节点，一一进行递归
  for (let i = 0; i < parent.children.length; i++)
    traverseNode(parent.children[i], context)
}
