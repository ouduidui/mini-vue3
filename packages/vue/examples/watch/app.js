import { h, ref, watch, watchEffect, computed, reactive } from '../../dist/mini-vue.esm.js';

window.self = null;

export const App = {
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['pages']
      },
      [
        h('h1', null, 'Watch and Computed'),
        h('h3', null, 'count: ' + this.count),
        h('h3', null, 'doubleCount: ' + this.doubleCount),
        h('button', { onClick: this.add }, 'add')
      ]
    );
  },
  setup() {
    const count = ref(0);
    const doubleCount = computed(() => 2 * count.value);

    const obj = reactive({
      count: 0
    });

    const add = () => {
      count.value++;
      obj.count++;
    };

    watch(count, (val, oldVal) => {
      console.log('watch count: ', val, oldVal);
    });

    watch(obj, (val, oldVal) => {
      console.log('watch obj: ', val, oldVal);
    });

    watchEffect(() => {
      console.log('watchEffect: ', count.value);
    });

    return {
      count,
      doubleCount,
      add
    };
  }
};
