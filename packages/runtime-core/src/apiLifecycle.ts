import {
    ComponentInternalInstance,
    currentInstance,
    LifecycleHooks,
    setCurrentInstance,
    unsetCurrentInstance
} from "runtime-core/component";
import {pauseTrack, resetTracking} from "reactivity/effect";

function injectHook(
    type: LifecycleHooks,
    hook: Function,
    target: ComponentInternalInstance | null = currentInstance
) {
    if (target) {
        const hooks = target[type] || (target[type] = []);
        hooks.push(() => {
            pauseTrack();
            setCurrentInstance(target);
            hook();
            unsetCurrentInstance();
            resetTracking();
        });
    }
}

export const createHook =
    <T extends Function = () => any>(lifecycle: LifecycleHooks) =>
        (hook: T, target: ComponentInternalInstance | null = currentInstance) =>
            injectHook(lifecycle, hook, target)

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
