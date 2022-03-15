import { h, renderSlot } from '../../dist/mini-vue.esm.js'

export const Foo = {
  render() {
    return h('div', null, [
      // 插槽
      renderSlot(this.$slots, 'header'),
      renderSlot(this.$slots, 'default', { msg: 'HelloWorld' }),
      renderSlot(this.$slots, 'footer'),
    ])
  },
  setup() {},
}
