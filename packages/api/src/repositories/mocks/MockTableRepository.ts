import type { TableRepository } from '@repositories/table.repository.js'
import type { Table, TableStatus } from '@models/table.model.js'

export class MockTableRepository implements TableRepository {
    private tables: Map<string, Table> = new Map()

    async create(table: Table): Promise<void> {
        this.tables.set(table.id, { ...table })
    }

    async findById(id: string): Promise<Table | null> {
        const table = this.tables.get(id)
        return table ? { ...table } : null
    }

    async findByRestaurant(restaurantId: string, status?: TableStatus): Promise<Table[]> {
        return Array.from(this.tables.values())
            .filter(t => t.restaurantId === restaurantId && (!status || t.status === status))
            .sort((a, b) => a.number - b.number)
            .map(t => ({ ...t }))
    }

    async update(table: Table): Promise<void> {
        this.tables.set(table.id, { ...table })
    }

    async delete(id: string): Promise<void> {
        this.tables.delete(id)
    }

    async existsNumber(restaurantId: string, number: number, excludeId?: string): Promise<boolean> {
        return Array.from(this.tables.values())
            .some(t => t.restaurantId === restaurantId && t.number === number && t.id !== excludeId)
    }

    async findAvailable(restaurantId: string, people: number): Promise<Table[]> {
        return Array.from(this.tables.values())
            .filter(t => t.restaurantId === restaurantId && t.status === 'libre' && t.capacity >= people)
            .sort((a, b) => a.capacity - b.capacity || a.number - b.number)
            .map(t => ({ ...t }))
    }

    async occupyIfFree(id: string): Promise<boolean> {
        const table = this.tables.get(id)
        if (!table || table.status !== 'libre') return false
        table.status = 'ocupada'
        return true
    }
}
