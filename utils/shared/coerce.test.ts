import { describe, expect, it } from 'vitest'
import { normalizeOptionalString, parseMaybeJson, toBoolean, toNumber } from './coerce'

describe('coerce utils', () => {
    describe('toBoolean', () => {
        it('returns boolean inputs unchanged', () => {
            expect(toBoolean(true)).toBe(true)
            expect(toBoolean(false, true)).toBe(false)
        })

        it('coerces numeric and string truthy variants', () => {
            expect(toBoolean(1)).toBe(true)
            expect(toBoolean(' true ')).toBe(true)
            expect(toBoolean('"YES"')).toBe(true)
            expect(toBoolean('on')).toBe(true)
        })

        it('coerces numeric and string falsy variants', () => {
            expect(toBoolean(0, true)).toBe(false)
            expect(toBoolean(' false ', true)).toBe(false)
            expect(toBoolean('\'off\'', true)).toBe(false)
            expect(toBoolean('no', true)).toBe(false)
        })

        it('falls back for unsupported values', () => {
            expect(toBoolean('maybe', true)).toBe(true)
            expect(toBoolean({}, false)).toBe(false)
        })
    })

    describe('toNumber', () => {
        it('returns finite numeric values', () => {
            expect(toNumber('42')).toBe(42)
            expect(toNumber(3.14)).toBe(3.14)
        })

        it('falls back for NaN and infinities', () => {
            expect(toNumber('invalid', 7)).toBe(7)
            expect(toNumber(Number.POSITIVE_INFINITY, 9)).toBe(9)
        })
    })

    describe('normalizeOptionalString', () => {
        it('returns a trimmed string when the input contains visible content', () => {
            expect(normalizeOptionalString('  hello world  ')).toBe('hello world')
        })

        it('returns null for blank string input', () => {
            expect(normalizeOptionalString('   ')).toBeNull()
        })

        it('returns null for non-string input', () => {
            expect(normalizeOptionalString(undefined)).toBeNull()
            expect(normalizeOptionalString(null)).toBeNull()
            expect(normalizeOptionalString(123)).toBeNull()
        })
    })

    describe('parseMaybeJson', () => {
        it('parses JSON strings and reuses object values', () => {
            expect(parseMaybeJson<{ count: number }>('{"count":2}')).toEqual({ count: 2 })

            const payload = { enabled: true }
            expect(parseMaybeJson(payload)).toBe(payload)
        })

        it('falls back for empty, invalid, and unsupported values', () => {
            expect(parseMaybeJson('', { fallback: true })).toEqual({ fallback: true })
            expect(parseMaybeJson('bad-json', { fallback: true })).toEqual({ fallback: true })
            expect(parseMaybeJson(123, { fallback: true })).toEqual({ fallback: true })
            expect(parseMaybeJson(null)).toEqual({})
        })
    })
})
