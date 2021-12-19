import {createVNode, Fragment} from "runtime-core/vnode";
import {Slots} from "runtime-core/componentSlots";
import {VNode} from "../vnode";
import {Data} from "runtime-core/component";

export function renderSlot(
    slots: Slots,
    name: string,
    props: Data = {}
): VNode | undefined {
    const slot = slots[name];
    if(slot) {
        return createVNode(Fragment, {}, slot(props));
    }
}
