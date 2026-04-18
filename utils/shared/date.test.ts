import { describe, it, expect } from 'vitest'
import {
    addMillisecondsToDate,
    addSecondsToDate,
    durationToSeconds,
    formatDate,
    formatDateTime,
    getDateTimestamp,
    getRelativeTime,
    getUtcDateParts,
    isFutureDate,
    secondsToDuration,
} from '@/utils/shared/date'

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

        it('should apply timezone offsets deterministically for UTC inputs', () => {
            const result = formatDateTime('2023-01-01T00:00:00Z', 'YYYY-MM-DD HH:mm:ss', 'en', 'Asia/Shanghai')

            expect(result).toBe('2023-01-01 08:00:00')
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

    describe('getDateTimestamp', () => {
        it('returns a timestamp for valid inputs', () => {
            expect(getDateTimestamp('2024-01-01T00:00:00.000Z')).toBe(new Date('2024-01-01T00:00:00.000Z').getTime())
        })

        it('returns the fallback for invalid inputs', () => {
            expect(getDateTimestamp('invalid-date', 123)).toBe(123)
            expect(getDateTimestamp(null, 456)).toBe(456)
        })

        it('supports timezone-aware parsing when requested', () => {
            expect(getDateTimestamp('2024-01-01T00:00:00.000Z', 0, 'Asia/Shanghai')).toBeGreaterThan(0)
        })
    })

    describe('getRelativeTime', () => {
        it('returns relative time within the max day window', () => {
            const result = getRelativeTime('2024-01-02T00:00:00.000Z', {
                baseDate: '2024-01-01T00:00:00.000Z',
                locale: 'en',
                maxDays: 7,
            })

            expect(result).toBe('in a day')
        })

        it('falls back to formatted date beyond the max day window', () => {
            const result = getRelativeTime('2024-02-20T00:00:00.000Z', {
                baseDate: '2024-01-01T00:00:00.000Z',
                locale: 'en',
                maxDays: 7,
                fallbackFormat: 'YYYY/MM/DD',
            })

            expect(result).toBe('2024/02/20')
        })

        it('returns empty string for empty values', () => {
            expect(getRelativeTime('')).toBe('')
        })
    })

    describe('isFutureDate', () => {
        it('detects future and non-future dates', () => {
            expect(isFutureDate('2024-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z')).toBe(true)
            expect(isFutureDate('2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z')).toBe(false)
        })

        it('returns false for empty values', () => {
            expect(isFutureDate('')).toBe(false)
        })
    })

    describe('addSecondsToDate', () => {
        it('adds seconds with dayjs as the date fact source', () => {
            expect(addSecondsToDate('2024-01-01T00:00:00.000Z', 90).toISOString()).toBe('2024-01-01T00:01:30.000Z')
        })
    })

    describe('addMillisecondsToDate', () => {
        it('adds milliseconds with dayjs as the date fact source', () => {
            expect(addMillisecondsToDate('2024-01-01T00:00:00.000Z', 1500).toISOString()).toBe('2024-01-01T00:00:01.500Z')
        })
    })

    describe('getUtcDateParts', () => {
        it('returns UTC year month day tokens for valid dates', () => {
            expect(getUtcDateParts('2024-02-03T04:05:06.000Z')).toEqual({
                year: '2024',
                month: '02',
                day: '03',
            })
        })

        it('returns null for invalid dates', () => {
            expect(getUtcDateParts('invalid-date')).toBeNull()
            expect(getUtcDateParts(null)).toBeNull()
        })
    })

    describe('durationToSeconds', () => {
        it('treats invalid trailing segments as zero', () => {
            expect(durationToSeconds('01:02:invalid')).toBe(3720)
            expect(durationToSeconds('invalid:20')).toBe(20)
        })
    })
})
