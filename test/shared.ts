import { OperationType } from "../src"

export interface AppContext {
    db: string
}

export interface GetPersons {
    name: string
}

export interface Person {
    id: number,
    name: string
}

export const context: AppContext = { db: 'database url' }

export const getPersons = new OperationType<GetPersons, Person[]>('getPersons')
export const operation: GetPersons = { name: 'person name' }
export const person: Person = { id: 123, name: 'a name' }
export const persons: Person[] = [person]

export const getOtherPersons = new OperationType<GetPersons, Person[]>('getOtherPersons')
export const otherOperation: GetPersons = { name: 'other person name' }
export const otherPerson: Person = { id: 456, name: 'other name' }
export const otherPersons: Person[] = [otherPerson]

export const getPersonsNotImplemented = new OperationType<GetPersons, Person[]>('getPersonsNotImplemented')

export const executor = getPersons.implementAs<AppContext>((op, ctx, type) => {
    expect(op).toBe(operation)
    expect(ctx).toBe(context)
    expect(type).toBe(getPersons)
    return Promise.resolve(persons)
})

export const otherExecutor = getOtherPersons.implementAs<AppContext>((op, ctx, type) => {
    expect(op).toBe(otherOperation)
    expect(ctx).toBe(context)
    expect(type).toBe(getOtherPersons)
    return Promise.resolve(otherPersons)
})