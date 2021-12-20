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

/**
 * 创建一个依赖收集容器Dep
 * @param effects
 */
var createDep = function (effects) {
    return new Set(effects);
};

var onRE = /^on[^a-z]/;
var isOn = function (key) { return onRE.test(key); };
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
// 空函数
var NOOP = function () { };
// 空对象
var EMPTY_OBJ = {};
// 空对象
var EMPTY_ARR = [];
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
/**
 * 执行函数数组
 * @param fns
 * @param arg
 */
var invokeArrayFns = function (fns, arg) {
    for (var i = 0; i < fns.length; i++) {
        fns[i](arg);
    }
};

// 存储正在被收集依赖的ReactiveEffect实例
var activeEffect;
// 判断是否依赖收集
var shouldTrack = true;
// 存放修改状态前 shouldTrack 状态
var trackStack = [];
/**
 * 暂停依赖收集
 */
function pauseTrack() {
    trackStack.push(shouldTrack);
    shouldTrack = false;
}
/**
 * 重置依赖收集
 */
function resetTracking() {
    var last = trackStack.pop();
    shouldTrack = last === undefined ? true : last;
}
var ReactiveEffect = /** @class */ (function () {
    function ReactiveEffect(fn, scheduler) {
        if (scheduler === void 0) { scheduler = null; }
        this.scheduler = null;
        // 存储那些收集到该effect的dep
        this.deps = [];
        this.active = true;
        this.fn = fn; // 保存fn
        this.scheduler = scheduler;
    }
    ReactiveEffect.prototype.run = function () {
        // 当active为false时，即已经取消响应式监听，则无需再进行依赖收集
        if (!this.active) {
            return this.fn(); // 执行fn函数，并将结果返回
        }
        activeEffect = this; // 将实例赋值给activeEffect，用于依赖收集
        shouldTrack = true;
        var res = this.fn();
        shouldTrack = false;
        activeEffect = undefined;
        return res;
    };
    ReactiveEffect.prototype.stop = function () {
        if (this.active) {
            // 从依赖中将该effect删除
            cleanupEffect(this);
            // 执行onStop函数
            if (this.onStop) {
                this.onStop();
            }
            // 将active设置为false，避免反复调用stop反复
            this.active = false;
        }
    };
    return ReactiveEffect;
}());
/**
 * 将effect从依赖中清空
 * @param effect {ReactiveEffect}
 */
function cleanupEffect(effect) {
    effect.deps.forEach(function (dep) {
        dep.delete(effect);
    });
    // 清空掉effect.deps
    effect.deps.length = 0;
}
// 用于存储target依赖  target -> depsMap
var targetMap = new WeakMap();
/**
 * 依赖收集
 * @desc  通过target和key拿到对应的dep依赖收集容器（没有则新建），然后将对应的ReactiveEffect实例存储进去
 * @param target 目标对象
 * @param key key值
 */
function track(target, key) {
    if (!isTracking())
        return;
    // 获取对应依赖的depsMap
    var depsMap = targetMap.get(target);
    // 没有则初始化
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap = new Map());
    }
    // 获取对应key值的依赖dep
    var dep = depsMap.get(key);
    // 没有则初始化
    if (!dep) {
        dep = createDep();
        depsMap.set(key, dep);
    }
    // 存储依赖
    trackEffects(dep);
}
/**
 * 收集effects
 * @param dep
 */
function trackEffects(dep) {
    if (!dep.has(activeEffect)) {
        // 将activeEffect存储到dep中
        dep.add(activeEffect /* 非空断言 */);
        // 反向存储dep
        activeEffect.deps.push(dep);
    }
}
/**
 * 判断是否可以收集依赖
 */
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
/**
 * 主要负责依赖收集
 * @param fn {Function} 依赖方法
 * @param options {ReactiveEffectOptions} 选项
 */
function effect(fn, options) {
    // 新建ReactiveEffect示例，将fn存储起来
    var _effect = new ReactiveEffect(fn);
    if (options) {
        // 合并options到_effect中
        extend(_effect, options);
    }
    // 执行run方法，调用fn函数，从而触发fn中的响应式数据进行依赖收集
    _effect.run();
    // 返回一个runner函数
    var runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) { // 只读情况下不需要依赖收集
            track(target, key); // 依赖收集
        }
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
var shallowReactiveHandlers = extend({}, mutableHandlers, { get: shallowGet });
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
 * 生成浅响应式对象
 * @param target
 */
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
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
 * 判断是否为响应式对象
 * @param value
 */
