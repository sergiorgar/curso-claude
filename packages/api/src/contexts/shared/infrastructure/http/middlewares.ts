import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import {
    MissingTokenError,
    MalformedTokenError,
    InvalidTokenError,
    InsufficientPermissionsError
} from '@errors/DomainErrors.js'

const JWT_SECRET: string = process.env.JWT_SECRET || 'super-secret-resttek-key'

export interface AuthRequest extends Request {
    user?: any
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(new MissingTokenError())
        return
    }

    const tokenParts = authHeader.split(' ')
    const token = tokenParts[1]

    if (!token) {
        next(new MalformedTokenError())
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
    } catch {
        next(new InvalidTokenError())
    }
}

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            next(new InsufficientPermissionsError())
            return
        }
        next()
    }
}
