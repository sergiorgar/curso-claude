import { SqliteOrderRepository } from './order.repository.js'
import { Database } from '@config/database.js'
import type { Order } from '@models/order.model.js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('SqliteOrderRepository (Integration)', () => {
    let db: Database
    let repo: SqliteOrderRepository

    const buildOrder = (id: string, tableId: string | null): Order => ({
        id,
        restaurantId: 'r1',
        tableId,
        clientId: null,
        createdAt: new Date(),
        items: [{ id: `${id}-item`, dishId: 'd1', quantity: 1, notes: null, status: 'pendiente' }]
    })

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        repo = new SqliteOrderRepository(db)
        const now = new Date().toISOString()

        await db.run(
            'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['r1', 'La Trattoria', 'Calle Mayor 10', 'info@trattoria.com', '+34 612345678', 'Carlos', 'García', now, now]
        )
        await db.run(
            'INSERT INTO dishes (id, name, description, price, category, available, restaurant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['d1', 'Pizza', null, 10, 'principal', 1, 'r1', now, now]
        )
        await db.run(
            'INSERT INTO tables (id, restaurant_id, number, description, capacity, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['t1', 'r1', 7, null, 4, 'ocupada', now, now]
        )
    })

    afterAll(async () => {
        await db.close()
    })

    it('should return tableNumber in findById, findActiveByRestaurant and findByClientId', async () => {
        await repo.create({ ...buildOrder('o1', 't1'), clientId: 'c1' })

        expect((await repo.findById('o1'))?.tableNumber).toBe(7)
        expect((await repo.findActiveByRestaurant('r1'))[0]?.tableNumber).toBe(7)
        expect((await repo.findByClientId('c1'))[0]?.tableNumber).toBe(7)
    })

    it('should return null tableNumber for orders without a table or with an orphan tableId', async () => {
        await repo.create(buildOrder('o2', null))
        await repo.create(buildOrder('o3', '5'))

        expect((await repo.findById('o2'))?.tableNumber).toBeNull()
        expect((await repo.findById('o3'))?.tableNumber).toBeNull()
    })
})
