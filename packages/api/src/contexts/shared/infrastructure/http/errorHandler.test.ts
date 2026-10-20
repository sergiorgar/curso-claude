import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { authenticate, authorize } from './middlewares.js'
import { errorHandler } from './errorHandler.js'
import { OrderNotFoundError, OrderItemNotFoundError, InvalidOrderStatusError, TableNotFoundError, DuplicatedTableNumberError, TableOccupiedError, TableAlreadyOccupiedError } from '@errors/DomainErrors.js'

const buildApp = () => {
    const app = express()
    app.get('/protected', authenticate, authorize(['admin']), (_req, res) => { res.json({ ok: true }) })
    app.get('/order-not-found', (_req, _res, next) => next(new OrderNotFoundError()))
    app.get('/item-not-found', (_req, _res, next) => next(new OrderItemNotFoundError()))
    app.get('/invalid-status', (_req, _res, next) => next(new InvalidOrderStatusError()))
    app.get('/table-not-found', (_req, _res, next) => next(new TableNotFoundError()))
    app.get('/duplicated-table', (_req, _res, next) => next(new DuplicatedTableNumberError()))
    app.get('/table-occupied', (_req, _res, next) => next(new TableOccupiedError()))
    app.get('/table-already-occupied', (_req, _res, next) => next(new TableAlreadyOccupiedError()))
    app.use(errorHandler)
    return app
}

describe('errorHandler', () => {
    it('should return 401 with { error, message } when no token is provided', async () => {
        const res = await request(buildApp()).get('/protected')
        expect(res.status).toBe(401)
        expect(res.body).toEqual({ error: 'MissingTokenError', message: expect.any(String) })
    })

    it('should return 401 when the token is invalid', async () => {
        const res = await request(buildApp()).get('/protected').set('Authorization', 'Bearer bad')
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('InvalidTokenError')
    })

    it('should return 404 for order and order item not found', async () => {
        const app = buildApp()
        expect((await request(app).get('/order-not-found')).status).toBe(404)
        expect((await request(app).get('/item-not-found')).status).toBe(404)
    })

    it('should return 400 for an invalid order status', async () => {
        expect((await request(buildApp()).get('/invalid-status')).status).toBe(400)
    })

    it('should return 404 for table not found', async () => {
        const res = await request(buildApp()).get('/table-not-found')
        expect(res.status).toBe(404)
        expect(res.body).toEqual({ error: 'TableNotFoundError', message: 'Mesa no encontrada' })
    })

    it('should return 409 for table conflicts', async () => {
        const app = buildApp()
        expect((await request(app).get('/duplicated-table')).status).toBe(409)
        expect((await request(app).get('/table-occupied')).status).toBe(409)
        expect((await request(app).get('/table-already-occupied')).status).toBe(409)
    })
})
