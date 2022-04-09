import type { TemplateTextChildNode, VNodeCall } from 'compiler-core/ast'
import { NodeTypes, createVNodeCall } from 'compiler-core/ast'
import type { NodeTransform } from 'compiler-core/transform'
import { CREATE_ELEMENT_VNODE } from './../runtimeHelpers'

export const transformElement: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      context.helper(CREATE_ELEMENT_VNODE)

      const { tag, props } = node
      let vnodeChildren: VNodeCall['children']
      // tag
      const vnodeTag = `'${tag}'`

      // props
      const vnodeProps: VNodeCall['props'] = props

      // children
      const children = node.children
      if (children.length > 0) {
        const child = children[0]
        const type = child.type

        if (type === NodeTypes.TEXT)
          vnodeChildren = child as TemplateTextChildNode
        else
          vnodeChildren = children
      }

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren,
      )
    }
  }
}
