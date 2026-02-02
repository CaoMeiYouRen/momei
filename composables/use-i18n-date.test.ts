import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const sharedLocale = ref('zh-CN')
const mockSession = ref<any>(null)

// Mock useI18n
mockNuxtImport('useI18n', () => () => ({
    locale: sharedLocale,
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: () => mockSession,
    },
}))

// Mock date utils
vi.mock('@/utils/shared/date', () => ({
    formatDate: vi.fn((date, format, locale, timezone) => `formatted-date-${locale}-${timezone || 'default'}`),
    formatDateTime: vi.fn((date, format, locale, timezone) => `formatted-datetime-${locale}-${timezone || 'default'}`),
}))

import { useI18nDate } from './use-i18n-date'
import { formatDate as _formatDate, formatDateTime as _formatDateTime } from '@/utils/shared/date'

describe('useI18nDate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sharedLocale.value = 'zh-CN'
        mockSession.value = null
    })

    describe('formatDate', () => {
        it('should format date with correct locale', () => {
            sharedLocale.value = 'en-US'
            const { formatDate } = useI18nDate()

            const result = formatDate(new Date('2024-01-01'))

            expect(_formatDate).toHaveBeenCalledWith(
                expect.any(Date),
                undefined,
                'en',
                undefined,
            )
            expect(result).toBe('formatted-date-en-default')
        })

        it('should format date with user timezone', () => {
            sharedLocale.value = 'zh-CN'
            mockSession.value = {
                data: {
                    user: {
                        timezone: 'Asia/Shanghai',
                    },
                },
            }

            const { formatDate } = useI18nDate()
            const result = formatDate(new Date('2024-01-01'))

            expect(_formatDate).toHaveBeenCalledWith(
                expect.any(Date),
                undefined,
                'zh-cn',
                'Asia/Shanghai',
            )
            expect(result).toBe('formatted-date-zh-cn-Asia/Shanghai')
        })

        it('should return "-" for null or undefined date', () => {
            const { formatDate } = useI18nDate()

            expect(formatDate(null)).toBe('-')
            expect(formatDate(undefined)).toBe('-')
        })

        it('should use custom format when provided', () => {
            const { formatDate } = useI18nDate()

            formatDate(new Date('2024-01-01'), 'YYYY-MM-DD')

            expect(_formatDate).toHaveBeenCalledWith(
                expect.any(Date),
                'YYYY-MM-DD',
                'zh-cn',
                undefined,
            )
        })
    })

    describe('formatDateTime', () => {
        it('should format datetime with correct locale', () => {
            sharedLocale.value = 'en-US'
            const { formatDateTime } = useI18nDate()

            const result = formatDateTime(new Date('2024-01-01 12:00:00'))

            expect(_formatDateTime).toHaveBeenCalledWith(
                expect.any(Date),
                undefined,
                'en',
                undefined,
            )
            expect(result).toBe('formatted-datetime-en-default')
        })

        it('should return "-" for null or undefined datetime', () => {
            const { formatDateTime } = useI18nDate()

            expect(formatDateTime(null)).toBe('-')
            expect(formatDateTime(undefined)).toBe('-')
        })
    })

    describe('relativeTime', () => {
        beforeEach(() => {
            // Mock current time to 2024-01-15 12:00:00
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2024-01-15 12:00:00'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should return "-" for null or undefined date', () => {
            const { relativeTime } = useI18nDate()

            expect(relativeTime(null)).toBe('-')
            expect(relativeTime(undefined)).toBe('-')
        })

        it('should return formatted date for dates older than 30 days', () => {
            const { relativeTime } = useI18nDate()
            const oldDate = new Date('2023-12-01')

            const result = relativeTime(oldDate)

            expect(_formatDate).toHaveBeenCalled()
            expect(result).toContain('formatted-date')
        })

        it('should return relative time for recent dates', () => {
            sharedLocale.value = 'en-US'
            const { relativeTime } = useI18nDate()

            // 5 minutes ago
            const fiveMinutesAgo = new Date('2024-01-15 11:55:00')
            const result1 = relativeTime(fiveMinutesAgo)
            expect(result1).toBeTruthy()

            // 2 hours ago
            const twoHoursAgo = new Date('2024-01-15 10:00:00')
            const result2 = relativeTime(twoHoursAgo)
            expect(result2).toBeTruthy()

            // 5 days ago
            const fiveDaysAgo = new Date('2024-01-10 12:00:00')
            const result3 = relativeTime(fiveDaysAgo)
            expect(result3).toBeTruthy()
        })
    })

    describe('alias', () => {
        it('should provide "d" as alias for formatDateTime', () => {
            const { d, formatDateTime } = useI18nDate()

            expect(d).toBe(formatDateTime)
        })
    })
})

