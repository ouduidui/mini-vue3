import { h, ref } from '../../dist/mini-vue.esm.js'

export const App = {
  render() {
    console.log(this.props)
    return h(
      'div',
      {
        ...this.props,
      },
      [
        h('h1', null, 'Update'),
        h('h3', null, 'Update Children'),
        h('p', null, `count: ${this.count}`),
        h(
          'button',
          {
            onClick: this.addHandle,
          },
          'add',
        ),

        h('h3', null, 'Update Props'),
        h('p', null, 'HelloWorld'),
        h(
          'button',
          {
            onClick: this.changePropsStyle,
          },
          'changePropsStyle',
        ),
        h(
          'button',
          {
            onClick: this.clearPropsClass,
          },
          'clearPropsClass',
        ),
        h(
          'button',
          {
            onClick: this.resetProps,
          },
          'resetProps',
        ),
      ],
    )
  },
  setup() {
    const count = ref(0)
    const addHandle = () => {
      count.value++
      console.log(`count: ${count.value}`)
    }

    const props = ref({
      style: 'color: red',
      class: 'underline',
    })

    const changePropsStyle = () => (props.value.style = 'color: blue')
    const clearPropsClass = () => (props.value.class = undefined)
    const resetProps = () => (props.value = { style: 'color: red' })

    return {
      count,
      props,
      addHandle,
      changePropsStyle,
      clearPropsClass,
      resetProps,
    }
  },
}
