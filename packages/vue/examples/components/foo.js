import { h } from '../../dist/mini-vue.esm.js';

export const Foo = {
	render() {
		return h('div', null, [
			h('h3', null, 'Foo Comp'),
			h('p', null, 'props.msg = ' + this.msg),
			h(
				'button',
				{
					onClick: this.clickHandle
				},
				'button'
			)
		]);
	},
	setup(props, { emit }) {
		console.log('props', props);

		// props 只读
		props.msg = 'Hi World';

		const clickHandle = () => {
			console.log('emit', emit);
			emit('clickHandle', 'test1');
			emit('click-handle', 'test2');
		};

		return {
			clickHandle
		};
	}
};
