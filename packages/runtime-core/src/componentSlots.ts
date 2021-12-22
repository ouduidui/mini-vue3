import { VNode } from 'runtime-core/vnode';
import { ComponentInternalInstance } from './component';
import { VNodeNormalizedChildren } from './vnode';
import { isArray, isFunction, ShapeFlags } from 'shared/index';

export type Slot = (...args: any[]) => VNode[];

export type Slots = Readonly<InternalSlots>;

export type InternalSlots = {
  [name: string]: Slot | undefined;
};

export type RawSlots = {
  [name: string]: unknown;
};

const normalizeSlotValue = (value: unknown): VNode[] => (isArray(value) ? value : [value]);

function normalizeObjectSlots(rawSlots: RawSlots, slots: InternalSlots) {
  for (const key in rawSlots) {
    const value = rawSlots[key];
    if (isFunction(value)) {
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }
}

export function initSlots(instance: ComponentInternalInstance, children: VNodeNormalizedChildren) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children as unknown as RawSlots, (instance.slots = {}));
  }
}
