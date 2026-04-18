import { describe, expect, it } from 'vitest'
import {
    formatDurationMinutesForInput,
    formatDurationSecondsForInput,
    normalizeDurationMinutes,
    normalizeDurationSeconds,
    parseDurationMinutes,
    parseDurationSeconds,
} from '@/utils/shared/duration'

describe('duration utils', () => {
    describe('parseDurationSeconds', () => {
        it('parses legacy numeric seconds', () => {
            expect(parseDurationSeconds('900')).toBe(900)
            expect(parseDurationSeconds(60)).toBe(60)
        })

        it('floors finite numeric inputs and trims string inputs', () => {
            expect(parseDurationSeconds(61.9)).toBe(61)
            expect(parseDurationSeconds('  61.9  ')).toBe(61)
        })

        it('parses human readable durations', () => {
            expect(parseDurationSeconds('15m')).toBe(900)
            expect(parseDurationSeconds('1d')).toBe(86400)
        })

        it('returns null for invalid values', () => {
            expect(parseDurationSeconds('not-a-duration')).toBeNull()
            expect(parseDurationSeconds(undefined)).toBeNull()
            expect(parseDurationSeconds(Number.NaN)).toBeNull()
            expect(parseDurationSeconds('   ')).toBeNull()
        })
    })

    describe('normalizeDurationSeconds', () => {
        it('falls back when parsing fails', () => {
            expect(normalizeDurationSeconds('bad', 900)).toBe(900)
        })

        it('applies min and max bounds', () => {
            expect(normalizeDurationSeconds('10s', 900, { min: 60 })).toBe(60)
            expect(normalizeDurationSeconds('10d', 900, { max: 86400 })).toBe(86400)
        })

        it('floors fallback values before applying bounds', () => {
            expect(normalizeDurationSeconds(undefined, 9.9)).toBe(9)
        })
    })

    describe('parseDurationMinutes', () => {
        it('parses legacy numeric minutes', () => {
            expect(parseDurationMinutes('1440')).toBe(1440)
        })

        it('parses human readable durations into minutes', () => {
            expect(parseDurationMinutes('1d')).toBe(1440)
            expect(parseDurationMinutes('90m')).toBe(90)
        })

        it('rounds partial minutes up and rejects invalid inputs', () => {
            expect(parseDurationMinutes('61s')).toBe(2)
            expect(parseDurationMinutes('bad')).toBeNull()
            expect(parseDurationMinutes(Number.POSITIVE_INFINITY)).toBeNull()
        })
    })

    describe('normalizeDurationMinutes', () => {
        it('falls back and clamps for minute-based settings', () => {
            expect(normalizeDurationMinutes('bad', 1440)).toBe(1440)
            expect(normalizeDurationMinutes('30m', 1440, { min: 60 })).toBe(60)
        })

        it('applies max bounds to minute-based settings', () => {
            expect(normalizeDurationMinutes('2d', 60, { max: 1440 })).toBe(1440)
        })
    })

    describe('formatDurationSecondsForInput', () => {
        it('formats exact unit-aligned durations for admin inputs', () => {
            expect(formatDurationSecondsForInput(900)).toBe('15m')
            expect(formatDurationSecondsForInput(86400)).toBe('1d')
            expect(formatDurationSecondsForInput(30)).toBe('30s')
        })

        it('falls back for invalid inputs and keeps non-aligned values in seconds', () => {
            expect(formatDurationSecondsForInput(-1, 'fallback')).toBe('fallback')
            expect(formatDurationSecondsForInput(null, 'fallback')).toBe('fallback')
            expect(formatDurationSecondsForInput(91)).toBe('91s')
        })
    })

    describe('formatDurationMinutesForInput', () => {
        it('formats minute-based settings for admin inputs', () => {
            expect(formatDurationMinutesForInput(1440)).toBe('1d')
            expect(formatDurationMinutesForInput(90)).toBe('90m')
        })

        it('falls back for invalid minute values', () => {
            expect(formatDurationMinutesForInput(undefined, 'fallback')).toBe('fallback')
            expect(formatDurationMinutesForInput(-5, 'fallback')).toBe('fallback')
        })
    })
})
