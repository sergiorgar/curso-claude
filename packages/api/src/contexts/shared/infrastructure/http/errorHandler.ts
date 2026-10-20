import type { Request, Response, NextFunction } from 'express'
import { AppError } from '@errors/AppError.js'

const NOT_FOUND_ERRORS = [
    'EmployeeNotFoundError',
    'RestaurantNotFoundError',
    'IngredientNotFoundError',
    'DishNotFoundError',
    'OrderNotFoundError',
    'OrderItemNotFoundError',
    'TableNotFoundError'
]

const CONFLICT_ERRORS = [
    'DuplicatedTableNumberError',
    'TableOccupiedError',
    'TableAlreadyOccupiedError'
]

const UNAUTHORIZED_ERRORS = [
    'InvalidCredentialsError',
    'MissingTokenError',
    'MalformedTokenError',
    'InvalidTokenError'
]

const FORBIDDEN_ERRORS = [
    'InsufficientPermissionsError'
]

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
        let statusCode = 400

        if (NOT_FOUND_ERRORS.includes(err.name)) {
            statusCode = 404
        } else if (UNAUTHORIZED_ERRORS.includes(err.name)) {
            statusCode = 401
        } else if (FORBIDDEN_ERRORS.includes(err.name)) {
            statusCode = 403
        } else if (CONFLICT_ERRORS.includes(err.name)) {
            statusCode = 409
        }

        res.status(statusCode).json({
            error: err.name,
            message: err.message
        })
        return
    }

    res.status(500).json({ error: 'InternalServerError', message: 'Ha ocurrido un error inesperado' })
}
