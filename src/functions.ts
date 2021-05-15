import { _asExecutorPrivate, _ExecutorPrivate, _implementCombinedExecutor, _ImplementedOperations, _ImplementedOperationTypes, _implementInterceptor } from "./implementation"
import type { Executor, OperationType } from "./types"

export function combineExecutors<Context>(...executors: Array<Executor<Context>>): Executor<Context> {
    const implementedOperations: _ImplementedOperations = {}
    const implementedOperationTypes: _ImplementedOperationTypes = {}

    executors.map((executor) => {
        const privateExecutor = _asExecutorPrivate(executor)
        for (let operationName in privateExecutor._implementedOperations) {
            implementedOperations[operationName] = privateExecutor._implementedOperations[operationName]!
            implementedOperationTypes[operationName] = privateExecutor._implementedOperationTypes[operationName]!
        }
    })

    return _implementCombinedExecutor<Context>(implementedOperations, implementedOperationTypes)
}

export function filterImplementationsByOperationType<Context>(executor: Executor<Context>, filter: (operationType: OperationType<unknown, unknown>) => boolean): Executor<Context> {
    const implementedOperations: _ImplementedOperations = {}
    const implementedOperationTypes: _ImplementedOperationTypes = {}
    const executorPrivate = _asExecutorPrivate(executor)

    for (let operationName in executorPrivate._implementedOperations) {
        const impl = executorPrivate._implementedOperations[operationName]!
        const op = executorPrivate._implementedOperationTypes[operationName]!
        if (filter(op)) {
            implementedOperations[operationName] = impl
            implementedOperationTypes[operationName] = op
        }
    }

    return _implementCombinedExecutor<Context>(implementedOperations, implementedOperationTypes)
}

export function interceptAnyOperation<Context>(executor: Executor<Context>, interceptor: (operation: unknown, context: Context, operationType: OperationType<unknown, unknown>, next: Executor<Context>) => Promise<unknown>): Executor<Context> {
    const implementedOperations: _ImplementedOperations = {}
    const implementedOperationTypes: _ImplementedOperationTypes = {}
    const executorPrivate = _asExecutorPrivate(executor)

    for (let operationName in executorPrivate._implementedOperations) {
        const impl = executorPrivate._implementedOperations[operationName]!
        const op = executorPrivate._implementedOperationTypes[operationName]!
        implementedOperations[operationName] = _implementInterceptor<Context>(op, impl, interceptor)
        implementedOperationTypes[operationName] = op
    }

    return _implementCombinedExecutor<Context>(implementedOperations, implementedOperationTypes)
}

export function hasOperationImplementation(executor: Executor<any>, operationType: OperationType<unknown, unknown>): boolean {
    const executorPrivate = _asExecutorPrivate(executor)
    return operationType.name in executorPrivate._implementedOperations
}

export function getImplementedOperations(executor: Executor<any>): OperationType<unknown, unknown>[] {
    const executorPrivate = _asExecutorPrivate(executor)
    return Object.values(executorPrivate._implementedOperationTypes)
}

export function getImplementedOperationByName(executor: Executor<any>, operationName: string): OperationType<unknown, unknown> | undefined {
    const executorPrivate = _asExecutorPrivate(executor)
    return executorPrivate._implementedOperationTypes[operationName]
}
