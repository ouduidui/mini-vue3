'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

// 将所有可枚举属性的值从一个或多个源对象分配到目标对象
var extend = Object.assign;
// 判断是否为字符串
var isString = function (val) { return typeof val === 'string'; };
// 判断是否为数组
var isArray = Array.isArray;
// 判断是否为函数
var isFunction = function (val) { return typeof val === 'function'; };
// 判断是否为对象
var isObject = function (val) { return val !== null && typeof val === 'object'; };
// 判断对象是否存在该属性
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = function (val, key) { return hasOwnProperty.call(val, key); };
// 判断两个值是否存在变动
var hasChanged = function (value, oldValue) { return !Object.is(value, oldValue); };
// 空对象
var EMPTY_OBJ = {};
/**
 * 利用空间优化执行实行的工具函数
 * @param fn
 */
var cacheStringFunction = function (fn) {
    // 缓存空间
    var cache = Object.create(null);
    return (function (str) {
        // 先查看缓存是否存在，不存在则调用函数
        var hit = cache[str];
        return hit || (cache[str] = fn(str));
    });
};
var camelizeRE = /-(\w)/g;
/**
 * 将中划线命名法转成驼峰命名法
 * @desc hello-world -> helloWorld
 * @private
 */
var camelize = cacheStringFunction(function (str) {
    return str.replace(camelizeRE, function (_, c) { return (c ? c.toUpperCase() : ''); });
});
/**
 * 将str首字母大写
 * @private
 */
var capitalize = cacheStringFunction(function (str) { return str.charAt(0).toUpperCase() + str.slice(1); });
/**
 * 处理为事件Key
 * @private
 */
var toHandlerKey = cacheStringFunction(function (str) {
    return str ? "on".concat(capitalize(str)) : "";
});

var Fragment = Symbol('Fragment');
var Text = Symbol('Text');
/**
 * 创建vnode
 * @param type
 * @param props
 * @param children
 */
