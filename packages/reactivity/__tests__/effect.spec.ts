import { reactive } from '../src/reactive';
import { effect, stop } from '../src/effect';

describe('effect', () => {
	it('happy path', () => {
		const user = reactive({ age: 10 });
		let nextAge;

		effect(() => {
			nextAge = user.age + 1;
		});

		expect(nextAge).toBe(11);

		// update
		user.age++;
		expect(nextAge).toBe(12);
	});

	it('should return runner when call effect', () => {
		let foo = 10;
		const runner = effect(() => {
			foo++;
			return 'foo';
		});

		expect(foo).toBe(11);

		const r = runner();
		expect(foo).toBe(12);
		expect(r).toBe('foo');
	});

	it('effect scheduler option', () => {
		// 当effect第一次执行的时候，会执行fn函数，但不会执行scheduler调度函数
		// 当响应式对象被set的时候，effect update的时候不会执行fn函数，而执行scheduler
		// 而当执行runner时，会再出执行fn

		let dummy;
		let run: any;
		const scheduler = jest.fn(() => {
			run = runner;
		});

		const obj = reactive({ foo: 1 });
		const runner = effect(
			() => {
				dummy = obj.foo;
			},
			{
				scheduler
			}
		);

		// scheduler不会被调用
		expect(scheduler).not.toHaveBeenCalled();
		expect(dummy).toBe(1);

		obj.foo++;
		// scheduler被调用了一次
		expect(scheduler).toHaveBeenCalledTimes(1);
		expect(dummy).toBe(1);
		run();
		expect(dummy).toBe(2);
	});

	it('stop function', () => {
		let dummy;
		const obj = reactive({ prop: 1 });
		const runner = effect(() => {
			dummy = obj.prop;
		});
		obj.prop = 2;
		expect(dummy).toBe(2);
		stop(runner);

		// 直接赋值只会触发get操作
		obj.prop = 3;
		expect(dummy).toBe(2);

		// obj.prop++  ->  obj.prop = obj.prop + 1
		// 会触发一次get操作
		obj.prop++;
		expect(dummy).toBe(2);

		runner();
		expect(dummy).toBe(4);
	});

	it('onStop Option', () => {
		const obj = reactive({
			foo: 1
		});
		const onStop = jest.fn();
		let dummy;
		const runner = effect(
			() => {
				dummy = obj.foo;
			},
			{ onStop }
		);

		stop(runner);
		expect(onStop).toBeCalledTimes(1);
	});
});
