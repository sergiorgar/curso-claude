import { SqliteTableRepository } from './table.repository.js'
import type { Table } from '@models/table.model.js'
import { Database } from '@config/database.js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const buildTable = (overrides: Partial<Table>): Table => ({
    id: 't1',
    restaurantId: 'r1',
    number: 1,
    description: null,
    capacity: 4,
    status: 'libre',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
})

describe('SqliteTableRepository (Integration)', () => {
    let db: Database
    let repo: SqliteTableRepository

    beforeAll(async () => {
        process.env.NODE_ENV = 'test'
        db = new Database()
        await db.initialize()
        repo = new SqliteTableRepository(db)

        for (const id of ['r1', 'r2']) {
            await db.run(
                'INSERT INTO restaurants (id, name, address, email, phone, owner_first_name, owner_last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, 'La Trattoria', 'Calle Mayor 10', 'info@trattoria.com', '+34 612345678', 'Carlos', 'García', new Date().toISOString(), new Date().toISOString()]
            )
        }
    })

    afterAll(async () => {
        await db.close()
    })

    it('should create and find a table by id', async () => {
        await repo.create(buildTable({ id: 't1', number: 1, description: 'Terraza' }))

        const found = await repo.findById('t1')
        expect(found).toMatchObject({ id: 't1', restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre' })
        expect(await repo.findById('missing')).toBeNull()
    })

    it('should list by restaurant ordered by number and filter by status', async () => {
        await repo.create(buildTable({ id: 't3', number: 3, capacity: 6, status: 'ocupada' }))
        await repo.create(buildTable({ id: 't2', number: 2, capacity: 2 }))
        await repo.create(buildTable({ id: 'x1', restaurantId: 'r2', number: 1 }))

        const all = await repo.findByRestaurant('r1')
        expect(all.map(t => t.number)).toEqual([1, 2, 3])

        const occupied = await repo.findByRestaurant('r1', 'ocupada')
        expect(occupied.map(t => t.id)).toEqual(['t3'])
    })

    it('should update number, description, capacity and status', async () => {
        const table = (await repo.findById('t2'))!
        await repo.update({ ...table, number: 20, description: 'Barra', capacity: 3, status: 'reservada' })

        expect(await repo.findById('t2')).toMatchObject({ number: 20, description: 'Barra', capacity: 3, status: 'reservada' })
    })

    it('should delete a table', async () => {
        await repo.create(buildTable({ id: 'del', number: 99 }))
        await repo.delete('del')
        expect(await repo.findById('del')).toBeNull()
    })

    it('should detect an existing number per restaurant, optionally excluding an id', async () => {
        expect(await repo.existsNumber('r1', 1)).toBe(true)
        expect(await repo.existsNumber('r1', 1, 't1')).toBe(false)
        expect(await repo.existsNumber('r2', 3)).toBe(false)
    })

    it('should find only free tables with enough capacity ordered by capacity and number', async () => {
        await repo.create(buildTable({ id: 'a1', restaurantId: 'r2', number: 10, capacity: 6 }))
        await repo.create(buildTable({ id: 'a2', restaurantId: 'r2', number: 11, capacity: 4 }))
        await repo.create(buildTable({ id: 'a3', restaurantId: 'r2', number: 12, capacity: 4 }))
        await repo.create(buildTable({ id: 'a4', restaurantId: 'r2', number: 13, capacity: 8, status: 'ocupada' }))
        await repo.create(buildTable({ id: 'a5', restaurantId: 'r2', number: 14, capacity: 2 }))

        const available = await repo.findAvailable('r2', 3)
        expect(available.map(t => t.id)).toEqual(['x1', 'a2', 'a3', 'a1'])
    })

    it('should occupy a free table only once', async () => {
        await repo.create(buildTable({ id: 'o1', number: 50 }))

        expect(await repo.occupyIfFree('o1')).toBe(true)
        expect(await repo.occupyIfFree('o1')).toBe(false)
        expect((await repo.findById('o1'))?.status).toBe('ocupada')
    })
})
