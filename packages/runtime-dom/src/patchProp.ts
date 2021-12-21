import { RendererOptions } from 'runtime-core/index';
import { isOn } from 'shared/index';

type DOMRendererOptions = RendererOptions<Node, Element>;

export const patchProp: DOMRendererOptions['patchProp'] = (el, key, prevValue, nextValue) => {
	if (isOn(key)) {
		const event = key.slice(2).toLocaleLowerCase();
		el.addEventListener(event, nextValue);
	} else {
		if (nextValue === undefined || nextValue === null) {
			el.removeAttribute(key);
		} else {
			el.setAttribute(key, nextValue);
		}
	}
};
