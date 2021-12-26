import { ComponentInternalInstance, createComponentInstance, Data, setupComponent } from './component';
import { EMPTY_ARR, EMPTY_OBJ, invokeArrayFns, ShapeFlags } from 'shared/index';
import { Text, Fragment, VNode, VNodeArrayChildren, isSameVNodeType } from 'runtime-core/vnode';
import { createAppAPI } from 'runtime-core/apiCreateApp';
import { effect } from 'reactivity/effect';
import { shouldUpdateComponent } from 'runtime-core/componentRenderUtils';
import { queueJob, queuePostFlushCb, flushPostFlushCbs } from 'runtime-core/scheduler';

export interface RendererNode {
  [key: string]: any;
}

export interface RendererElement extends RendererNode {}

export type RootRenderFunction<HostElement = RendererElement> = (vnode: VNode | null, container: HostElement) => void;

export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  patchProp(el: HostElement, key: string, prevValue: any, nextValue: any): void;

  insert(el: HostNode, parent: HostElement, hostInsert: HostNode | null): void;

  remove(el: HostNode): void;

  createElement(type: string): HostElement;

  setElementText(node: HostElement, text: string): void;
}

export interface RendererElement extends RendererNode {}

type PatchFn = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor?: RendererNode | null,
  parentComponent?: ComponentInternalInstance | null
) => void;

type MountChildrenFn = (
  children: VNodeArrayChildren,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  start?: number
) => void;

export const queuePostRenderEffect = queuePostFlushCb;

/**
 * 工厂函数 —— 生成renderer
 * @param options
 */
export function createRenderer<HostNode = RendererNode, HostElement = RendererElement>(
  options: RendererOptions<HostNode, HostElement>
) {
  return baseCreateRenderer(options);
}

