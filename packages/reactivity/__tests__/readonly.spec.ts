import {readonly, isReadonly, isProxy} from "../src/reactive";

describe('readonly', () => {
    it('happy path', () => {
        const original = {foo: 1, bar: {baz: 2}};
        const wrapped = readonly(original);
        expect(wrapped).not.toBe(original);
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReadonly(wrapped.bar)).toBe(true);
        expect(isProxy(wrapped)).toBe(true);
        expect(isProxy(wrapped.bar)).toBe(true);

        expect(isReadonly(original)).toBe(false);
        expect(wrapped.foo).toBe(1);
    })

    it('should call warn when set', () => {
        console.warn = jest.fn();

        const user = readonly({age: 10});
        user.age = 11;
        expect(console.warn).toBeCalled();
    })
})
