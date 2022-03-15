import type { VNode } from 'runtime-core/vnode'
import { ShapeFlags, isArray, isFunction } from 'shared/index'
import type { ComponentInternalInstance } from './component'
import type { VNodeNormalizedChildren } from './vnode'

export type Slot = (...args: any[]) => VNode[]

export type Slots = Readonly<InternalSlots>

export type InternalSlots = Record<string, Slot | undefined>

export type RawSlots = Record<string, unknown>

const normalizeSlotValue = (value: unknown): VNode[] => (isArray(value) ? value : [value])

function normalizeObjectSlots(rawSlots: RawSlots, slots: InternalSlots) {
  for (const key in rawSlots) {
    const value = rawSlots[key]
    if (isFunction(value))
      slots[key] = props => normalizeSlotValue(value(props))
  }
}

export function initSlots(instance: ComponentInternalInstance, children: VNodeNormalizedChildren) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN)
    normalizeObjectSlots(children as unknown as RawSlots, (instance.slots = {}))
}
