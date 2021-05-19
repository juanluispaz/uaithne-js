import { OperationExecutionError, PublicError } from "./errors";
import type { Executor, OperationArgumentType, OperationResultType, OperationType } from "./types";

export type _ImplementedOperations = { [operationName: string]: _ExecutorPrivate<any> }
export type _ImplementedOperationTypes = { [operationName: string]: OperationType<any, any> }

export function _asExecutorPrivate<Context>(executor: Executor<Context>) {
    return executor as any as _ExecutorPrivate<Context>
}

export interface _ExecutorPrivate<Context> extends Executor<Context> {
    <Op, Result, Type extends OperationType<Op, Result>>(operation: Op, context: Context, operationType: Type): Promise<Result>
    _implementedOperations: _ImplementedOperations
    _implementedOperationTypes: _ImplementedOperationTypes
}

export function _implementExecutor<Type extends OperationType<any, any>, Context>(operationType: Type, executor: (operation: OperationArgumentType<Type>, context: Context, operationType: Type) => Promise<OperationResultType<Type>>): _ExecutorPrivate<Context> {
    function executorImpl(operation: OperationArgumentType<Type>, context: Context, type: OperationType<any, any>): Promise<OperationResultType<Type>> {
        if (operationType !== type) {
            throw new OperationExecutionError(operation, context, type, 'No handler found for the operation: ' + type.name)
        }
        try {
            return executor(operation, context, operationType);
        } catch (error) {
            if (error instanceof OperationExecutionError) {
                if (error.sameContent(operation, context, operationType)) {
                    throw error
                }
                throw new OperationExecutionError(operation, context, operationType, undefined, error)
            } else if (PublicError.isPublicError(error)) {
                throw error
            } else {
                throw new OperationExecutionError(operation, context, operationType, undefined, error)
            }
        }
    }
    const impl = executorImpl as any as _ExecutorPrivate<Context>
    impl._implementedOperations = {
        [operationType.name]: impl
    };
    impl._implementedOperationTypes = {
        [operationType.name]: operationType
    }
    return impl
}

export function _implementCombinedExecutor<Context>(implementedOperations: _ImplementedOperations, implementedOperationTypes: _ImplementedOperationTypes): _ExecutorPrivate<Context> {
    function executorImpl(operation: any, context: any, operationType: OperationType<any, any>): Promise<any> {
        const impl = implementedOperations[operationType.name]
        if (!impl) {
            throw new OperationExecutionError(operation, context, operationType, 'No handler found for the operation: ' + operationType.name)
        }
        return impl(operation, context, operationType)
    }
    const impl = executorImpl as any as _ExecutorPrivate<Context>
    impl._implementedOperations = implementedOperations
    impl._implementedOperationTypes = implementedOperationTypes
    return impl
}

export function _implementInterceptor<Context>(operationType: OperationType<any, any>, impl: _ExecutorPrivate<Context>, interceptor: (operation: unknown, context: Context, operationType: OperationType<unknown, unknown>, next: Executor<Context>) => Promise<unknown>): _ExecutorPrivate<Context> {
    function executorImpl(operation: any, context: any, opType: OperationType<any, any>): Promise<any> {
        try {
            return interceptor(operation, context, opType, impl);
        } catch (error) {
            if (error instanceof OperationExecutionError) {
                if (error.sameContent(operation, context, opType)) {
                    throw error
                }
                throw new OperationExecutionError(operation, context, opType, undefined, error)
            } else if (PublicError.isPublicError(error)) {
                throw error
            } else {
                throw new OperationExecutionError(operation, context, opType, undefined, error)
            }
        }
    }

    const intercepted = executorImpl as any as _ExecutorPrivate<Context>
    intercepted._implementedOperations = {
        [operationType.name]: intercepted
    }
    intercepted._implementedOperationTypes = {
        [operationType.name]: operationType
    }
    return intercepted
}