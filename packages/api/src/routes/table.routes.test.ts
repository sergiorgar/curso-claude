import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import { dbConfig } from '@config/database.js'

const token = (role: string) => `Bearer ${jwt.sign({ id: `${role}-id`, role }, process.env.JWT_SECRET || 'super-secret-resttek-key')}`

const R = '/api/v1/restaurants/rest-1/tables'
const PUBLIC = '/api/v1/public/restaurants/rest-1/tables'

describe('table routes', () => {
    beforeAll(async () => {
        await dbConfig.initialize()
        const now = new Date().toISOString()
        await dbConfig.run(
            'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['rest-1', 'La Trattoria', 'Calle Mayor 10', 'info@trattoria.com', '+34 612345678', 'Carlos', 'García', now, now]
        )
    })

    afterAll(async () => {
        await dbConfig.close()
    })

    const createTable = async (number: number, capacity = 4, status?: string) => {
        const res = await request(app).post(R).set('Authorization', token('admin')).send({ number, capacity, description: `Mesa ${number}`, status })
        expect(res.status).toBe(201)
        return res.body
    }

    describe('permissions', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).post(R).send({ number: 1, capacity: 4 })
            expect(res.status).toBe(401)
            expect(res.body.error).toBe('MissingTokenError')
        })

        it('should return 403 for camarero creating and cocinero changing status', async () => {
            const forbiddenCreate = await request(app).post(R).set('Authorization', token('camarero')).send({ number: 90, capacity: 4 })
            expect(forbiddenCreate.status).toBe(403)

            const table = await createTable(91)
            const forbiddenStatus = await request(app).patch(`${R}/${table.id}/status`).set('Authorization', token('cocinero')).send({ status: 'ocupada' })
            expect(forbiddenStatus.status).toBe(403)
        })

        it('should let camarero and cocinero read, and camarero change the status', async () => {
            const table = await createTable(92)

            expect((await request(app).get(R).set('Authorization', token('cocinero'))).status).toBe(200)
            const changed = await request(app).patch(`${R}/${table.id}/status`).set('Authorization', token('camarero')).send({ status: 'reservada' })
            expect(changed.status).toBe(200)
            expect(changed.body.status).toBe('reservada')
        })
    })

    describe('CRUD', () => {
        it('should create with default status libre and a Spanish duplicate error', async () => {
            const table = await createTable(10)
            expect(table).toMatchObject({ restaurantId: 'rest-1', number: 10, capacity: 4, status: 'libre' })

            const duplicated = await request(app).post(R).set('Authorization', token('manager')).send({ number: 10, capacity: 2 })
            expect(duplicated.status).toBe(409)
            expect(duplicated.body).toEqual({ error: 'DuplicatedTableNumberError', message: 'Ya existe una mesa con ese número en el restaurante' })
        })

        it('should return 400 for invalid data', async () => {
            const res = await request(app).post(R).set('Authorization', token('admin')).send({ number: 'x', capacity: 4 })
            expect(res.status).toBe(400)
            expect(res.body.error).toBe('InvalidTableNumberError')
        })

        it('should list filtering by status and return 400 for an invalid one', async () => {
            await createTable(11, 4, 'ocupada')
            const occupied = await request(app).get(`${R}?status=ocupada`).set('Authorization', token('admin'))
            expect(occupied.status).toBe(200)
            expect(occupied.body.every((t: { status: string }) => t.status === 'ocupada')).toBe(true)

            const invalid = await request(app).get(`${R}?status=rota`).set('Authorization', token('admin'))
            expect(invalid.status).toBe(400)
            expect(invalid.body.error).toBe('InvalidTableStatusError')
        })

        it('should get, update and delete a table', async () => {
            const table = await createTable(12)

            expect((await request(app).get(`${R}/${table.id}`).set('Authorization', token('admin'))).body.id).toBe(table.id)

            const updated = await request(app).put(`${R}/${table.id}`).set('Authorization', token('admin')).send({ number: 12, capacity: 8, description: null })
            expect(updated.status).toBe(200)
            expect(updated.body).toMatchObject({ capacity: 8, description: null })

            expect((await request(app).delete(`${R}/${table.id}`).set('Authorization', token('admin'))).status).toBe(204)
            const gone = await request(app).get(`${R}/${table.id}`).set('Authorization', token('admin'))
            expect(gone.status).toBe(404)
            expect(gone.body.error).toBe('TableNotFoundError')
        })

        it('should return 409 when deleting an occupied table', async () => {
            const table = await createTable(13, 4, 'ocupada')
            const res = await request(app).delete(`${R}/${table.id}`).set('Authorization', token('admin'))
            expect(res.status).toBe(409)
            expect(res.body.error).toBe('TableOccupiedError')
        })

        it('should return 404 for an unknown restaurant', async () => {
            const res = await request(app).get('/api/v1/restaurants/nope/tables').set('Authorization', token('admin'))
            expect(res.status).toBe(404)
            expect(res.body.error).toBe('RestaurantNotFoundError')
        })
    })

    describe('public availability and occupation', () => {
        it('should list available tables with enough capacity ordered by capacity', async () => {
            await createTable(20, 6)
            await createTable(21, 2)
            await createTable(22, 4)

            const res = await request(app).get(`${PUBLIC}/available?people=3`)

            expect(res.status).toBe(200)
            const numbers = res.body.map((t: { number: number }) => t.number)
            expect(numbers.indexOf(22)).toBeLessThan(numbers.indexOf(20))
            expect(numbers).not.toContain(21)
        })

        it('should return 400 InvalidGuestsError for a missing or invalid people', async () => {
            for (const query of ['', '?people=0', '?people=abc', '?people=1.5']) {
                const res = await request(app).get(`${PUBLIC}/available${query}`)
                expect(res.status).toBe(400)
                expect(res.body.error).toBe('InvalidGuestsError')
            }
        })

        it('should occupy a table once and return 409 the second time', async () => {
            const table = await createTable(30, 4)

            const first = await request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 2 })
            expect(first.status).toBe(200)
            expect(first.body.status).toBe('ocupada')

            const second = await request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 2 })
            expect(second.status).toBe(409)
            expect(second.body).toEqual({ error: 'TableAlreadyOccupiedError', message: 'La mesa ya está ocupada' })
        })

        it('should let only one of two concurrent requests occupy the table', async () => {
            const table = await createTable(31, 4)
            const results = await Promise.all([
                request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 2 }),
                request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 2 })
            ])
            expect(results.map(r => r.status).sort()).toEqual([200, 409])
        })

        it('should return 400 for insufficient capacity and 404 for an unknown table', async () => {
            const table = await createTable(32, 2)

            const capacity = await request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 5 })
            expect(capacity.status).toBe(400)
            expect(capacity.body.error).toBe('InsufficientTableCapacityError')

            const missing = await request(app).post(`${PUBLIC}/missing/occupy`).send({ people: 2 })
            expect(missing.status).toBe(404)
        })
    })

    describe('orders by table', () => {
        it('should link an order to an occupied table and list it in /tables/orders', async () => {
            const table = await createTable(40, 4)

            const notOccupied = await request(app).post('/api/v1/orders').set('Authorization', token('cliente'))
                .send({ restaurantId: 'rest-1', tableId: table.id, items: [] })
            expect(notOccupied.status).toBe(400)
            expect(notOccupied.body.error).toBe('TableNotOccupiedError')

            await request(app).post(`${PUBLIC}/${table.id}/occupy`).send({ people: 2 })
            await dbConfig.run(
                "INSERT INTO dishes (id, name, description, price, category, available, restaurant_id, created_at, updated_at) VALUES ('dish-x', 'Pizza', null, 10, 'principal', 1, 'rest-1', 'now', 'now')"
            ).catch(() => undefined)
            const created = await request(app).post('/api/v1/orders').set('Authorization', token('cliente'))
                .send({ restaurantId: 'rest-1', tableId: table.id, items: [{ dishId: 'dish-x', quantity: 1, notes: null }] })
            expect(created.status).toBe(201)
            expect(created.body.tableNumber).toBe(40)

            const res = await request(app).get(`${R}/orders`).set('Authorization', token('cocinero'))
            expect(res.status).toBe(200)
            const entry = res.body.find((e: { table: { id: string } }) => e.table.id === table.id)
            expect(entry.orders).toHaveLength(1)
            expect(entry.orders[0].items[0].status).toBe('pendiente')
            expect(entry.orders[0].tableNumber).toBe(40)

            expect((await request(app).get(`${R}/orders`).set('Authorization', token('cliente'))).status).toBe(403)
        })
    })
})