function createVNode(type, props, children) {
    if (props === void 0) { props = null; }
    if (children === void 0) { children = null; }
    var shapeFlag = isString(type)
        ? 1 /* ELEMENT */
        : 6 /* COMPONENT */;
    return createBaseVNode(type, props, children, 0, null, shapeFlag);
}
function createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag) {
    if (props === void 0) { props = null; }
    if (children === void 0) { children = null; }
    if (shapeFlag === void 0) { shapeFlag = 0; }
    var vnode = {
        type: type,
        props: props,
        children: children,
        shapeFlag: shapeFlag,
        el: null
    };
    if (children) {
        // |= 按位运算符
        vnode.shapeFlag |= isString(children)
            ? 8 /* TEXT_CHILDREN */
            : 16 /* ARRAY_CHILDREN */;
        if ((vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) && isObject(children)) {
            vnode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    if (text === void 0) { text = ' '; }
    return createVNode(Text, {}, text);
}

function renderSlot(slots, name, props) {
    if (props === void 0) { props = {}; }
    var slot = slots[name];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
}

// 用于存储target依赖  target -> depsMap
var targetMap = new WeakMap();
/**
 * 触发依赖
 * @desc 根据target和key获取到对应的dep，然后遍历其中所有的依赖
 * @param target
 * @param key
 */
function trigger(target, key) {
    var depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    var dep = depsMap.get(key);
    // 执行effects
    triggerEffects(dep);
}
/**
 * 遍历所有依赖，执行effect
 * @param dep
 */
function triggerEffects(dep) {
    var e_1, _a;
    try {
        // 遍历所有依赖，遍历执行
        for (var dep_1 = __values(dep), dep_1_1 = dep_1.next(); !dep_1_1.done; dep_1_1 = dep_1.next()) {
            var effect_1 = dep_1_1.value;
            if (effect_1.scheduler) { // 如果存在scheduler调度函数，则执行
                effect_1.scheduler();
            }
            else { // 否则执行run函数
                effect_1.run();
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (dep_1_1 && !dep_1_1.done && (_a = dep_1.return)) _a.call(dep_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}

var get = createGetter(); // 响应式
var shallowGet = createGetter(false, true); // 浅响应式
var readonlyGet = createGetter(true); // 只读
var shallowReadonlyGet = createGetter(true, true); // 浅只读
/**
 * 创建Proxy的get处理函数
 * @param isReadonly {boolean} 是否只读
 * @param shallow {boolean} 是否浅处理
 */
function createGetter(isReadonly, shallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (shallow === void 0) { shallow = false; }
    return function get(target, key) {
        // 用于isReactive方法，判断是否为reactive
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        // 获取对应结果
        var res = Reflect.get(target, key);
        // 浅处理无需只想下列的递归处理
        if (shallow) {
            return res;
        }
        // 如果res是对象的话，再次进行处理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 将结果返回出去
        return res;
    };
}
var set = createSetter(); // 响应式
function createSetter() {
    return function set(target, key, value) {
        // 执行set操作，并获取新的value值
        var res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        // 将结果返回
        return res;
    };
}
// 可变的Proxy的handler
var mutableHandlers = {
    get: get,
    set: set // 拦截设置操作
};
// 浅处理响应式的handler
extend({}, mutableHandlers, { get: shallowGet });
// 只读的handler
var readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key) {
        // 当被设置时发出警告
        console.warn("Set operation on key \"".concat(String(key), "\" failed: target is readonly."), target);
        return true;
    }
};
// 浅处理只读的handler
var shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

/**
 * 生成响应式对象
 * @param target
 */
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
/**
 * 生成只读对象
 * @param target
 */
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
/**
 * 生成浅只读对象
 * @param target
 */
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}
/**
 * 创建Proxy
 * @param target
 * @param baseHandlers proxy处理器
 */
function createReactiveObject(target, baseHandlers) {
    return new Proxy(target, baseHandlers);
}
/**
 * 判断是否为对象，是的话进行响应式处理
 * @param value
 */
var toReactive = function (value) { return isObject(value) ? reactive(value) : value; };

/**
 * 触发依赖
 * @param ref
 */
function triggerRefValue(ref) {
    if (ref.dep) {
        // 触发依赖
        triggerEffects(ref.dep);
    }
}
// ref接口
/** @class */ ((function () {
    function RefImpl(value) {
        this.__v_isRef = true; // 用于isRef检验
        this._rawValue = value;
        this._value = toReactive(value);
    }
    Object.defineProperty(RefImpl.prototype, "value", {
        get: function () {
            // 返回值
            return this._value;
        },
        set: function (newVal) {
            // 判断newValue是否发生改变
            if (hasChanged(newVal, this._rawValue)) {
                // 赋值
                this._rawValue = newVal;
                this._value = toReactive(newVal);
                // 触发依赖
                triggerRefValue(this);
            }
        },
        enumerable: false,
        configurable: true
    });
    return RefImpl;
})());
/**
 * 判断是否为ref变量
 * @param r
 */
function isRef(r) {
    return !!(r && r.__v_isRef);
}
/**
 * 获取ref的value值，如果不是ref就返回本身
 * @param ref
 */
function unref(ref) {
    return isRef(ref) ? ref.value : ref;
}
// proxyRefs的处理器
var shallowUnwrapHandlers = {
    get: function (target, key) { return unref(Reflect.get(target, key)); },
    set: function (target, key, value) {
        var oldValue = target[key];
        // 如果oldValue是一个ref值，而newValue不是，则需要特殊处理
        if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
        }
        else {
            return Reflect.set(target, key, value);
        }
    }
};
/**
 * ref代理
 * @param objectWithRefs
 */
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return shallowReadonly(i.slots); }
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        var setupState = instance.setupState, props = instance.props;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initProps(instance, rawProps) {
    if (rawProps) {
        instance.props = rawProps;
    }
}

function emit(instance, event) {
    var rawArgs = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        rawArgs[_i - 2] = arguments[_i];
    }
    var props = instance.props;
    var handler = props[(toHandlerKey(event))] ||
        props[(toHandlerKey(camelize(event)))];
    if (handler && typeof handler === 'function') {
        handler && handler.apply(void 0, __spreadArray([], __read(rawArgs), false));
    }
}

var normalizeSlotValue = function (value) { return isArray(value) ? value : [value]; };
function normalizeObjectSlots(rawSlots, slots) {
    var _loop_1 = function (key) {
        var value = rawSlots[key];
        if (isFunction(value)) {
            slots[key] = function (props) { return normalizeSlotValue(value(props)); };
        }
    };
    for (var key in rawSlots) {
        _loop_1(key);
    }
}
function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, (instance.slots = {}));
    }
}

var currentInstance = null;
var getCurrentInstance = function () { return currentInstance; };
var setCurrentInstance = function (instance) { return currentInstance = instance; };
var unsetCurrentInstance = function () { return currentInstance = null; };
/**
 * 创建组件实例
 * @param vnode
 * @param parent
 */
function createComponentInstance(vnode, parent) {
    var instance = {
        vnode: vnode,
        type: vnode.type,
        parent: parent,
        render: null,
        proxy: null,
        provides: parent ? parent.provides : EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        props: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        emit: null,
        ctx: EMPTY_OBJ
    };
    instance.ctx = { _: instance };
    instance.emit = emit.bind(null, instance);
    return instance;
}
/**
 * 初始化组件
 * @param instance
 */
function setupComponent(instance) {
    var _a = instance.vnode, props = _a.props, children = _a.children;
    // 初始化属性
    initProps(instance, props);
    // 初始化插槽
    initSlots(instance, children);
    // 处理成有状态的组件
    setupStatefulComponent(instance);
}
/**
 * 组件状态化
 * @param instance
 */
