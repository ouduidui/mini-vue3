import { createApp } from '../../dist/mini-vue.esm.js'

const App = {
  name: 'App',
  template: '<div>Hello, {{message}} </div>',
  setup() {
    return {
      message: 'world',
    }
  },
}

const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)
