import {h, renderSlot, getCurrentInstance} from "../../dist/mini-vue.esm.js";

export const Bar = {
    render() {
        console.log('this.$slots', this.$slots);

        return h('div', {}, [
            h('p', null, 'Bar Comp:'),
            // 插槽
            renderSlot(this.$slots, 'header'),
            renderSlot(this.$slots, 'default', {msg: 'HelloWorld'}),
            renderSlot(this.$slots, 'footer'),
        ]);
    },
    setup() {
        const instance = getCurrentInstance();
        console.log('Bar Instance: ', instance);
    }
}
