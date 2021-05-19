import type { OperationType } from "./types"

export class PublicError extends Error {
    // @ts-ignore
    readonly cause: unknown

    constructor(message?: string, cause?: unknown) {
        if (cause instanceof Error && !message) {
            super(cause.message)
            this.stack = this.stack + '\nCaused By: ' + cause.stack
        } else if (arguments.length <= 1) {
            super(message)
        } else {
            super(message)
            if (cause instanceof Error) {
                this.stack = this.stack + '\nCaused By: ' + cause.stack
            } else {
                this.stack = this.stack + '\nCaused By: ' + cause
            }
        }

        Object.defineProperty(this, 'cause', {
            value: cause,
            writable: true,
            enumerable: false,
            configurable: true
        })
    }

    static isPublicError: (error: unknown) => boolean = (error) => {
        return error instanceof PublicError
    }
}

export class OperationExecutionError extends Error {
    // @ts-ignore
    readonly cause: unknown
    // @ts-ignore
    readonly simpleMessage: string
    // @ts-ignore
    readonly operationType: OperationType<unknown, unknown>
    // @ts-ignore
    readonly operation: unknown
    // @ts-ignore
    readonly context: unknown

    constructor(operation: unknown, context: unknown, operationType: OperationType<unknown, unknown>, message?: string, cause?: unknown) {
        super(OperationExecutionError.createErrorMessage(operation, context, operationType, message, cause))

        let simpleMessage: string
        if (cause instanceof Error && !message) {
            this.stack = this.stack + '\nCaused By: ' + cause.stack
            if (cause instanceof OperationExecutionError) {
                simpleMessage = cause.simpleMessage
            } else {
                simpleMessage = cause.message
            }
        } else if (arguments.length <= 4) {
            if (message) {
                simpleMessage = message + ''
            } else {
                simpleMessage = ''
            }
        } else {
            if (cause instanceof Error) {
                this.stack = this.stack + '\nCaused By: ' + cause.stack
            } else {
                this.stack = this.stack + '\nCaused By: ' + cause
            }
            if (message) {
                simpleMessage = message + ''
            } else if (cause) {
                simpleMessage = cause + ''
            } else {
                simpleMessage = ''
            }
        }

        Object.defineProperty(this, 'cause', {
            value: cause,
            writable: true,
            enumerable: false,
            configurable: true
        })

        Object.defineProperty(this, 'simpleMessage', {
            value: simpleMessage,
            writable: true,
            enumerable: false,
            configurable: true
        })

        Object.defineProperty(this, 'operationType', {
            value: operationType,
            writable: true,
            enumerable: false,
            configurable: true
        })

        Object.defineProperty(this, 'operation', {
            value: operation,
            writable: true,
            enumerable: false,
            configurable: true
        })

        Object.defineProperty(this, 'context', {
            value: context,
            writable: true,
            enumerable: false,
            configurable: true
        })
    }

    sameContent(operation: unknown, context: unknown, operationType: OperationType<unknown, unknown>): boolean {
        return this.operationType === operationType && this.operation === operation && this.context === context
    }

    static stringifyContext: (context: unknown,  operationType: OperationType<unknown, unknown>) => string = (operation, _operationType) => {
        return JSON.stringify(operation)
    }
    static stringifyOperation: (operation: unknown, operationType: OperationType<unknown, unknown>) => string = (operation, _operationType) => {
        return JSON.stringify(operation)
    }
    static createErrorMessage = _createOperationExecutionErrorMessage
}

function _createOperationExecutionErrorMessage(operation: unknown, context: unknown, operationType: OperationType<unknown, unknown>, message?: string, cause?: unknown) {
    let result = ''
    if (!message) {
        result += 'An error happens executing the operation ' + operationType.name

        if (cause) {
            result += ': '
            if (cause instanceof OperationExecutionError) {
                result += cause.simpleMessage
            } else if (cause instanceof Error) {
                result += cause.message
            } else {
                result += cause
            }
        }

    } else {
        result = message
    }
    result += '\nOperation type: ' + operationType.name
    result += '\nOperation: ' + OperationExecutionError.stringifyOperation(operation, operationType)
    result += '\nContext: ' + OperationExecutionError.stringifyContext(context, operationType)

    if (cause) {
        if (cause instanceof Error) {
            result += '\n\nCaused by: ' + cause.message
        } else {
            result += '\n\nCaused by: ' + cause
        }
    }
    return result
}
