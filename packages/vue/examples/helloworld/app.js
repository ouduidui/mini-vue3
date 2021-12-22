import { h } from '../../dist/mini-vue.esm.js';

window.self = null;

export const App = {
  render() {
    window.self = this;
    return h(
      'div',
      {
        id: 'root',
        class: ['pages']
      },
      [
        h('h1', { class: 'text-1' }, 'Hello World'),
        h('h3', { style: 'color: #666' }, this.msg),
        h('input', {
          placeholder: 'input something',
          onInput(e) {
            console.log('input keywords: ', e.target.value);
          }
        }),
        h(
          'button',
          {
            onClick() {
              console.log('click events');
            }
          },
          'test button'
        )
      ]
    );
  },
  setup() {
    return {
      msg: 'This is mini-vue'
    };
  }
};
