import type { RootNode, SlotOutletNode, TemplateChildNode } from './ast'
import { ElementTypes, NodeTypes } from './ast'
import { CREATE_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_VNODE } from './runtimeHelpers'

export function isSlotOutlet(
  node: RootNode | TemplateChildNode,
): node is SlotOutletNode {
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT
}

export function getVNodeHelper(isComponent: boolean) {
  return isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}

export function getVNodeBlockHelper(isComponent: boolean) {
  return isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK
}
