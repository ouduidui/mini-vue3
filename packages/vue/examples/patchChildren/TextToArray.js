import { h } from '../../dist/mini-vue.esm.js'

const nextChildren = [h('div', null, 'A'), h('div', null, 'B')]
const prevChildren = 'old Children'

export default {
  setup() {},
  render() {
    return this.isChange ? h('div', null, nextChildren) : h('div', null, prevChildren)
  },
}
