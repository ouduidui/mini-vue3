import { h } from '../../dist/mini-vue.esm.js';

const demos = [
	// AB -> ABC
	{
		prevChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B')],
		nextChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')]
	},
	// BC -> ABC
	{
		prevChildren: [h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')],
		nextChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')]
	},

	// ABC -> AB
	{
		prevChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')],
		nextChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B')]
	},

	// ABC -> BC
	{
		prevChildren: [h('span', { key: 'A' }, 'A'), h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')],
		nextChildren: [h('span', { key: 'B' }, 'B'), h('span', { key: 'C' }, 'C')]
	},

	// ABCEDFG -> ABECFG
	{
		prevChildren: [
			h('span', { key: 'A' }, 'A'),
			h('span', { key: 'B' }, 'B'),
			h('span', { key: 'C' }, 'C'),
			h('span', { key: 'E' }, 'E'),
			h('span', { key: 'D' }, 'D'),
			h('span', { key: 'F' }, 'F'),
			h('span', { key: 'G' }, 'G')
		],
		nextChildren: [
			h('span', { key: 'A' }, 'A'),
			h('span', { key: 'B' }, 'B'),
			h('span', { key: 'E' }, 'E'),
			h('span', { key: 'C' }, 'C'),
			h('span', { key: 'F' }, 'F'),
			h('span', { key: 'G' }, 'G')
		]
	}
];

const generateArrayTpArrayComps = (idx) => {
	return {
		setup() {},
		render() {
			const children = demos[idx];

			return this.isChange ? h('div', null, children.nextChildren) : h('div', null, children.prevChildren);
		}
	};
};

export default generateArrayTpArrayComps;
