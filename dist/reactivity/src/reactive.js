import { def } from '@/shared/index';
import { mutableHandlers, readonlyHandlers } from './handlers';
export function reactive(target) {
    if (isReactive(target))
        return target;
    if (hasOwn(target, "__v_reactive" /* REACTIVE */))
        return target["__v_reactive" /* REACTIVE */];
    const observed = new Proxy(target, mutableHandlers);
    def(target, "__v_reactive" /* REACTIVE */, observed);
    return observed;
}
export function readonly(target) {
    if (isReadonly(target))
        return target;
    const observed = new Proxy(target, readonlyHandlers);
    def(target, "__v_readonly" /* READONLY */, observed);
    return observed;
}
export function isReactive(target) {
    return !!(target && target["__v_isReactive" /* IS_REACTIVE */]);
}
export function isReadonly(target) {
    return !!(target && target["__v_isReadonly" /* IS_READONLY */]);
}
