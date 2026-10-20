import { Database } from '@config/database.js'
import type { Table, TableStatus } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'

interface TableRow {
    id: string
    restaurantId: string
    number: number
    description: string | null
    capacity: number
    status: string
    createdAt: string
    updatedAt: string
}

const SELECT_TABLE = 'SELECT id, restaurant_id as restaurantId, number, description, capacity, status, created_at as createdAt, updated_at as updatedAt FROM tables'

export interface TableRepository {
    create(table: Table): Promise<void>
    findById(id: string): Promise<Table | null>
    findByRestaurant(restaurantId: string, status?: TableStatus): Promise<Table[]>
    update(table: Table): Promise<void>
    delete(id: string): Promise<void>
    existsNumber(restaurantId: string, number: number, excludeId?: string): Promise<boolean>
    findAvailable(restaurantId: string, people: number): Promise<Table[]>
    occupyIfFree(id: string): Promise<boolean>
}

export class SqliteTableRepository implements TableRepository {
    constructor(private readonly db: Database) {}

    async create(table: Table): Promise<void> {
        await this.db.run(
            'INSERT INTO tables (id, restaurant_id, number, description, capacity, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [table.id, table.restaurantId, table.number, table.description, table.capacity, table.status, table.createdAt, table.updatedAt]
        )
    }

    async findById(id: string): Promise<Table | null> {
        const row = await this.db.get<TableRow>(`${SELECT_TABLE} WHERE id = ?`, [id])
        return row ? this.mapToTable(row) : null
    }

    async findByRestaurant(restaurantId: string, status?: TableStatus): Promise<Table[]> {
        const rows = status
            ? await this.db.all<TableRow>(`${SELECT_TABLE} WHERE restaurant_id = ? AND status = ? ORDER BY number ASC`, [restaurantId, status])
            : await this.db.all<TableRow>(`${SELECT_TABLE} WHERE restaurant_id = ? ORDER BY number ASC`, [restaurantId])
        return rows.map(row => this.mapToTable(row))
    }

    async update(table: Table): Promise<void> {
        await this.db.run(
            'UPDATE tables SET number = ?, description = ?, capacity = ?, status = ?, updated_at = ? WHERE id = ?',
            [table.number, table.description, table.capacity, table.status, table.updatedAt, table.id]
        )
    }

    async delete(id: string): Promise<void> {
        await this.db.run('DELETE FROM tables WHERE id = ?', [id])
    }

    async existsNumber(restaurantId: string, number: number, excludeId?: string): Promise<boolean> {
        const row = await this.db.get<{ id: string }>(
            'SELECT id FROM tables WHERE restaurant_id = ? AND number = ? AND id != ?',
            [restaurantId, number, excludeId ?? '']
        )
        return row !== undefined
    }

    async findAvailable(restaurantId: string, people: number): Promise<Table[]> {
        const rows = await this.db.all<TableRow>(
            `${SELECT_TABLE} WHERE restaurant_id = ? AND status = 'libre' AND capacity >= ? ORDER BY capacity ASC, number ASC`,
            [restaurantId, people]
        )
        return rows.map(row => this.mapToTable(row))
    }

    async occupyIfFree(id: string): Promise<boolean> {
        const result = await this.db.run(
            "UPDATE tables SET status = 'ocupada', updated_at = ? WHERE id = ? AND status = 'libre'",
            [new Date().toISOString(), id]
        )
        return result.changes > 0
    }

    private mapToTable(row: TableRow): Table {
        return {
            id: row.id,
            restaurantId: row.restaurantId,
            number: row.number,
            description: row.description,
            capacity: row.capacity,
            status: normalizeTableStatus(row.status),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        }
    }
}
