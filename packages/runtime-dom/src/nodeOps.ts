import {RendererOptions} from "runtime-core/index";

const doc = (typeof document !== 'undefined' ? document : null) as Document

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
    insert: (child, parent) => {
        parent.insertBefore(child, null);
    },

    createElement: (tag: string): Element => {
        const el = doc.createElement(tag);

        return el;
    }
}
