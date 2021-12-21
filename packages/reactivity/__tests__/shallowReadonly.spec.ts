import { isReadonly, readonly, shallowReadonly } from '../src/reactive';

describe('shallowReadonly', () => {
	it('should not make non-readonly properties readonly', () => {
		const props = shallowReadonly({ n: { foo: 1 } });
		expect(isReadonly(props)).toBe(true);
		expect(isReadonly(props.n)).toBe(false);
	});

	it('should call warn when set', () => {
		console.warn = jest.fn();

		const user = readonly({ age: 10 });
		user.age = 11;
		expect(console.warn).toBeCalled();
	});
});