function baseCreateRenderer(options: RendererOptions): any {
  // 解析出节点操作函数
  const {
    patchProp: hostPatchProp,
    remove: hostRemove,
    insert: hostInsert,
    createElement: hostCreateElement,
    setElementText: hostSetElementText
  } = options;

  /**
   * 渲染函数
   * @param vnode
   * @param container
   */
  const render: RootRenderFunction = (vnode, container) => {
    if (vnode !== null) {
      patch(null, vnode, container, null, null);
    }

    flushPostFlushCbs();
  };

  /**
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   * @param parentComponent
   */
  const patch: PatchFn = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 === n2) return;

    const { type, shapeFlag } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor, parentComponent);
        break;
      default:
        // 使用shapeFlag判断vnode类型
        if (shapeFlag & ShapeFlags.ELEMENT /* element类型 */) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT /* 组件类型 */) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  };

  function processText(n1: VNode | null, n2: VNode, container: RendererElement) {
    const { children } = n2;
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
    mountChildren(n2.children as VNodeArrayChildren, container, anchor, parentComponent);
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
    } else {
      patchElement(n1, n2, parentComponent);
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
    const el = (vnode.el = hostCreateElement(vnode.type));

    const { children, props, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本节点
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 虚拟节点数组
      mountChildren(children as VNodeArrayChildren, el, null, parentComponent);
    }

    for (const key in props) {
      const val = props[key];

      hostPatchProp(el, key, '', val);
    }

    hostInsert(el, container, anchor);
  }

  function patchElement(n1: VNode, n2: VNode, parentComponent: ComponentInternalInstance | null) {
    const el = (n2.el = n1.el!);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    patchChildren(n1, n2, el, null, parentComponent);

    patchProps(el, n2, oldProps, newProps);
  }

  function patchChildren(
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null
  ) {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { shapeFlag } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 将 oldChildren 清空
        unmountChildren(c1 as VNode[], parentComponent);
      }

      // 更新文本
      if (c2 !== c1) {
        hostSetElementText(container, c2 as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(c1 as VNode[], c2 as VNode[], container, anchor, parentComponent);
        } else {
          unmountChildren(c1 as VNode[], parentComponent);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '');
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2 as VNodeArrayChildren, container, anchor, parentComponent);
        }
      }
    }
  }

  function unmountChildren(children: VNode[], parentComponent: ComponentInternalInstance | null, start = 0) {
    for (let i = start; i < children.length; i++) {
      hostRemove(children[i].el!);
    }
  }

  function patchProps(el: RendererElement, vnode: VNode, oldProps: Data, newProps: Data) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];

        if (next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  /**
   * 对比两个数组节点
   * @param c1 旧节点
   * @param c2 新节点
   * @param container
   * @param parentAnchor
   * @param parentComponent
   */
  function patchKeyedChildren(
    c1: VNode[],
    c2: VNode[],
    container: RendererElement,
    parentAnchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null
  ) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    // (a b) c
    // (a b) d e
    // 从头开始遍历，当两个虚拟节点为相同类型的话，进行patch
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent);
      } else {
        break;
      }
      i++;
    }

    // a (b c)
    // d e (b c)
    // 从尾部开始遍历，当两个虚拟节点为相同类型的话，进行patch
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    // 当旧节点已经遍历完了，没有剩余还没处理的节点，同时新节点还有剩余的时候
    // 新增节点
    if (i > e1) {
      if (i <= e2) {
        // 获取相邻锚点容器
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? (c2[nextPos] as VNode).el : parentAnchor;
        // 遍历剩余新节点，一一进行patch
        while (i <= e2) {
          patch(null, c2[i], container, anchor, parentComponent);
          i++;
        }
      }
    }

    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    // 当新节点全部处理完成，没有剩余节点；而旧节点还有剩余节点时
    // 删除节点
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el!);
        i++;
      }
    }

    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    // 当新旧节点还有剩余的时候，进行暴力解法
    else {
      const s1 = i;
      const s2 = i;

      // 遍历剩余的新节点，生成一份节点key -> index 的映射表keyToNewIndexMap
      const keyToNewIndexMap = new Map<string | number | symbol, number>();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        if (nextChild.key !== null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }

      let j;
      let patched = 0; // 统计对比过的数量
      const toBePatched = e2 - s2 + 1; // 未处理的新节点剩余数量
      let moved = false; // 判断是否存在移动节点的操作
      let maxNewIndexSoFar = 0;

      // 生成一个toBePatched长度的数组，用于新节点对应旧节点的下标
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 遍历剩余的旧节点
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 当旧节点超过新节点的时候，直接删除节点
        if (patched >= toBePatched) {
          hostRemove(prevChild.el!);
          continue;
        }

        let newIndex;
        if (prevChild.key !== null) {
          // 如果当前旧节点存在key值，则从keyToNewIndexMap映射表查找有没有对应的新节点，有则获取其下标
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果当前旧节点不存在key值，则遍历剩余新节点，一一匹配，如果匹配到了，则获取其下标
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          // 如果此时还没匹配到对应的新节点的话，则删除该旧节点
          hostRemove(prevChild.el!);
        } else {
          // 如果匹配到则更新节点
          // 更新该新节点对应的旧节点位置
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 判断整个流程是否需要移动到节点
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // 进行节点对比
          patch(prevChild, c2[newIndex], container, null, parentComponent);
          // 更新已经对比过的数量
          patched++;
        }
      }

      // [2, 5, 3, 1]
      // [0, 2]
      // 如果需要进行节点移动，则根据newIndexToOldIndexMap生成最长递增子序列在原数组的下标数组
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      // increasingNewIndexSequence 最后下标
      j = increasingNewIndexSequence.length - 1;
      // 倒序遍历暴力解法中所有的新节点
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i; // 新节点的下标
        const nextChild = c2[nextIndex]; // 新节点
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor; // 获取锚点
        if (newIndexToOldIndexMap[i] === 0) {
          // 如果newIndexToOldIndexMap[i] === 0，则代表该新新节点在前面没有匹配到对应的旧节点，则新增节点
          patch(null, nextChild, container, anchor, parentComponent);
        } else if (moved) {
          // 如果需要进行到节点移动
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // j 已经没有了 说明剩下的都需要移动了
            // 最长子序列里面的值和当前的值匹配不上，说明当前元素需要移动
            hostInsert(nextChild.el!, container, anchor);
          } else {
            // 满足 i === increasingNewIndexSequence[j]，因此不需要移动了，则递减 j
            j--;
          }
        }
      }
    }
  }

  /**
   * 挂载子节点
   * @param children
   * @param container
   * @param anchor
   * @param parentComponent
   * @param start
   */
  const mountChildren: MountChildrenFn = (children, container, anchor, parentComponent, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] as VNode;
      patch(null, child, container, anchor, parentComponent);
    }
  };

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
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      updateComponent(n1, n2);
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
    const instance: ComponentInternalInstance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    // 初始化组件
    setupComponent(instance);
    // 渲染组件
    setupRenderEffect(instance, initialVNode, container, anchor);
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
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 初始化
        // 取出代理，在后续绑定render函数
        const { proxy, bm, m } = instance;

        // beforeMount Hook
        if (bm) {
          invokeArrayFns(bm);
        }

        // 执行render函数，获取返回的vnode
        const subTree = (instance.subTree = instance.render.call(proxy));

        patch(null, subTree, container, anchor, instance);

        // 当全部组件挂载结束后，赋值el属性
        initialVNode.el = subTree.el;

        // mounted Hook
        if (m) {
          queuePostRenderEffect(m);
        }

        instance.isMounted = true;
      } else {
        // 更新
        let { proxy, next, vnode, bu, u } = instance;
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        if (bu) {
          invokeArrayFns(bu);
        }

        const nextTree = instance.render.call(proxy);

        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        patch(prevTree, nextTree, container, anchor, instance);

        if (u) {
          queuePostRenderEffect(u);
        }
      }
    };

    instance.update = effect(componentUpdateFn, {
      scheduler: () => queueJob(instance.update)
    });
  }

  function updateComponent(n1: VNode, n2: VNode) {
    const instance = (n2.component = n1.component)!;
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function updateComponentPreRender(instance: ComponentInternalInstance, nextVNode: VNode) {
    const { props } = nextVNode;
    // 更新组件props
    instance.props = props || EMPTY_OBJ;
  }

  return {
    render,
    createApp: createAppAPI(render)
  };
}

