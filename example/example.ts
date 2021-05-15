import { combineExecutors, Executor, getImplementedOperationByName, interceptAnyOperation, OperationType } from "../src"

/* ********************************************************************************************************************
 * Definitions
 */

interface AppContext {
    db: string
}

interface GetPersons {
    name: string
}

interface Person {
    id: number,
    name: string
}

const getPersons = new OperationType<GetPersons, Person[]>('getPersons')

/* ********************************************************************************************************************
 * Implementations
 */

function implementPersonModule() {
    const getPersonImpl = getPersons.implementAs<AppContext>(async (op, context) => {
        console.log('quering the database')
        return [{ id: 10, name: op.name + ' with ' + context.db }]
    })

    return combineExecutors(
        getPersonImpl
    )
}

function implementPersonModuleInterceptor(next: Executor<AppContext>) {
    const getPersonImpl = getPersons.implementAs<AppContext>(async (op, context) => {
        console.log('pre interceptor ', op, context)
        const result = await getPersons.execute(op, context, next)
        console.log('post interceptor', result)
        return result
    })

    return combineExecutors(
        getPersonImpl
    )
}

/* ********************************************************************************************************************
 * Build the bus
 */

const dbLayer = combineExecutors(
    implementPersonModule()
)

const bussinessLayer = combineExecutors(
    dbLayer,
    implementPersonModuleInterceptor(dbLayer)
)

const bus = interceptAnyOperation(bussinessLayer, async (op, context, operationType, next) => {
    if (operationType === getPersons) {
        console.log('is getPerson', op)
    } else {
        console.log('is not getPerson', op)
    }

    const result = await operationType.execute(op, context, next)
    console.log('result', result)
    return result
})

/* ********************************************************************************************************************
 * Usage example
 */

const appContext: AppContext = {
    db: 'database url'
}

const op: GetPersons = {
    name: 'person name'
}

// You can execute the opetarion using the execute method in the operation type
getPersons.execute(op, appContext, bus).then(result => console.log('final', result))

setTimeout(() => {
    console.log(' ')
    /*
     * You can get the operation type from the executor using its name
     * It is useful if you need to dynamic dispatch an operation
     * But, there is no type validation for the operation object
     */
    getImplementedOperationByName(bus, 'getPerson')!!.execute({name: 'other name'}, appContext, bus).then(result => console.log('=>', result))
})

/* ********************************************************************************************************************
 * Execution output
 */

/*
is getPerson { name: 'person name' }
pre interceptor  { name: 'person name' } { db: 'database url' }
quering the database
post interceptor [ { id: 10, name: 'person name with database url' } ]
result [ { id: 10, name: 'person name with database url' } ]
final [ { id: 10, name: 'person name with database url' } ]
 
is getPerson { name: 'other name' }
pre interceptor  { name: 'other name' } { db: 'database url' }
quering the database
post interceptor [ { id: 10, name: 'other name with database url' } ]
result [ { id: 10, name: 'other name with database url' } ]
=> [ { id: 10, name: 'other name with database url' } ]
*/