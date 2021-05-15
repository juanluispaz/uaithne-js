import { combineExecutors, Executor, interceptAnyOperation, OperationType } from "../src";

interface​ Calendar { 
    id: number;
​    title: string;
    description?: string;
}

interface Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    calendarId: number;
}

interface SelectMomentEvents {
    ​calendarId: number;
    moment: Date;
}
const selectMomentEvents = new OperationType<SelectMomentEvents, Event[]>('selectMomentEvents');

interface SelectEventById {
    id: number
}
const selectEventById = new OperationType<SelectEventById, Event | null>('selectEventById');



interface Context {
    userId: number;
    realUserId: number;
    roles: string[];
    userName: string;
    language: string;
​    xsrfToken: string;
​    databaseConnection: Connection;
}

function createEventModule(/* any required params*/) {
    
    const selectMomentEventsExecutor = selectMomentEvents.implementAs<Context>(async (_operation, _context, _operationType) => {
        // ...
        return [] as Event[]
    });

    const selectEventByIdExecutor = selectEventById.implementAs<Context>(async (_operation, _context, _operationType) => {
        // ...
        return null
    });

    return combineExecutors(selectMomentEventsExecutor, selectEventByIdExecutor);
}

const eventsDatabaseExecutor = createEventModule();
const bussinessLayer = eventsDatabaseExecutor

const executorForAllOperations = interceptAnyOperation(bussinessLayer, async (operation, context, operationType, next) => {
    // Logic to be executed before the execution of the operation
    const result = await operationType.execute(operation, context, next);
    // Logic to be executed after the execution of the operation
    return result
});

const executor = executorForAllOperations

const op: SelectMomentEvents = { /*...*/ } as any
const context: Context = { userId: 10 } as any

const result: Promise<Event[]> = selectMomentEvents.execute(op, context, executor);

function createInterceptEventsModule(next: Executor<Context>) {

    const selectMomentEventsExecutor = selectMomentEvents.implementAs<Context>(async (operation, context, operationType) => {
        ​// Logic to be executed before the execution of the operation ​
        const result = await operationType.execute(operation, context, next);
        // Logic to be executed after the execution of the operation
        return result
    });

    // ...

    return combineExecutors(selectMomentEventsExecutor /*...*/ );
}

// Hide warnings

createInterceptEventsModule(executor) as any as Calendar
result.finally(() => {
})

type Connection = undefined