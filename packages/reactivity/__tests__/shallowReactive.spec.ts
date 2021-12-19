import {isReactive, shallowReactive} from "../src/reactive";



describe('shallowReactive', () => {
    it('should not make non-reactive properties reactive', () => {
        const props = shallowReactive({n: {foo: 1}});
        expect(isReactive(props)).toBe(true);
        expect(isReactive(props.n)).toBe(false);
    })
})
