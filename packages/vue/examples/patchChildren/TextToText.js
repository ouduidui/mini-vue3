import { h } from '../../dist/mini-vue.esm.js'

const nextChildren = 'new Children'
const prevChildren = 'old Children'

export default {
  setup() {},
  render() {
    return this.isChange ? h('div', null, nextChildren) : h('div', null, prevChildren)
  },
}
