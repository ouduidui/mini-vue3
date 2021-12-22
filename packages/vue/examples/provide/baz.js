import { h, inject } from '../../dist/mini-vue.esm.js';

export const Baz = {
  render() {
    return h('div', null, [
      h('h4', null, 'Baz Comp'),
      h('p', null, 'inject foo: ' + this.foo),
      h('p', null, 'inject baz: ' + this.baz),
      h('p', null, 'inject bar: ' + this.bar)
    ]);
  },
  setup() {
    const foo = inject('foo');
    const baz = inject('baz');
    console.log('inject foo: ', foo);
    console.log('inject baz: ', baz);

    const bar = inject('bar', function () {
      return this.foo;
    });
    console.log('inject bar: ' + bar);

    return {
      foo,
      baz,
      bar
    };
  }
};
