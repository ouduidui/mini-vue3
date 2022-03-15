import { Fragment, createVNode } from 'runtime-core/vnode'
import type { Slots } from 'runtime-core/componentSlots'
import type { Data } from 'runtime-core/component'
import type { VNode } from '../vnode'

export function renderSlot(slots: Slots, name: string, props: Data = {}): VNode | undefined {
  const slot = slots[name]
  if (slot)
    return createVNode(Fragment, {}, slot(props))
}
