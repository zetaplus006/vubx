import { IService, IMutation } from '../interfaces';

export function mutation(target: any, mutationyKey: string, descriptor: PropertyDescriptor) {
    const mutationFn = descriptor.value;
    descriptor.value = function (this: IService, ...arg: any[]) {
        const middleware = this.__.middleware,
            vubxMutation: IMutation = {
                type: this.__.identifier.toString() + ': ' + mutationyKey,
                payload: arg
            };
        const root = this.__.$root || this as IService;

        const temp = root.__.isCommitting;
        root.__.isCommitting = true;
        let res;
        try {
            middleware.dispatchBefore(this, vubxMutation, this);
            res = mutationFn.apply(this, arg);
            middleware.dispatchAfter(this, vubxMutation, this);

            // arguments is different
            // res =  middleware.createTask(mutationFn, this)(...arg);
        } finally {
            root.__.isCommitting = temp;
        }
        return res;
    };
    return descriptor;
}