import {getCurrentInstance, h, inject, provide} from "../../dist/mini-vue.esm.js";
import {Baz} from "./baz.js";

export const Foo = {
    render() {
        return h('div', {}, [
            h('div', null, "Foo: " + this.count),
            h('button', {
                onClick: this.clickHandle
            }, 'test emit button'),
            h('div', null,  "Provide / inject -- foo = " + this.foo),
            h(Baz)
        ]);
    },
    setup(props, {emit}) {
        console.log('props: ', props);

        // props只读
        props.count++;

        const instance = getCurrentInstance();
        console.log('Foo Instance: ', instance);

        const foo = inject('foo');
        console.log('inject foo', foo);

        provide('foo', 'fooValue2');

        const clickHandle = () => {
            console.log('emit', emit);
            emit('addHandle', 1, 2);
            emit('add-handle', 3, 4);
        }

        return {
            clickHandle,
            foo
        }
    }
}
