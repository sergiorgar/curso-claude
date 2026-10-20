import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import { MockRestaurantRepository } from '@repositories/mocks/MockRestaurantRepository.js'
import {
    RestaurantNotFoundError,
    TableNotFoundError,
    DuplicatedTableNumberError,
    TableOccupiedError,
    InvalidTableNumberError,
    InvalidTableCapacityError,
    InvalidTableStatusError
} from '@errors/DomainErrors.js'

describe('TableService (CRUD)', () => {
    let tableRepo: MockTableRepository
    let service: TableService

    beforeEach(async () => {
        tableRepo = new MockTableRepository()
        const restaurantRepo = new MockRestaurantRepository()
        const now = new Date().toISOString()
        for (const id of ['r1', 'r2']) {
            await restaurantRepo.save({
                id, name: 'La Trattoria', address: 'Calle Mayor 10', email: 'info@trattoria.com', phone: '+34 612345678',
                ownerFirstName: 'Carlos', ownerLastName: 'García', logoUrl: null, createdAt: now, updatedAt: now
            })
        }
        service = new TableService(tableRepo, restaurantRepo)
    })

    describe('create', () => {
        it('should create a free table by default', async () => {
            const table = await service.create('r1', { number: 1, description: 'Terraza', capacity: 4 })

            expect(table).toMatchObject({ restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre' })
            expect(await tableRepo.findById(table.id)).not.toBeNull()
        })

        it('should accept an explicit status and a null description', async () => {
            const table = await service.create('r1', { number: 2, capacity: 2, status: 'reservada' })
            expect(table.status).toBe('reservada')
            expect(table.description).toBeNull()
        })

        it('should reject a duplicated number in the same restaurant but allow it in another', async () => {
            await service.create('r1', { number: 1, capacity: 4 })

            await expect(service.create('r1', { number: 1, capacity: 2 })).rejects.toThrow(DuplicatedTableNumberError)
            await expect(service.create('r2', { number: 1, capacity: 2 })).resolves.toBeDefined()
        })

        it('should validate number, capacity and status', async () => {
            await expect(service.create('r1', { number: 0, capacity: 4 })).rejects.toThrow(InvalidTableNumberError)
            await expect(service.create('r1', { number: 1, capacity: 0 })).rejects.toThrow(InvalidTableCapacityError)
            await expect(service.create('r1', { number: 1, capacity: 4, status: 'rota' })).rejects.toThrow(InvalidTableStatusError)
        })

        it('should throw RestaurantNotFoundError if the restaurant does not exist', async () => {
            await expect(service.create('nope', { number: 1, capacity: 4 })).rejects.toThrow(RestaurantNotFoundError)
        })
    })

    describe('update', () => {
        it('should replace number, description and capacity keeping the status when omitted', async () => {
            const created = await service.create('r1', { number: 1, capacity: 4, status: 'reservada' })

            const updated = await service.update('r1', created.id, { number: 5, description: 'Barra', capacity: 2 })

            expect(updated).toMatchObject({ number: 5, description: 'Barra', capacity: 2, status: 'reservada' })
        })

        it('should change the status when provided', async () => {
            const created = await service.create('r1', { number: 1, capacity: 4 })
            const updated = await service.update('r1', created.id, { number: 1, capacity: 4, status: 'ocupada' })
            expect(updated.status).toBe('ocupada')
        })

        it('should allow keeping its own number but reject another table number', async () => {
            const a = await service.create('r1', { number: 1, capacity: 4 })
            await service.create('r1', { number: 2, capacity: 4 })

            await expect(service.update('r1', a.id, { number: 1, capacity: 6 })).resolves.toBeDefined()
            await expect(service.update('r1', a.id, { number: 2, capacity: 6 })).rejects.toThrow(DuplicatedTableNumberError)
        })

        it('should throw TableNotFoundError for a missing table or one from another restaurant', async () => {
            const a = await service.create('r1', { number: 1, capacity: 4 })

            await expect(service.update('r1', 'missing', { number: 1, capacity: 4 })).rejects.toThrow(TableNotFoundError)
            await expect(service.update('r2', a.id, { number: 1, capacity: 4 })).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('delete', () => {
        it('should delete a free or reserved table', async () => {
            const free = await service.create('r1', { number: 1, capacity: 4 })
            const reserved = await service.create('r1', { number: 2, capacity: 4, status: 'reservada' })

            await service.delete('r1', free.id)
            await service.delete('r1', reserved.id)

            expect(await tableRepo.findById(free.id)).toBeNull()
            expect(await tableRepo.findById(reserved.id)).toBeNull()
        })

        it('should throw TableOccupiedError for an occupied table', async () => {
            const table = await service.create('r1', { number: 1, capacity: 4, status: 'ocupada' })
            await expect(service.delete('r1', table.id)).rejects.toThrow(TableOccupiedError)
            expect(await tableRepo.findById(table.id)).not.toBeNull()
        })

        it('should throw TableNotFoundError for a missing table', async () => {
            await expect(service.delete('r1', 'missing')).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('getById and list', () => {
        it('should get a table of the restaurant and throw TableNotFoundError otherwise', async () => {
            const table = await service.create('r1', { number: 1, capacity: 4 })

            expect((await service.getById('r1', table.id)).id).toBe(table.id)
            await expect(service.getById('r2', table.id)).rejects.toThrow(TableNotFoundError)
        })

        it('should list tables ordered by number and filter by status', async () => {
            await service.create('r1', { number: 2, capacity: 4, status: 'ocupada' })
            await service.create('r1', { number: 1, capacity: 4 })

            expect((await service.list('r1')).map(t => t.number)).toEqual([1, 2])
            expect((await service.list('r1', 'ocupada')).map(t => t.number)).toEqual([2])
        })

        it('should reject an invalid status filter and an unknown restaurant', async () => {
            await expect(service.list('r1', 'rota')).rejects.toThrow(InvalidTableStatusError)
            await expect(service.list('nope')).rejects.toThrow(RestaurantNotFoundError)
        })
    })
})
