import { describe, expect, it } from 'vitest'
import { toDateOrNull, toDateOrUndefined } from './date'

describe('toDateOrNull', () => {
    it('returns null for undefined', () => {
        expect(toDateOrNull(undefined)).toBeNull()
    })

    it('returns null for null', () => {
        expect(toDateOrNull(null)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(toDateOrNull('')).toBeNull()
    })

    it('returns the same Date instance when given a Date', () => {
        const date = new Date('2026-07-24')
        const result = toDateOrNull(date)
        expect(result).toBe(date)
    })

    it('parses a valid date string', () => {
        const result = toDateOrNull('2026-07-24')
        expect(result).toBeInstanceOf(Date)
        expect(result!.toISOString()).toContain('2026-07-24')
    })

    it('returns null for an invalid date string', () => {
        const result = toDateOrNull('not-a-date')
        expect(result).toBeNull()
    })
})

describe('toDateOrUndefined', () => {
    it('returns undefined when value is undefined', () => {
        expect(toDateOrUndefined(undefined)).toBeUndefined()
    })

    it('returns null when value is null', () => {
        expect(toDateOrUndefined(null)).toBeNull()
    })

    it('returns null when value is empty string', () => {
        expect(toDateOrUndefined('')).toBeNull()
    })

    it('returns the same Date instance when given a Date', () => {
        const date = new Date('2026-07-24')
        const result = toDateOrUndefined(date)
        expect(result).toBe(date)
    })

    it('parses a valid date string', () => {
        const result = toDateOrUndefined('2026-07-24')
        expect(result).toBeInstanceOf(Date)
        expect(result!.toISOString()).toContain('2026-07-24')
    })

    it('returns null for an invalid date string', () => {
        const result = toDateOrUndefined('not-a-date')
        expect(result).toBeNull()
    })
})
