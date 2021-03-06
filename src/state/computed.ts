/**
 * change from https://github.com/vuejs/vue/blob/dev/src/core/instance/state.js#L163
 */
import { ClassMetaData } from '../di/class_meta';
import { assert, def, defGet, hideProperty, isDev } from '../util';
import { isSSR, noop } from './helper';
import { ScopeData } from './scope';
import { Dep, IWatcher, IWatcherOption, Watcher } from './watcher';

export interface IComputedOption {
    enumerable: boolean;
}
const defaultComputedOption: IComputedOption = { enumerable: false };

const computedWatcherOptions: IWatcherOption = {
    lazy: true,
    computed: true
};

export function Computed(option: IComputedOption): any;
export function Computed(target: object, propertyKey: string): any;
export function Computed(targetOrOption: any, propertyKey?: string): any {
    if (propertyKey) {
        return createComputed(defaultComputedOption, targetOrOption, propertyKey);
    } else {
        return function (target: object, key: string) {
            return createComputed(targetOrOption, target, key);
        };
    }
}

export const watcherKey = '_watchers';

export const createComputed = isSSR
    // tslint:disable-next-line:no-empty
    ? noop as any
    : _createComputed;

export function _createComputed(option: IComputedOption, target: any, propertyKey: string): PropertyDescriptor {
    const desc = Object.getOwnPropertyDescriptor(target, propertyKey);
    if (process.env.NODE_ENV !== 'production') {
        assert(desc && desc.get, '[@Getter] must be used for getter property');
    }
    const get = desc!.get!;
    ClassMetaData.get(target).addGetterKey(propertyKey);
    return {
        get() {
            const scope = ScopeData.get(this);
            if (!this[watcherKey]) {
                hideProperty(this, watcherKey, []);
            }
            const watcher = new Watcher(
                this,
                get,
                noop,
                computedWatcherOptions
            );
            const getter = createComputedGetter(watcher);
            def(this, propertyKey, {
                get: getter,
                enumerable: option.enumerable,
                configurable: true
            });
            if (isDev) {
                defGet(scope.$getters, propertyKey, () => this[propertyKey]);
            }
            return getter();
        },
        enumerable: option.enumerable,
        configurable: true
    };
}

function createComputedGetter(watcher: IWatcher) {
    return function computedGetter() {
        if (watcher.dirty) {
            watcher.evaluate();
        }
        if (Dep.target) {
            watcher.depend();
        }
        return watcher.value;
    };
}
