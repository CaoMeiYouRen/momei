import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '@/utils/shared/date'

describe('Date Utils', () => {
    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2023-01-01')
            expect(formatDate(date)).toBe('2023-01-01')
        })

        it('should format date with custom format', () => {
            const date = new Date('2023-01-01')
            expect(formatDate(date, 'YYYY/MM/DD')).toBe('2023/01/01')
        })

        it('should return empty string for null/undefined', () => {
            expect(formatDate(null as any)).toBe('')
            expect(formatDate(undefined as any)).toBe('')
        })
    })

    describe('formatDateTime', () => {
        it('should format datetime correctly', () => {
            const date = new Date('2023-01-01T12:00:00')
            expect(formatDateTime(date)).toBe('2023-01-01 12:00:00')
        })

        it('should return empty string for null/undefined', () => {
            expect(formatDateTime(null as any)).toBe('')
        })
    })
})
