export const FRAGMENT = Symbol('Fragment')
export const OPEN_BLOCK = Symbol('OPEN_BLOCK')
export const CREATE_BLOCK = Symbol('CREATE_BLOCK')
export const CREATE_ELEMENT_BLOCK = Symbol('CREATE_ELEMENT_BLOCK')
export const CREATE_VNODE = Symbol('CREATE_VNODE')
export const CREATE_ELEMENT_VNODE = Symbol('CREATE_ELEMENT_VNODE')
export const TO_DISPLAY_STRING = Symbol('toDisplayString')

export const helperNameMap: any = {
  [FRAGMENT]: 'Fragment',
  [OPEN_BLOCK]: 'openBlock',
  [CREATE_BLOCK]: 'createBlock',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
  [CREATE_VNODE]: 'createVNode',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [TO_DISPLAY_STRING]: 'toDisplayString',
}