function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
}
/**
 * 判断是否为只读对象
 * @param value
 */
function isReadonly(value) {
    return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
}
/**
 * 判断是否由reactive或readonly生成的proxy
 * @param value
 */
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
/**
 * 判断是否为对象，是的话进行响应式处理
 * @param value
 */
var toReactive = function (value) { return isObject(value) ? reactive(value) : value; };

/**
 * 依赖收集
 * @param ref
 */
function trackRefValue(ref) {
    if (isTracking()) {
        if (!ref.dep) {
            // 如果没有dep的话，初始化一个dep
            ref.dep = createDep();
        }
        // 依赖收集
        trackEffects(ref.dep);
    }
}
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
var RefImpl = /** @class */ (function () {
    function RefImpl(value) {
        this.__v_isRef = true; // 用于isRef检验
        this._rawValue = value;
        this._value = toReactive(value);
    }
    Object.defineProperty(RefImpl.prototype, "value", {
        get: function () {
            // 依赖收集
            trackRefValue(this);
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
}());
/**
 * ref响应式处理
 * @param value
 */
function ref(value) {
    return new RefImpl(value);
}
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

var ComputedRefImpl = /** @class */ (function () {
    function ComputedRefImpl(getter, setter) {
        var _this = this;
        this._dirty = true; // 为true的话代表需要更新数据
        this.__v_isRef = true;
        this._setter = setter;
        // 新建ReactiveEffect示例，并且配置scheduler函数，避免响应式数据更新时调用run，从而实现computed缓存特性
        this.effect = new ReactiveEffect(getter, function () {
            // 将_dirty设置为true，代表下次调用computed值时需要更新数据
            if (!_this._dirty) {
                _this._dirty = true;
            }
        });
    }
    Object.defineProperty(ComputedRefImpl.prototype, "value", {
        get: function () {
            if (this._dirty) { // 更新value
                this._dirty = false;
                this._value = this.effect.run();
            }
            return this._value;
        },
        set: function (newValue) {
            this._setter(newValue);
        },
        enumerable: false,
        configurable: true
    });
    return ComputedRefImpl;
}());
/**
 * 计算属性
 * @param getterOrOptions
 */
function computed(getterOrOptions) {
    var getter;
    var setter;
    // 判断getterOrOptions是getter还是options
    var onlyGetter = isFunction(getterOrOptions);
    if (onlyGetter) {
        getter = getterOrOptions;
        setter = NOOP;
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}

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
var normalizeKey = function (_a) {
    var key = _a.key;
    return key != null ? key : null;
};
function createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag) {
    if (props === void 0) { props = null; }
    if (children === void 0) { children = null; }
    if (shapeFlag === void 0) { shapeFlag = 0; }
    var vnode = {
        type: type,
        props: props,
        children: children,
        shapeFlag: shapeFlag,
        component: null,
        el: null,
        key: props && normalizeKey(props)
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
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}

function renderSlot(slots, name, props) {
    if (props === void 0) { props = {}; }
    var slot = slots[name];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
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
        next: null,
        subTree: null,
        update: null,
        render: null,
        proxy: null,
        provides: parent ? parent.provides : EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        props: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        emit: null,
        ctx: EMPTY_OBJ,
        isMounted: false,
        bm: null,
        m: null,
        bu: null,
        u: null
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    var prevProps = prevVNode.props;
    var nextProps = nextVNode.props;
    if (prevProps === nextProps)
        return false;
    if (!prevProps)
        return !nextProps;
    if (!nextProps)
        return true;
    return hasPropsChanged(prevProps, nextProps);
}
function hasPropsChanged(prevProps, nextProps) {
    var nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length)
        return true;
    for (var i = 0; i < nextKeys.length; i++) {
        var key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createRenderer(options) {
    return baseCreateRenderer(options);
}
function baseCreateRenderer(options) {
    var hostPatchProp = options.patchProp, hostRemove = options.remove, hostInsert = options.insert, hostCreateElement = options.createElement, hostSetElementText = options.setElementText;
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
        if (n1 === n2)
            return;
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
        else {
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
    function mountElement(vnode, container, anchor, parentComponent) {
        var el = vnode.el = hostCreateElement(vnode.type);
        var children = vnode.children, props = vnode.props, shapeFlag = vnode.shapeFlag;
        if (shapeFlag & 8 /* TEXT_CHILDREN */) { // 文本节点
            el.textContent = children;
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) { // 虚拟节点数组
            mountChildren(children, el, null, parentComponent);
        }
        for (var key in props) {
            var val = props[key];
            hostPatchProp(el, key, '', val);
        }
        hostInsert(el, container, anchor);
    }
    function patchElement(n1, n2, parentComponent) {
        var el = (n2.el = n1.el);
        var oldProps = n1.props || EMPTY_OBJ;
        var newProps = n2.props || EMPTY_OBJ;
        patchChildren(n1, n2, el, null, parentComponent);
        patchProps(el, n2, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, anchor, parentComponent) {
        var c1 = n1 && n1.children;
        var prevShapeFlag = n1 ? n1.shapeFlag : 0;
        var c2 = n2.children;
        var shapeFlag = n2.shapeFlag;
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                // 将 oldChildren 清空
                unmountChildren(c1);
            }
            // 更新文本
            if (c2 !== c1) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent);
                }
                else {
                    unmountChildren(c1);
                }
            }
            else {
                if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                    hostSetElementText(container, '');
                }
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    mountChildren(c2, container, anchor, parentComponent);
                }
            }
        }
    }
    function unmountChildren(children, parentComponent, start) {
        if (start === void 0) { start = 0; }
        for (var i = start; i < children.length; i++) {
            hostRemove(children[i].el);
        }
    }
    function patchProps(el, vnode, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (var key in newProps) {
                var next = newProps[key];
                var prev = oldProps[key];
                if (next !== prev) {
                    hostPatchProp(el, key, prev, next);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (var key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentAnchor, parentComponent) {
        var i = 0;
        var l2 = c2.length;
        var e1 = c1.length - 1;
        var e2 = l2 - 1;
        // (a b) c
        // (a b) d e
        while (i <= e1 && i <= e2) {
            var n1 = c1[i];
            var n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, null, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // a (b c)
        // d e (b c)
        while (i <= e1 && i <= e2) {
            var n1 = c1[e1];
            var n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, null, parentComponent);
            }
            else {
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
        if (i > e1) {
            if (i <= e2) {
                var nextPos = e2 + 1;
                var anchor = nextPos < l2 ?
                    c2[nextPos].el :
                    parentAnchor;
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
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // [i ... e1 + 1]: a b [c d e] f g
        // [i ... e2 + 1]: a b [e d c h] f g
        // i = 2, e1 = 4, e2 = 5
        else {
            var s1 = i;
            var s2 = i;
            var keyToNewIndexMap = new Map();
            for (i = s2; i <= e2; i++) {
                var nextChild = c2[i];
                if (nextChild.key !== null) {
                    keyToNewIndexMap.set(nextChild.key, i);
                }
            }
            var j = void 0;
            var patched = 0;
            var toBePatched = e2 - s2 + 1;
            var moved = false;
            var maxNewIndexSoFar = 0;
            var newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            for (i = s1; i <= e1; i++) {
                var prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                var newIndex = void 0;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (j = s2; j <= e2; j++) {
                        if (newIndexToOldIndexMap[j - s2] === 0 &&
                            isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newIndex], container, null, parentComponent);
                    patched++;
                }
            }
            var increasingNewIndexSequence = moved ?
                getSequence(newIndexToOldIndexMap) :
                EMPTY_ARR;
            j = increasingNewIndexSequence.length + 1;
            for (i = toBePatched - 1; i >= 0; i--) {
                var nexIndex = s2 + i;
                var nextChild = c2[nexIndex];
                var anchor = nexIndex + 1 < l2 ? c2[nexIndex + 1].el : parentAnchor;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, anchor, parentComponent);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
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
        else {
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
    function mountComponent(initialVNode, container, anchor, parentComponent) {
        // 创建组件实例
        var instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
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
        var componentUpdateFn = function () {
            if (!instance.isMounted) { // 初始化
                // 取出代理，在后续绑定render函数
                var proxy = instance.proxy, bm = instance.bm, m = instance.m;
                // beforeMount Hook
                if (bm) {
                    invokeArrayFns(bm);
                }
                // 执行render函数，获取返回的vnode
                var subTree = instance.subTree = instance.render.call(proxy);
                patch(null, subTree, container, anchor, instance);
                // 当全部组件挂载结束后，赋值el属性
                initialVNode.el = subTree.el;
                // mounted Hook
                if (m) {
                    invokeArrayFns(m);
                }
                instance.isMounted = true;
            }
            else { // 更新
                var proxy = instance.proxy, next = instance.next, vnode = instance.vnode, bu = instance.bu, u = instance.u;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                if (bu) {
                    invokeArrayFns(bu);
                }
                var nextTree = instance.render.call(proxy);
                var prevTree = instance.subTree;
                instance.subTree = nextTree;
                patch(prevTree, nextTree, container, anchor, instance);
                if (u) {
                    invokeArrayFns(u);
                }
            }
        };
        instance.update = effect(componentUpdateFn, {
        // TODO 微任务队列
        // scheduler: () => {}
        });
    }
    function updateComponent(n1, n2) {
        var instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.component = n1.component;
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function updateComponentPreRender(instance, nextVNode) {
        var props = nextVNode.props;
        // 更新组件props
        instance.props = props || EMPTY_OBJ;
    }
    return {
        render: render,
        createApp: createAppAPI(render)
    };
}
/**
 * 求最长递增子序列在原数组的下标数组
 * @param arr {number[]}
 * @return {number[]}
 */
function getSequence(arr) {
    // 浅拷贝arr
    var _arr = arr.slice();
    var len = _arr.length;
    // 存储最长递增子序列对应arr中下标
    var result = [0];
    for (var i = 0; i < len; i++) {
        var val = _arr[i];
        // 排除等于 0 的情况
        if (val !== 0) {
            /* 1. 贪心算法 */
            // 获取result当前最大值的下标
            var j = result[result.length - 1];
            // 如果当前 val 大于当前递增子序列的最大值的时候，直接添加
            if (arr[j] < val) {
                _arr[i] = j; // 保存上一次递增子序列最后一个值的索引
                result.push(i);
                continue;
            }
            /* 2. 二分法 */
            // 定义二分法查找区间 [left, right]
            var left = 0;
            var right = result.length - 1;
            while (left < right) {
                // 求中间值（向下取整）
                var mid = (left + right) >> 1;
                if (arr[result[mid]] < val) {
                    left = mid + 1;
                }
                else {
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
    var len2 = result.length;
    var idx = result[len2 - 1];
    // 倒序回溯，通过之前 _arr 记录的上一次递增子序列最后一个值的索引
    // 进而找到最终正确的索引
    while (len2-- > 0) {
        result[len2] = idx;
        idx = _arr[idx];
    }
    return result;
}

function injectHook(type, hook, target) {
    if (target === void 0) { target = currentInstance; }
    if (target) {
        var hooks = target[type] || (target[type] = []);
        hooks.push(function () {
            pauseTrack();
            setCurrentInstance(target);
            hook();
            unsetCurrentInstance();
            resetTracking();
        });
    }
}
var createHook = function (lifecycle) {
    return function (hook, target) {
        if (target === void 0) { target = currentInstance; }
        return injectHook(lifecycle, hook, target);
    };
};
var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
var onMounted = createHook("m" /* MOUNTED */);
var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
var onUpdated = createHook("u" /* UPDATED */);

var doc = (typeof document !== 'undefined' ? document : null);
var nodeOps = {
    insert: function (child, parent, anchor) {
        parent.insertBefore(child, anchor || null);
    },
    createElement: function (tag) {
        var el = doc.createElement(tag);
        return el;
    },
    remove: function (child) {
        var parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    setElementText: function (el, text) {
        el.textContent = text;
    },
};

var patchProp = function (el, key, prevValue, nextValue) {
    if (isOn(key)) {
        var event_1 = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event_1, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
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

export { computed, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, provide, proxyRefs, reactive, readonly, ref, renderSlot, shallowReactive, shallowReadonly, toReactive, triggerRefValue, unref };
//# sourceMappingURL=mini-vue.esm.js.map
