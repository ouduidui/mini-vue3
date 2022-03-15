import { h } from '../../dist/mini-vue.esm.js'

const nextChildren = 'new Children'
const prevChildren = [h('div', null, 'A'), h('div', null, 'B')]

export default {
  setup() {},
  render() {
    return this.isChange ? h('div', null, nextChildren) : h('div', null, prevChildren)
  },
}
