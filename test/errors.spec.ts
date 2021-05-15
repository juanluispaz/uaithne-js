
import { OperationType, OperationExecutionError, PublicError, combineExecutors, interceptAnyOperation } from "../src"
import { AppContext, context, executor, getOtherPersons, GetPersons, getPersons, getPersonsNotImplemented, operation, otherExecutor, Person } from "./shared"

test('duplicate operation', () => {
    expect(() => {
        return new OperationType<GetPersons, Person[]>('getPersons')
    }).toThrow('Another operation with name "getPersons" already exists')
})

test('not implemented', () => {
    try {
        return getOtherPersons.execute(operation, context, executor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('No handler found for the operation: getOtherPersons')
        expect(e.message).toEqual('No handler found for the operation: getOtherPersons\nOperation type: getOtherPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getOtherPersons)
        expect(e.cause).toBe(undefined)
    }

    return undefined
})

test('executor throwing an error', () => {
    const error = new Error('My Error')
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('executor throwing a public error', () => {
    const error = new PublicError('My Error')
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof PublicError)) {
            fail('it is not an PublicError')
        }

        expect(e.message).toEqual('My Error')
        expect(e.cause).toBe(undefined)
        expect(e).toBe(error)
    }

    return undefined
})

test('executor throwing a public error witn a cause error', () => {
    const causeError = new Error('Cause Error')
    const error = new PublicError('My Error', causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof PublicError)) {
            fail('it is not an PublicError')
        }

        expect(e.message).toEqual('My Error')
        expect(e.cause).toBe(causeError)
        expect(e).toBe(error)
    }

    return undefined
})

test('executor throwing a public error witn a cause error (no message)', () => {
    const causeError = new Error('Cause Error')
    const error = new PublicError(undefined, causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof PublicError)) {
            fail('it is not an PublicError')
        }

        expect(e.message).toEqual('Cause Error')
        expect(e.cause).toBe(causeError)
        expect(e).toBe(error)
    }

    return undefined
})

