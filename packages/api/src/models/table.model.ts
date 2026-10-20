import { InvalidTableStatusError, InvalidTableNumberError, InvalidTableCapacityError } from '@errors/DomainErrors.js'

const VALID_TABLE_STATUSES = ['libre', 'ocupada', 'reservada'] as const

export type TableStatus = typeof VALID_TABLE_STATUSES[number]

export interface Table {
    id: string
    restaurantId: string
    number: number
    description: string | null
    capacity: number
    status: TableStatus
    createdAt: string
    updatedAt: string
}

export function normalizeTableStatus(value: string): TableStatus {
    const normalized = typeof value === 'string' ? value.toLowerCase().trim() : ''
    if (!VALID_TABLE_STATUSES.includes(normalized as TableStatus)) {
        throw new InvalidTableStatusError()
    }
    return normalized as TableStatus
}

export function normalizeTableNumber(value: unknown): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new InvalidTableNumberError()
    }
    return value
}

export function normalizeTableCapacity(value: unknown): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new InvalidTableCapacityError()
    }
    return value
}
