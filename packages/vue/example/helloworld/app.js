import {h, createTextVNode, getCurrentInstance, provide} from "../../dist/mini-vue.esm.js";
import {Foo} from "./foo.js";
import {Bar} from "./bar.js";

window.self = null;

export const App = {
    render() {
        window.self = this;
        return h("div", {
                id: 'root',
                class: ['pages']
            },
            [
                h('h1', {class: 'text-1'}, 'Hello World'),
                h('h3', {style: 'color: #666'}, this.msg),
                h('input', {
                    placeholder: 'input something',
                    onChange(e) {
                        console.log('input keywords: ', e.target.value);
                    }
                }),
                h('button', {
                    onClick() {
                        console.log('click events');
                    }
                }, 'test button'),

                h(Foo, {
                    count: 1,
                    onAddHandle(n1, n2) {
                        console.log('onAddHandle', n1, n2)
                    }
                }),

                h(Bar, null,
                    {
                        header: () => [
                            h('p', null, 'Slot Header'),
                            createTextVNode('OUDUIDUI')
                        ],
                        footer: () => h('p', null, 'Slot Footer'),
                        default: (props) => h('p', null, 'Slot Content：' + props.msg),
                    }
                )
            ]
        );
    },
    setup() {
        const instance = getCurrentInstance();
        console.log('app Instance: ', instance);

        provide('foo', 'fooVal');
        provide('baz', 'bazVal');

        return {
            msg: 'This is mini-vue'
        }
    }
}
