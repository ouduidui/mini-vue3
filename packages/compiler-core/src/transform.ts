import type { ParentNode, RootNode, TemplateChildNode } from './ast'
import { NodeTypes } from './ast'

interface TransformOptions {
  nodeTransforms: NodeTransform[]
}

interface TransformContext {
  nodeTransforms: NodeTransform[]
}

export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: any
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
}

/**
 * 递归遍历节点
 * @param root
 * @param context
 */
function traverseNode(root: RootNode | TemplateChildNode, context: TransformOptions) {
  // 获取处理节点插件
  const { nodeTransforms } = context

  // 遍历插件，一一执行
  for (let i = 0; i < nodeTransforms.length; i++)
    nodeTransforms[i](root, context)

  // 判断节点类型，分别处理
  switch (root.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 遍历子节点
      traverseChildren(root, context)
  }
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
