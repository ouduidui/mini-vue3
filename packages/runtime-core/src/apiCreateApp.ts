import type { Component } from 'runtime-core/component'
import type { RootRenderFunction } from 'runtime-core/renderer'
import { createVNode } from './vnode'

export type App<HostElement> = any

export type CreateAppFunction<HostElement> = (rootComponent: Component) => App<HostElement>

export function createAppAPI<HostElement>(render: RootRenderFunction<HostElement>): CreateAppFunction<HostElement> {
  return function createApp(rootComponent: Component) {
    return {
      mount(rootContainer) {
        // 创建虚拟节点vnode
        const vnode = createVNode(rootComponent)
        // 进行渲染
        render(vnode, rootContainer)
      },
    }
  }
}
