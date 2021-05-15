import { combineExecutors, ExecutorContextType, filterImplementationsByOperationType, getImplementedOperationByName, getImplementedOperations, hasOperationImplementation, interceptAnyOperation, OperationArgumentType, OperationResultType } from "../src"
import { AppContext, context, executor, getOtherPersons, GetPersons, getPersons, getPersonsNotImplemented, operation, otherExecutor, otherOperation, otherPersons, Person, persons } from "./shared"

test('operation implementation', () => {
    expect(
        getImplementedOperations(executor)
    ).toEqual([getPersons])
    expect(
        getImplementedOperationByName(executor, getPersons.name)
    ).toEqual(getPersons)
    expect(
        getImplementedOperationByName(executor, getPersonsNotImplemented.name)
    ).toEqual(undefined)
    expect(
        hasOperationImplementation(executor, getPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(executor, getPersonsNotImplemented)
    ).toBeFalsy()
    return getPersons.execute(operation, context, executor).then(result => {
        expect(result).toBe(persons)
    })
})

test('combine executors', () => {
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    expect(
        getImplementedOperations(combinedExecutor)
    ).toEqual([getPersons, getOtherPersons])
    expect(
        getImplementedOperationByName(combinedExecutor, getPersons.name)
    ).toEqual(getPersons)
    expect(
        getImplementedOperationByName(combinedExecutor, getOtherPersons.name)
    ).toEqual(getOtherPersons)
    expect(
        getImplementedOperationByName(executor, getPersonsNotImplemented.name)
    ).toEqual(undefined)
    expect(
        hasOperationImplementation(combinedExecutor, getPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(combinedExecutor, getOtherPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(executor, getPersonsNotImplemented)
    ).toBeFalsy()
    return Promise.all([
        getPersons.execute(operation, context, combinedExecutor).then(result => {
            expect(result).toBe(persons)
        }),
        getOtherPersons.execute(otherOperation, context, combinedExecutor).then(result => {
            expect(result).toBe(otherPersons)
        })
    ])
})

test('filter implementations', () => {
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const filteredExecutor = filterImplementationsByOperationType(combinedExecutor, type => {
        return type === getPersons
    })
    expect(
        getImplementedOperations(filteredExecutor)
    ).toEqual([getPersons])
    expect(
        getImplementedOperationByName(filteredExecutor, getPersons.name)
    ).toEqual(getPersons)
    expect(
        getImplementedOperationByName(filteredExecutor, getOtherPersons.name)
    ).toEqual(undefined)
    expect(
        getImplementedOperationByName(executor, getPersonsNotImplemented.name)
    ).toEqual(undefined)
    expect(
        hasOperationImplementation(filteredExecutor, getPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(filteredExecutor, getOtherPersons)
    ).toBeFalsy()
    expect(
        hasOperationImplementation(executor, getPersonsNotImplemented)
    ).toBeFalsy()
})

test('intercept any operation', () => {
    const interceptorResult: Person[] = []

    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const interceptedExecutor = interceptAnyOperation(combinedExecutor, (op, ctx, type, next) => {
        return type.execute(op, ctx, next).then(result => {
            if (type === getPersons) {
                expect(result).toBe(persons)
            } else if (type === getOtherPersons) {
                expect(result).toBe(otherPersons)
            } else {
                fail('it must never happen')
            }
            return interceptorResult
        })
    })
    expect(
        getImplementedOperations(interceptedExecutor)
    ).toEqual([getPersons, getOtherPersons])
    expect(
        getImplementedOperationByName(interceptedExecutor, getPersons.name)
    ).toEqual(getPersons)
    expect(
        getImplementedOperationByName(interceptedExecutor, getOtherPersons.name)
    ).toEqual(getOtherPersons)
    expect(
        getImplementedOperationByName(executor, getPersonsNotImplemented.name)
    ).toEqual(undefined)
    expect(
        hasOperationImplementation(interceptedExecutor, getPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(interceptedExecutor, getOtherPersons)
    ).toBeTruthy()
    expect(
        hasOperationImplementation(executor, getPersonsNotImplemented)
    ).toBeFalsy()
    return Promise.all([
        getPersons.execute(operation, context, interceptedExecutor).then(result => {
            expect(result).toBe(interceptorResult)
        }),
        getOtherPersons.execute(otherOperation, context, interceptedExecutor).then(result => {
            expect(result).toBe(interceptorResult)
        })
    ])
})

test('operation execute function', () => {
    return getPersons.execute(operation, (op, type) => {
        expect(op).toBe(operation)
        expect(type).toBe(getPersons)
        return Promise.resolve(persons)
    }).then(result => {
        expect(result).toBe(persons)
    })
})

test('get operation argument type', () => {
    const opArg: OperationArgumentType<typeof getPersons> = operation
    const opArg2: GetPersons = opArg
    expect(opArg2).toBe(operation) // this test fail at compile type
})

test('get operation result type', () => {
    const opResult: OperationResultType<typeof getPersons> = persons
    const opResult2: Person[] = opResult
    expect(opResult2).toBe(persons) // this test fail at compile type
})

test('get executor context type', () => {
    const ctx: ExecutorContextType<typeof executor> = context
    const ctx2: AppContext = ctx
    expect(ctx2).toBe(context) // this test fail at compile type
})

test('ensure when operation is executed receives the proper context', () => {
    const ctx = {}
    const executor2 = getPersons.implementAs<AppContext>((_op, _ctx, _type) => {
        return Promise.resolve(persons)
    })
    // @ts-expect-error
    return getPersons.execute(operation, ctx, executor2) // this test fail at compile type
})

test('ensure executor asignation respect context type', () => {
    let executor2 = getPersons.implementAs<AppContext>((_op, _ctx, _type) => {
        return Promise.resolve(persons)
    })
    let executor3 = getPersons.implementAs<AppContext & { foo: string }>((_op, _ctx, _type) => {
        return Promise.resolve(persons)
    })
    // @ts-expect-error
    executor2 = executor3
    executor3 = executor2
    // this test fail at compile type
})