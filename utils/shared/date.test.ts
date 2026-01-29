import { describe, it, expect } from 'vitest'
import { durationToSeconds, formatDate, formatDateTime, secondsToDuration } from '@/utils/shared/date'

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

        it('should format date with locale', () => {
            const date = new Date('2023-01-01')
            expect(formatDate(date, 'YYYY-MM-DD', 'en')).toBe('2023-01-01')
        })

        it('should format date with timezone', () => {
            const date = new Date('2023-01-01T00:00:00Z')
            const result = formatDate(date, 'YYYY-MM-DD HH:mm:ss', 'zh-cn', 'Asia/Shanghai')
            expect(result).toContain('2023')
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

        it('should format datetime with custom format', () => {
            const date = new Date('2023-01-01T12:00:00')
            expect(formatDateTime(date, 'YYYY/MM/DD HH:mm')).toBe('2023/01/01 12:00')
        })

        it('should format datetime with locale', () => {
            const date = new Date('2023-01-01T12:00:00')
            expect(formatDateTime(date, 'YYYY-MM-DD HH:mm:ss', 'en')).toBe('2023-01-01 12:00:00')
        })

        it('should format datetime with timezone', () => {
            const date = new Date('2023-01-01T00:00:00Z')
            const result = formatDateTime(date, 'YYYY-MM-DD HH:mm:ss', 'zh-cn', 'Asia/Shanghai')
            expect(result).toContain('2023')
        })

        it('should return empty string for null/undefined', () => {
            expect(formatDateTime(null as any)).toBe('')
        })
    })

    describe('secondsToDuration', () => {
        it('should convert seconds to HH:mm:ss format', () => {
            expect(secondsToDuration(3661)).toBe('01:01:01')
            expect(secondsToDuration(3600)).toBe('01:00:00')
            expect(secondsToDuration(60)).toBe('00:01:00')
            expect(secondsToDuration(1)).toBe('00:00:01')
        })

        it('should handle zero seconds', () => {
            expect(secondsToDuration(0)).toBe('00:00:00')
        })

        it('should handle null/undefined', () => {
            expect(secondsToDuration(null)).toBe('00:00:00')
            expect(secondsToDuration(undefined)).toBe('00:00:00')
        })

        it('should handle NaN', () => {
            expect(secondsToDuration(NaN)).toBe('00:00:00')
        })

        it('should handle large numbers', () => {
            expect(secondsToDuration(7200)).toBe('02:00:00')
            expect(secondsToDuration(86400)).toBe('24:00:00')
        })
    })

    describe('durationToSeconds', () => {
        it('should convert HH:mm:ss to seconds', () => {
            expect(durationToSeconds('01:01:01')).toBe(3661)
            expect(durationToSeconds('01:00:00')).toBe(3600)
            expect(durationToSeconds('00:01:00')).toBe(60)
            expect(durationToSeconds('00:00:01')).toBe(1)
        })

        it('should convert mm:ss to seconds', () => {
            expect(durationToSeconds('01:30')).toBe(90)
            expect(durationToSeconds('05:00')).toBe(300)
        })

        it('should convert ss to seconds', () => {
            expect(durationToSeconds('30')).toBe(30)
            expect(durationToSeconds('120')).toBe(120)
        })

        it('should handle null/undefined', () => {
            expect(durationToSeconds(null)).toBe(0)
            expect(durationToSeconds(undefined)).toBe(0)
        })

        it('should handle empty string', () => {
            expect(durationToSeconds('')).toBe(0)
        })

        it('should handle invalid format', () => {
            expect(durationToSeconds('invalid')).toBe(0)
        })
    })
})
