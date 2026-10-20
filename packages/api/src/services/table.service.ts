import { randomUUID } from 'crypto'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus, normalizeTableNumber, normalizeTableCapacity } from '@models/table.model.js'
import type { TableRepository } from '@repositories/table.repository.js'
import type { Order } from '@models/order.model.js'
import type { OrderRepository } from '@repositories/order.repository.js'
import type { RestaurantRepository } from '@repositories/restaurant.repository.js'
import {
    RestaurantNotFoundError,
    TableNotFoundError,
    DuplicatedTableNumberError,
    TableOccupiedError,
    TableAlreadyOccupiedError,
    InsufficientTableCapacityError,
    InvalidGuestsError
} from '@errors/DomainErrors.js'

export interface CreateTableInput {
    number: unknown
    description?: string | null
    capacity: unknown
    status?: string
}

export interface UpdateTableInput {
    number: unknown
    description?: string | null
    capacity: unknown
    status?: string
}

export interface TableWithOrders {
    table: Table
    orders: Order[]
}

export class TableService {
    constructor(
        private readonly tableRepository: TableRepository,
        private readonly restaurantRepository: RestaurantRepository,
        private readonly orderRepository: OrderRepository
    ) {}

    async create(restaurantId: string, input: CreateTableInput): Promise<Table> {
        await this.ensureRestaurantExists(restaurantId)

        const number = normalizeTableNumber(input.number)
        const capacity = normalizeTableCapacity(input.capacity)
        const status = normalizeTableStatus(input.status ?? 'libre')

        if (await this.tableRepository.existsNumber(restaurantId, number)) {
            throw new DuplicatedTableNumberError()
        }

        const now = new Date().toISOString()
        const table: Table = {
            id: randomUUID(),
            restaurantId,
            number,
            description: input.description ?? null,
            capacity,
            status,
            createdAt: now,
            updatedAt: now
        }

        await this.tableRepository.create(table)
        return table
    }

    async update(restaurantId: string, id: string, input: UpdateTableInput): Promise<Table> {
        const existing = await this.getById(restaurantId, id)

        const number = normalizeTableNumber(input.number)
        const capacity = normalizeTableCapacity(input.capacity)
        const status = input.status === undefined ? existing.status : normalizeTableStatus(input.status)

        if (await this.tableRepository.existsNumber(restaurantId, number, id)) {
            throw new DuplicatedTableNumberError()
        }

        const updated: Table = {
            ...existing,
            number,
            description: input.description ?? null,
            capacity,
            status,
            updatedAt: new Date().toISOString()
        }

        await this.tableRepository.update(updated)
        return updated
    }

    async delete(restaurantId: string, id: string): Promise<void> {
        const table = await this.getById(restaurantId, id)
        if (table.status === 'ocupada') {
            throw new TableOccupiedError()
        }
        await this.tableRepository.delete(id)
    }

    async getById(restaurantId: string, id: string): Promise<Table> {
        const table = await this.tableRepository.findById(id)
        if (!table || table.restaurantId !== restaurantId) {
            throw new TableNotFoundError()
        }
        return table
    }

    async list(restaurantId: string, status?: string): Promise<Table[]> {
        await this.ensureRestaurantExists(restaurantId)
        const normalizedStatus = status === undefined ? undefined : normalizeTableStatus(status)
        return this.tableRepository.findByRestaurant(restaurantId, normalizedStatus)
    }

    async changeStatus(restaurantId: string, id: string, status: string): Promise<Table> {
        const existing = await this.getById(restaurantId, id)
        const updated: Table = {
            ...existing,
            status: normalizeTableStatus(status),
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.update(updated)
        return updated
    }

    async listAvailable(restaurantId: string, people: unknown): Promise<Table[]> {
        const guests = this.normalizeGuests(people)
        await this.ensureRestaurantExists(restaurantId)
        return this.tableRepository.findAvailable(restaurantId, guests)
    }

    async occupy(restaurantId: string, id: string, people: unknown): Promise<Table> {
        const guests = this.normalizeGuests(people)
        const table = await this.getById(restaurantId, id)

        if (table.capacity < guests) {
            throw new InsufficientTableCapacityError()
        }
        if (!await this.tableRepository.occupyIfFree(id)) {
            throw new TableAlreadyOccupiedError()
        }

        return this.getById(restaurantId, id)
    }

    async listOccupiedWithOrders(restaurantId: string): Promise<TableWithOrders[]> {
        const tables = await this.list(restaurantId, 'ocupada')
        const result: TableWithOrders[] = []
        for (const table of tables) {
            result.push({ table, orders: await this.orderRepository.findActiveByTable(table.id) })
        }
        return result
    }

    private normalizeGuests(people: unknown): number {
        if (typeof people !== 'number' || !Number.isInteger(people) || people < 1) {
            throw new InvalidGuestsError()
        }
        return people
    }

    private async ensureRestaurantExists(restaurantId: string): Promise<void> {
        const restaurant = await this.restaurantRepository.findById(restaurantId)
        if (!restaurant) {
            throw new RestaurantNotFoundError()
        }
    }
}
