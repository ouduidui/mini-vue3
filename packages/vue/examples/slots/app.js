import { createTextVNode, h } from '../../dist/mini-vue.esm.js'
import { Foo } from './foo.js'

export const App = {
  render() {
    return h('div', { id: 'root' }, [
      h('h1', null, 'Slots'),
      h(Foo, null, {
        header: () => h('div', null, 'Slot Header'),
        footer: () => h('div', null, 'Slot Footer'),
        default: props => [createTextVNode('Slot Content'), h('p', null, `props.msg：${props.msg}`)],
      }),
    ])
  },
  setup() {},
}
