import { h, provide, getCurrentInstance } from '../../dist/mini-vue.esm.js';
import { Foo } from './foo.js';

export const App = {
	render() {
		return h('div', { id: 'root' }, [h('h1', null, 'Components'), h(Foo)]);
	},
	setup() {
		const instance = getCurrentInstance();
		console.log('app Instance: ', instance);

		provide('foo', 'fooVal');
		provide('baz', 'bazVal');
	}
};
