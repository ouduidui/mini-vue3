import type { RendererOptions } from 'runtime-core/index'

const doc = (typeof document !== 'undefined' ? document : null) as Document

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },

  createElement: (tag: string): Element => {
    const el = doc.createElement(tag)

    return el
  },

  remove: (child: Node) => {
    const parent = child.parentNode
    if (parent)
      parent.removeChild(child)
  },

  setElementText: (el, text) => {
    el.textContent = text
  },
}