/**
 * 求最长递增子序列在原数组的下标数组
 * @param arr {number[]}
 * @return {number[]}
 */
function getSequence(arr: number[]): number[] {
  // 浅拷贝arr
  const _arr = arr.slice();
  const len = _arr.length;
  // 存储最长递增子序列对应arr中下标
  const result = [0];

  for (let i = 0; i < len; i++) {
    const val = _arr[i];

    // 排除等于 0 的情况
    if (val !== 0) {
      /* 1. 贪心算法 */

      // 获取result当前最大值的下标
      const j = result[result.length - 1];
      // 如果当前 val 大于当前递增子序列的最大值的时候，直接添加
      if (arr[j] < val) {
        _arr[i] = j; // 保存上一次递增子序列最后一个值的索引
        result.push(i);
        continue;
      }

      /* 2. 二分法 */

      // 定义二分法查找区间 [left, right]
      let left = 0;
      let right = result.length - 1;
      while (left < right) {
        // 求中间值（向下取整）
        let mid = (left + right) >> 1;
        if (arr[result[mid]] < val) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }

      // 当前递增子序列按顺序找到第一个大于 val 的值，将其替换
      if (val < arr[result[left]]) {
        if (left > 0) {
          // 保存上一次递增子序列最后一个值的索引
          _arr[i] = result[left - 1];
        }

        // 此时有可能导致结果不正确，即 result[left + 1] < result[left]
        // 所以我们需要通过 _arr 来记录正常的结果
        result[left] = i;
      }
    }
  }

  // 修正贪心算法可能造成最长递增子序列在原数组里不是正确的顺序
  let len2 = result.length;
  let idx = result[len2 - 1];
  // 倒序回溯，通过之前 _arr 记录的上一次递增子序列最后一个值的索引
  // 进而找到最终正确的索引
  while (len2-- > 0) {
    result[len2] = idx;
    idx = _arr[idx];
  }

  return result;
}
