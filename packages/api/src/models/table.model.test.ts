import { describe, it, expect } from 'vitest'
import { normalizeTableStatus, normalizeTableNumber, normalizeTableCapacity } from './table.model.js'
import { InvalidTableStatusError, InvalidTableNumberError, InvalidTableCapacityError } from '@errors/DomainErrors.js'

describe('normalizeTableStatus', () => {
    it('should accept valid statuses ignoring case and spaces', () => {
        expect(normalizeTableStatus('libre')).toBe('libre')
        expect(normalizeTableStatus(' Ocupada ')).toBe('ocupada')
        expect(normalizeTableStatus('RESERVADA')).toBe('reservada')
    })

    it('should throw InvalidTableStatusError for unknown values', () => {
        expect(() => normalizeTableStatus('rota')).toThrow(InvalidTableStatusError)
        expect(() => normalizeTableStatus(undefined as unknown as string)).toThrow(InvalidTableStatusError)
    })
})

describe('normalizeTableNumber', () => {
    it('should accept integers greater than zero', () => {
        expect(normalizeTableNumber(7)).toBe(7)
    })

    it('should throw InvalidTableNumberError for zero, negatives, decimals and non numbers', () => {
        for (const value of [0, -1, 1.5, '3', null, undefined]) {
            expect(() => normalizeTableNumber(value)).toThrow(InvalidTableNumberError)
        }
    })
})

describe('normalizeTableCapacity', () => {
    it('should accept integers greater than zero', () => {
        expect(normalizeTableCapacity(4)).toBe(4)
    })

    it('should throw InvalidTableCapacityError for zero, negatives, decimals and non numbers', () => {
        for (const value of [0, -2, 2.5, '4', null, undefined]) {
            expect(() => normalizeTableCapacity(value)).toThrow(InvalidTableCapacityError)
        }
    })
})
