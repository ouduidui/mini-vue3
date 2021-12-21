import { hasOwn } from 'shared/index';
import { ComponentInternalInstance } from './component';
import { shallowReadonly } from 'reactivity/reactive';

export interface ComponentRenderContext {
	[key: string]: any;
	_: ComponentInternalInstance;
}

export type PublicPropertiesMap = Record<string, (i: ComponentInternalInstance) => any>;

const publicPropertiesMap: PublicPropertiesMap = {
	$el: (i) => i.vnode.el,
	$slots: (i) => shallowReadonly(i.slots)
};

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
	get({ _: instance }: ComponentRenderContext, key: string) {
		const { setupState, props } = instance;

		if (hasOwn(setupState, key)) {
			return setupState[key];
		} else if (hasOwn(props, key)) {
			return props[key];
		}

		const publicGetter = publicPropertiesMap[key];
		if (publicGetter) {
			return publicGetter(instance);
		}
	}
};
