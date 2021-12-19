import {h} from "../../dist/mini-vue.esm.js";
import {Foo} from "./foo.js"

export const App = {
    render() {
        return h('div', {id: 'root'}, [
            h('h1', null, 'Components'),
            h(Foo, {
                msg: 'HelloWorld',
                onClickHandle(test) {
                    console.log('事件绑定: ' + test);
                }
            })
        ])
    },
    setup() {}
}
