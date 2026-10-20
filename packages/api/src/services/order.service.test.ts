import { describe, it, expect, beforeEach } from 'vitest'
import { OrderService } from './order.service.js'
import { MockOrderRepository } from '@repositories/mocks/MockOrderRepository.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import type { Order } from '@models/order.model.js'
import { OrderNotFoundError, OrderItemNotFoundError, InvalidOrderStatusError, TableNotFoundError, TableNotOccupiedError } from '@errors/DomainErrors.js'

describe('OrderService.updateItemStatus', () => {
    let repo: MockOrderRepository
    let service: OrderService
    let testOrder: Order

    beforeEach(async () => {
        repo = new MockOrderRepository()
        service = new OrderService(repo, new MockTableRepository())

        testOrder = {
            id: 'order-1',
            restaurantId: 'rest-1',
            tableId: null,
            clientId: null,
            createdAt: new Date(),
            items: [
                { id: 'item-1', dishId: 'dish-1', quantity: 1, notes: null, status: 'pendiente' }
            ]
        }
        await repo.create(testOrder)
    })

    it('should update the status of an item successfully', async () => {
        await service.updateItemStatus('order-1', 'item-1', 'preparando')
        const updatedItem = testOrder.items[0]!
        expect(updatedItem.status).toBe('preparando')
    })

    it('should throw an error if the order does not exist', async () => {
        await expect(service.updateItemStatus('order-bad', 'item-1', 'preparando'))
            .rejects.toThrow(OrderNotFoundError)
    })

    it('should throw an error if the item does not exist inside the order', async () => {
        await expect(service.updateItemStatus('order-1', 'item-bad', 'preparando'))
            .rejects.toThrow(OrderItemNotFoundError)
    })

    it('should throw DomainError if status is invalid', async () => {
        await expect(service.updateItemStatus('order-1', 'item-1', 'invalid-status'))
            .rejects.toThrow(InvalidOrderStatusError)
    })
})

describe('OrderService.create with tableId', () => {
    let tableRepo: MockTableRepository
    let service: OrderService

    const buildTable = (id: string, restaurantId: string, status: 'libre' | 'ocupada' | 'reservada') => ({
        id, restaurantId, number: 1, description: null, capacity: 4, status,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    })

    const request = (tableId: string | null) => ({
        restaurantId: 'rest-1',
        tableId,
        clientId: 'client-1',
        items: [{ dishId: 'dish-1', quantity: 2, notes: null }]
    })

    beforeEach(async () => {
        tableRepo = new MockTableRepository()
        service = new OrderService(new MockOrderRepository(), tableRepo)
        await tableRepo.create(buildTable('t-occupied', 'rest-1', 'ocupada'))
        await tableRepo.create(buildTable('t-free', 'rest-1', 'libre'))
        await tableRepo.create(buildTable('t-other', 'rest-2', 'ocupada'))
    })

    it('should create an order linked to an occupied table of the restaurant', async () => {
        const order = await service.create(request('t-occupied'))
        expect(order.tableId).toBe('t-occupied')
        expect(order.items).toHaveLength(2)
    })

    it('should still create an order without tableId', async () => {
        const order = await service.create(request(null))
        expect(order.tableId).toBeNull()
    })

    it('should throw TableNotOccupiedError if the table is not occupied', async () => {
        await expect(service.create(request('t-free'))).rejects.toThrow(TableNotOccupiedError)
    })

    it('should throw TableNotFoundError if the table does not exist or belongs to another restaurant', async () => {
        await expect(service.create(request('missing'))).rejects.toThrow(TableNotFoundError)
        await expect(service.create(request('t-other'))).rejects.toThrow(TableNotFoundError)
    })
})
