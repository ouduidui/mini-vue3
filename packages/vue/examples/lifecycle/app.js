import { h, nextTick, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, ref } from '../../dist/mini-vue.esm.js'

export const App = {
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'root',
        class: ['pages'],
      },
      [h('h1', null, 'LifeCycle'), h('h4', null, this.msg)],
    )
  },
  setup() {
    const msg = ref('')

    onBeforeMount(() => {
      console.log('onBeforeMount')
    })

    onMounted(() => {
      nextTick(() => {
        console.log('nextTick')
      })
      console.log('onMounted')
      setTimeout(() => {
        msg.value = 'HelloWorld'
      }, 1000)
    })

    onBeforeUpdate(() => {
      console.log('onBeforeUpdate')
    })

    onUpdated(() => {
      console.log('onUpdated')
    })

    return {
      msg,
    }
  },
}
