import type { VNode } from 'runtime-core/vnode'
import type { Data } from 'runtime-core/component'

export function shouldUpdateComponent(prevVNode: VNode, nextVNode: VNode) {
  const { props: prevProps } = prevVNode
  const { props: nextProps } = nextVNode

  if (prevProps === nextProps) return false

  if (!prevProps) return !nextProps

  if (!nextProps) return true

  return hasPropsChanged(prevProps, nextProps)
}

function hasPropsChanged(prevProps: Data, nextProps: Data): boolean {
  const nextKeys = Object.keys(nextProps)

  if (nextKeys.length !== Object.keys(prevProps).length) return true

  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key])
      return true
  }

  return false
}
