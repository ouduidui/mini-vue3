import type { VNode, VNodeTypes } from 'runtime-core/vnode'
import { createVNode } from 'runtime-core/vnode'

export function h(type: VNodeTypes, props = null, children = null): VNode {
  return createVNode(type, props, children)
}