function setupStatefulComponent(instance) {
    var Component = instance.type;
    var setup = Component.setup;
    // 初始化组件代理
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    if (setup) { // 处理setup钩子
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        unsetCurrentInstance();
        // 处理setup返回值
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理setup返回值
 * @param instance
 * @param setupResult
 */
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        // 将setupResult响应式，并赋值给实例
        instance.setupState = proxyRefs(setupResult);
    }
    // 当组件状态化后，实现render函数
    finishComponentSetup(instance);
}
/**
 * 当组件状态化后，实现render函数
 * @param instance
 */
function finishComponentSetup(instance) {
    var Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function provide(key, value) {
    if (currentInstance) {
        var provides = currentInstance.provides;
        var parentProvides = currentInstance.parent && currentInstance.parent.provides;
        // 初始化的时候，也就是组件第一次调用provide的时候，绑定通过原型链的方式绑定父级provide
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    var instance = currentInstance;
    if (instance) {
        var provides = instance.parent && instance.provides;
        if (provides && key in provides) {
            return provides[key];
        }
        else if (defaultValue) {
            return isFunction(defaultValue) ?
                defaultValue.call(instance.proxy) :
                defaultValue;
        }
    }
}

function h(type, props, children) {
    if (props === void 0) { props = null; }
    if (children === void 0) { children = null; }
    return createVNode(type, props, children);
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount: function (rootContainer) {
                // 创建虚拟节点vnode
                var vnode = createVNode(rootComponent);
                // 进行渲染
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    return baseCreateRenderer(options);
}
function baseCreateRenderer(options) {
    var patchProp = options.patchProp, insert = options.insert, createElement = options.createElement;
    /**
     * 渲染函数
     * @param vnode
     * @param container
     */
    var render = function (vnode, container) {
        if (vnode !== null) {
            patch(null, vnode, container, null, null);
        }
    };
    /**
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    var patch = function (n1, n2, container, anchor, parentComponent) {
        if (anchor === void 0) { anchor = null; }
        if (parentComponent === void 0) { parentComponent = null; }
        var type = n2.type, shapeFlag = n2.shapeFlag;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor, parentComponent);
                break;
            default:
                // 使用shapeFlag判断vnode类型
                if (shapeFlag & 1 /* ELEMENT */ /* element类型 */) {
                    processElement(n1, n2, container, anchor, parentComponent);
                }
                else if (shapeFlag & 6 /* COMPONENT */ /* 组件类型 */) {
                    processComponent(n1, n2, container, anchor, parentComponent);
                }
        }
    };
    function processText(n1, n2, container) {
        var children = n2.children;
        var textNode = document.createTextNode(children);
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
    function processFragment(n1, n2, container, anchor, parentComponent) {
        mountChildren(n2.children, container, anchor, parentComponent);
    }
    /**
     * 处理Element
     * @param n1
     * @param n2
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function processElement(n1, n2, container, anchor, parentComponent) {
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
    function mountElement(vnode, container, anchor, parentComponent) {
        var el = vnode.el = createElement(vnode.type);
        var children = vnode.children, props = vnode.props, shapeFlag = vnode.shapeFlag;
        if (shapeFlag & 8 /* TEXT_CHILDREN */) { // 文本节点
            el.textContent = children;
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) { // 虚拟节点数组
            mountChildren(children, el, null, parentComponent);
        }
        for (var key in props) {
            var val = props[key];
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
    var mountChildren = function (children, container, anchor, parentComponent, start) {
        if (start === void 0) { start = 0; }
        for (var i = start; i < children.length; i++) {
            var child = children[i];
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
    function processComponent(n1, n2, container, anchor, parentComponent) {
        if (n1 == null) {
            mountComponent(n2, container, anchor, parentComponent);
        }
    }
    /**
     * 挂载Component
     * @param initialVNode
     * @param container
     * @param anchor
     * @param parentComponent
     */
    function mountComponent(initialVNode, container, anchor, parentComponent) {
        // 创建组件实例
        var instance = createComponentInstance(initialVNode, parentComponent);
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
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 取出代理，在后续绑定render函数
        var proxy = instance.proxy;
        // 执行render函数，获取返回的vnode
        var subTree = instance.render.call(proxy);
        patch(null, subTree, container, anchor, instance);
        // 当全部组件挂载结束后，赋值el属性
        initialVNode.el = subTree.el;
    }
    return {
        render: render,
        createApp: createAppAPI(render)
    };
}

var doc = (typeof document !== 'undefined' ? document : null);
var nodeOps = {
    insert: function (child, parent) {
        parent.insertBefore(child, null);
    },
    createElement: function (tag) {
        var el = doc.createElement(tag);
        return el;
    }
};

var patchProp = function (el, key, prevValue, nextValue) {
    var isOn = function (key) { return /^on[A-Z]/.test(key); };
    if (isOn(key)) {
        var event_1 = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event_1, nextValue);
    }
    else {
        el.setAttribute(key, nextValue);
    }
};

var rendererOptions = extend({ patchProp: patchProp }, nodeOps);
var renderer = createRenderer(rendererOptions);
var createApp = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return renderer.createApp.apply(renderer, __spreadArray([], __read(args), false));
};

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlot = renderSlot;
//# sourceMappingURL=mini-vue.cjs.js.map
