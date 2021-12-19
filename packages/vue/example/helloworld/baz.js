import { h, inject} from "../../dist/mini-vue.esm.js";

export const Baz = {
    render() {
        return h('div', {}, "Provide / inject -- foo + baz = " + this.foo + '+' + this.baz)
    },
    setup() {
        const foo = inject('foo');
        const baz = inject('baz');
        console.log('inject foo baz', foo, baz);

        const bar = inject('bar', function () {
            return this.foo;
        })

        console.log('inject bar: ' + bar);

        return {
            foo, baz
        }
    }
}
