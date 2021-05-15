import { _asExecutorPrivate, _ImplementedOperationTypes, _implementExecutor } from "./implementation"

const _operationType: unique symbol = Symbol('operationType')
const _resultType: unique symbol = Symbol('resultType')
const _type: unique symbol = Symbol('type')
const _executorContext: unique symbol = Symbol('executorPrivate')

export interface Executor<Context> {
    readonly [_type]: 'Executor'
    readonly [_executorContext]: (context: Context) => void
}

export class OperationType<Op, Result> {
    readonly name: string
    readonly [_operationType]: Op
    readonly [_resultType]: Result
    readonly [_type]: 'OperationType'

    constructor(name: string) {
        this.name = name

        if (name in _knownOperations) {
            throw new Error('Another operation with name "' + name + '" already exists')
        }
        _knownOperations[name] = this
    }

    implementAs<Context>(executor: (operation: Op, context: Context, operationType: this) => Promise<Result>): Executor<Context> {
        return _implementExecutor(this, executor)
    }

    execute<ExecutorContext, Context extends ExecutorContext>(operation: Op, context: Context, executor: Executor<ExecutorContext>): Promise<Result>
    execute(operation: Op, fn: (operation: Op, operationType: this) => Promise<Result>): Promise<Result>
    execute<Context>(operation: Op, context: Context, executor?: Executor<Context>): Promise<Result> {
        if (!executor) {
            const fn: (operation: Op, operationType: this) => Promise<Result> = context as any
            return fn(operation, this)
        }
        return _asExecutorPrivate(executor)(operation, context, this)
    }
}

export type ExecutorContextType<ExecutorType extends Executor<any>> = ExecutorType extends Executor<infer context> ? context : never
export type OperationArgumentType<Type extends OperationType<any, any>> = Type[typeof _operationType]
export type OperationResultType<Type extends OperationType<any, any>> = Type[typeof _resultType]

export const _knownOperations: _ImplementedOperationTypes = {}


