import {h, ref} from "../../dist/mini-vue.esm.js";
import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import generateArrayTpArrayComps from "./ArrayToArray.js";

export const App = {
    render() {
        return h("div", {id: 'root'},
            [
                h('h1', null, 'Patch Children'),

                h('h3', null, 'ArrayToText'),
                h(ArrayToText, {isChange: this.isChange}),

                h('h3', null, 'TextToText'),
                h(TextToText, {isChange: this.isChange}),

                h('h3', null, 'TextToArray'),
                h(TextToArray, {isChange: this.isChange}),

                h('h3', null, 'ArrayToArray'),
                h('h4', null, 'AB -> ABC'),
                h(generateArrayTpArrayComps(0), {isChange: this.isChange}),
                h('h4', null, 'BC -> ABC'),
                h(generateArrayTpArrayComps(1), {isChange: this.isChange}),
                h('h4', null, 'ABC -> AB'),
                h(generateArrayTpArrayComps(2), {isChange: this.isChange}),
                h('h4', null, 'ABC -> BC'),
                h(generateArrayTpArrayComps(3), {isChange: this.isChange}),
                h('h4', null, 'ABCEDFG -> ABECFG'),
                h(generateArrayTpArrayComps(4), {isChange: this.isChange}),

                h('button', {
                    onClick: this.changeHandle
                }, 'update')
            ]
        );
    },
    setup() {
        const isChange = ref(false);

        const changeHandle = () => isChange.value = true;

        return {isChange, changeHandle}
    },
}
