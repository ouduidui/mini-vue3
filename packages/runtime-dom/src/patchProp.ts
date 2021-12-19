import {RendererOptions} from "runtime-core/index";

type DOMRendererOptions = RendererOptions<Node, Element>

export const patchProp: DOMRendererOptions['patchProp'] = (
    el,
    key,
    prevValue,
    nextValue
) => {
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextValue);
    } else {
        el.setAttribute(key, nextValue);
    }
}