test('executor throwing a public error witn a cause message', () => {
    const causeMessage = 'Cause Message'
    const error = new PublicError('My Error', causeMessage)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof PublicError)) {
            fail('it is not an PublicError')
        }

        expect(e.message).toEqual('My Error')
        expect(e.cause).toBe(causeMessage)
        expect(e).toBe(error)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (different operation type)', () => {
    const error = new OperationExecutionError(operation, context, getOtherPersons, 'My Error')
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error\nOperation type: getOtherPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (different operation)', () => {
    const error = new OperationExecutionError({operation: 'operation'}, context, getPersons, 'My Error')
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error\nOperation type: getPersons\nOperation: {"operation":"operation"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (different context)', () => {
    const error = new OperationExecutionError(operation, {context: 'context'}, getPersons, 'My Error')
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"context":"context"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('executor throwing an OperationExecutionError with a cause error', () => {
    const causeError = new Error('Cause Error')
    const error = new OperationExecutionError(operation, context, getPersons, 'My Error', causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: Cause Error')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(causeError)
    }

    return undefined
})

test('executor throwing an OperationExecutionError with a cause error (no message)', () => {
    const causeError = new Error('Cause Error')
    const error = new OperationExecutionError(operation, context, getPersons, undefined, causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('Cause Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: Cause Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: Cause Error')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(causeError)
    }

    return undefined
})

test('executor throwing an OperationExecutionError with a cause message', () => {
    const causeError = 'Cause Message'
    const error = new OperationExecutionError(operation, context, getPersons, 'My Error', causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: Cause Message')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(causeError)
    }

    return undefined
})

test('executor throwing an OperationExecutionError with a cause message (no meesage)', () => {
    const causeError = 'Cause Message'
    const error = new OperationExecutionError(operation, context, getPersons, undefined, causeError)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('Cause Message')
        expect(e.message).toEqual('An error happens executing the operation getPersons: Cause Message\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: Cause Message')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(causeError)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (no cause, no meesage)', () => {
    const error = new OperationExecutionError(operation, context, getPersons)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('')
        expect(e.message).toEqual('An error happens executing the operation getPersons\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(undefined)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (no cause, no meesage) 2', () => {
    const error = new OperationExecutionError(operation, context, getPersons, undefined, undefined)
    const executorWithError = getPersons.implementAs<AppContext>((op, ctx, type) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, executorWithError).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('')
        expect(e.message).toEqual('An error happens executing the operation getPersons\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(undefined)
    }

    return undefined
})

test('combined executor not implemented', () => {
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    try {
        return getPersonsNotImplemented.execute(operation, context, combinedExecutor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('No handler found for the operation: getPersonsNotImplemented')
        expect(e.message).toEqual('No handler found for the operation: getPersonsNotImplemented\nOperation type: getPersonsNotImplemented\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersonsNotImplemented)
        expect(e.cause).toBe(undefined)
    }

    return undefined
})

test('interceptor throwing an error', () => {
    const error = new Error('My Error')
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const interceptedExecutor = interceptAnyOperation(combinedExecutor, (op, ctx, type, _next) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, interceptedExecutor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('interceptor throwing a public error', () => {
    const error = new PublicError('My Error')
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const interceptedExecutor = interceptAnyOperation(combinedExecutor, (op, ctx, type, _next) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, interceptedExecutor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof PublicError)) {
            fail('it is not an PublicError')
        }

        expect(e.message).toEqual('My Error')
        expect(e.cause).toBe(undefined)
        expect(e).toBe(error)
    }

    return undefined
})

test('executor throwing an OperationExecutionError (same operations)', () => {
    const error = new OperationExecutionError(operation, context, getPersons, 'My Error')
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const interceptedExecutor = interceptAnyOperation(combinedExecutor, (op, ctx, type, _next) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, interceptedExecutor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(undefined)
    }

    return undefined
})

test('interceptor throwing an OperationExecutionError (different operation type)', () => {
    const error = new OperationExecutionError(operation, context, getOtherPersons, 'My Error')
    const combinedExecutor = combineExecutors(executor, otherExecutor)
    const interceptedExecutor = interceptAnyOperation(combinedExecutor, (op, ctx, type, _next) => {
        expect(op).toBe(operation)
        expect(ctx).toBe(context)
        expect(type).toBe(getPersons)
        throw error
    })

    try {
        return getPersons.execute(operation, context, interceptedExecutor).then(_result => {
            fail('it must not be executed')
        })
    } catch(e: unknown) {
        if (!(e instanceof OperationExecutionError)) {
            fail('it is not an OperationExecutionError')
        }

        expect(e.simpleMessage).toEqual('My Error')
        expect(e.message).toEqual('An error happens executing the operation getPersons: My Error\nOperation type: getPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}\n\nCaused by: My Error\nOperation type: getOtherPersons\nOperation: {"name":"person name"}\nContext: {"db":"database url"}')
        expect(e.operation).toBe(operation)
        expect(e.context).toBe(context)
        expect(e.operationType).toBe(getPersons)
        expect(e.cause).toBe(error)
    }

    return undefined
})

test('change OperationExecutionError stringify method', () => {
    const old = OperationExecutionError.stringify
    OperationExecutionError.stringify = (_value) => {
        return '###'
    }
    const error = new OperationExecutionError(operation, context, getOtherPersons, 'My Error')
    OperationExecutionError.stringify = old
    expect(error.message).toEqual('My Error\nOperation type: getOtherPersons\nOperation: ###\nContext: ###')
})

test('change OperationExecutionError createErrorMessage method', () => {
    const old = OperationExecutionError.createErrorMessage
    OperationExecutionError.createErrorMessage = (_operation, _context, _operationType, _message, _cause) => {
        return '%%%'
    }
    const error = new OperationExecutionError(operation, context, getOtherPersons, 'My Error')
    OperationExecutionError.createErrorMessage = old
    expect(error.message).toEqual('%%%')
})