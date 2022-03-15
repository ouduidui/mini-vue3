import { getCurrentInstance, h, inject, provide } from '../../dist/mini-vue.esm.js'
import { Baz } from './baz.js'

export const Foo = {
  render() {
    return h('div', null, [
      h('h3', null, 'Foo Comp'),
      h('p', null, `inject foo: ${this.foo}`),
      h('p', null, `inject bar: ${this.bar}`),
      h(Baz),
    ])
  },
  setup() {
    const instance = getCurrentInstance()
    console.log('Foo Instance: ', instance)

    const foo = inject('foo')
    console.log('inject foo', foo)

    // 设置默认值
    const bar = inject('bar', 'barValue')

    provide('foo', 'fooValue2')

    return {
      foo,
      bar,
    }
  },
}
