import {ComponentInternalInstance, createComponentInstance, setupComponent} from "./component";
import {ShapeFlags} from "shared/index";
import {Text, Fragment, VNode, VNodeArrayChildren} from "runtime-core/vnode";
import {createAppAPI} from "runtime-core/apiCreateApp";

export interface RendererNode {
    [key: string]: any
}

export interface RendererElement extends RendererNode {}

export type RootRenderFunction<HostElement = RendererElement> = (
    vnode: VNode | null,
    container: HostElement
) => void

export interface RendererOptions<HostNode = RendererNode,
    HostElement = RendererElement> {
    patchProp(
        el: HostElement,
        key: string,
        prevValue: any,
        nextValue: any
    ): void,

    insert(el: HostNode, parent: HostElement): void,

    createElement(type: string): HostElement
}

export interface RendererElement extends RendererNode {}

type PatchFn = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor?: RendererNode | null,
    parentComponent?: ComponentInternalInstance | null
) => void

type MountChildrenFn = (
    children: VNodeArrayChildren,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null,
    start?: number
) => void


export function createRenderer<HostNode = RendererNode,
    HostElement = RendererElement>(options: RendererOptions<HostNode, HostElement>) {
    return baseCreateRenderer(options);
}


function baseCreateRenderer(
    options: RendererOptions
): any {

    const {
        patchProp,
        insert,
        createElement
    } = options;

    /**
     * 渲染函数
     * @param vnode
     * @param container
     */
    const render: RootRenderFunction = (vnode, container)=> {
        if (vnode !== null) {
            patch(null, vnode, container, null, null)
        }
    }

    /**
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    const patch: PatchFn = (
        n1,
        n2,
        container,
        anchor = null,
        parentComponent = null
    ) => {
        const {type, shapeFlag} = n2;

        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor, parentComponent);
                break;
            default:
                // 使用shapeFlag判断vnode类型
                if (shapeFlag & ShapeFlags.ELEMENT/* element类型 */) {
                    processElement(
                        n1,
                        n2,
                        container,
                        anchor,
                        parentComponent
                    );
                } else if (shapeFlag & ShapeFlags.COMPONENT/* 组件类型 */) {
                    processComponent(
                        n1,
                        n2,
                        container,
                        anchor,
                        parentComponent
                    )
                }
        }
    }

    function processText(
        n1: VNode | null,
        n2: VNode,
        container: RendererElement) {
        const {children} = n2;
        const textNode = document.createTextNode(children as string);
        container.append(textNode);
    }

    /**
     * 处理Fragment，自渲染子节点
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function processFragment(
        n1: VNode | null,
        n2: VNode,
        container: RendererElement,
        anchor: RendererNode | null,
        parentComponent: ComponentInternalInstance | null
    ) {
        mountChildren(
            n2.children as VNodeArrayChildren,
            container,
            anchor,
            parentComponent
        );
    }

    /**
     * 处理Element
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function processElement(
        n1: VNode | null,
        n2: VNode,
        container: RendererElement,
        anchor: RendererNode | null,
        parentComponent: ComponentInternalInstance | null
    ) {
        if (n1 === null) {
            mountElement(n2, container, anchor, parentComponent);
        }
    }

    /**
     * 挂载Element
     * @param vnode
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function mountElement(
        vnode: VNode,
        container: RendererElement,
        anchor: RendererNode | null,
        parentComponent: ComponentInternalInstance | null
    ) {
        const el = vnode.el = createElement(vnode.type);

        const {children, props, shapeFlag} = vnode;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 文本节点
            el.textContent = children;
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {  // 虚拟节点数组
            mountChildren(
                children as VNodeArrayChildren,
                el,
                null,
                parentComponent
            )
        }

        for (const key in props) {
            const val = props[key];

            patchProp(el, key, '', val);
        }

        insert(el, container);
    }

    /**
     * 挂载子节点
     * @param children
     * @param container
     * @param anchor
     * @param parentComponent
     * @param start
     */
    const mountChildren: MountChildrenFn = (
        children,
        container,
        anchor,
        parentComponent,
        start = 0
    ) => {
        for (let i = start; i < children.length; i++) {
            const child = children[i] as VNode;
            patch(null, child, container, anchor, parentComponent);
        }
    }

    /**
     * 处理Component
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function processComponent(
        n1: VNode | null,
        n2: VNode,
        container: RendererElement,
        anchor: RendererNode | null,
        parentComponent: ComponentInternalInstance | null
    ) {
        if (n1 == null) {
            mountComponent(n2, container, anchor, parentComponent)
        }
    }

    /**
     * 挂载Component
     * @param initialVNode
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function mountComponent(
        initialVNode: VNode,
        container: RendererElement,
        anchor: RendererNode | null,
        parentComponent: ComponentInternalInstance | null
    ) {
        // 创建组件实例
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 初始化组件
        setupComponent(instance);
        // 渲染组件
        setupRenderEffect(
            instance,
            initialVNode,
            container,
            anchor
        );
    }

    /**
     * 渲染组件
     * @param instance
     * @param initialVNode
     * @param container
     * @param anchor
     */
    function setupRenderEffect(
        instance: ComponentInternalInstance,
        initialVNode: VNode,
        container: RendererElement,
        anchor: RendererNode | null
    ) {
        // 取出代理，在后续绑定render函数
        const proxy = instance.proxy;
        // 执行render函数，获取返回的vnode
        const subTree = instance.render.call(proxy);

        patch(null, subTree, container, anchor, instance);

        // 当全部组件挂载结束后，赋值el属性
        initialVNode.el = subTree.el;
    }

    return {
        render,
        createApp: createAppAPI(render)
    }
}
