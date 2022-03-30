import { isSlotOutlet } from 'compiler-core/utils'
import type { ComponentNode, PlainElementNode, RootNode, TemplateChildNode, TemplateNode } from '../ast'
import { NodeTypes } from '../ast'

export function isSingleElementRoot(
  root: RootNode,
  child: TemplateChildNode,
): child is PlainElementNode | ComponentNode | TemplateNode {
  const { children } = root
  return (
    children.length === 1
    && child.type === NodeTypes.ELEMENT
    && !isSlotOutlet(child)
  )
}
