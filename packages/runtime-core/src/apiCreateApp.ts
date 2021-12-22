import { createVNode } from './vnode';
import { Component } from 'runtime-core/component';
import { RootRenderFunction } from 'runtime-core/renderer';

export type App<HostElement> = any;

export type CreateAppFunction<HostElement> = (rootComponent: Component) => App<HostElement>;

export function createAppAPI<HostElement>(render: RootRenderFunction<HostElement>): CreateAppFunction<HostElement> {
  return function createApp(rootComponent: Component) {
    return {
      mount(rootContainer) {
        // 创建虚拟节点vnode
        const vnode = createVNode(rootComponent);
        // 进行渲染
        render(vnode, rootContainer);
      }
    };
  };
}
