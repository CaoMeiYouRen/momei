import { describe, expect, it } from 'vitest'
import {
    formatDurationSecondsForInput,
    normalizeDurationSeconds,
    parseDurationSeconds,
} from '@/utils/shared/duration'

describe('duration utils', () => {
    describe('parseDurationSeconds', () => {
        it('parses legacy numeric seconds', () => {
            expect(parseDurationSeconds('900')).toBe(900)
            expect(parseDurationSeconds(60)).toBe(60)
        })

        it('parses human readable durations', () => {
            expect(parseDurationSeconds('15m')).toBe(900)
            expect(parseDurationSeconds('1d')).toBe(86400)
        })

        it('returns null for invalid values', () => {
            expect(parseDurationSeconds('not-a-duration')).toBeNull()
            expect(parseDurationSeconds(undefined)).toBeNull()
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
    })

    describe('formatDurationSecondsForInput', () => {
        it('formats exact unit-aligned durations for admin inputs', () => {
            expect(formatDurationSecondsForInput(900)).toBe('15m')
            expect(formatDurationSecondsForInput(86400)).toBe('1d')
            expect(formatDurationSecondsForInput(30)).toBe('30s')
        })
    })
})
