import { describe, it, expect } from 'vitest'
import {
    normalizeLocalizedStringList,
    serializeLocalizedStringList,
    hasMeaningfulLocalizedValue,
    isLocalizedSettingValue,
    createEmptyLocalizedSettingValue,
    normalizeLocalizedLegacyValue,
} from './localized-settings'

describe('localizedSettings utils', () => {
    describe('normalizeLocalizedStringList', () => {
        it('returns empty array for null', () => {
            expect(normalizeLocalizedStringList(null)).toEqual([])
        })

        it('returns empty array for undefined', () => {
            expect(normalizeLocalizedStringList(undefined)).toEqual([])
        })

        it('returns empty array for empty string', () => {
            expect(normalizeLocalizedStringList('')).toEqual([])
        })

        it('trims and filters array input', () => {
            expect(normalizeLocalizedStringList(['  a  ', '', '  b  '])).toEqual(['a', 'b'])
        })

        it('splits string by commas', () => {
            expect(normalizeLocalizedStringList('a, b, c')).toEqual(['a', 'b', 'c'])
        })

        it('splits by semicolons', () => {
            expect(normalizeLocalizedStringList('a;b;c')).toEqual(['a', 'b', 'c'])
        })

        it('splits by Chinese comma and enumeration', () => {
            expect(normalizeLocalizedStringList('a，b、c')).toEqual(['a', 'b', 'c'])
        })
    })

    describe('serializeLocalizedStringList', () => {
        it('joins array with ", "', () => {
            expect(serializeLocalizedStringList(['a', 'b', 'c'])).toBe('a, b, c')
        })

        it('returns empty string for null', () => {
            expect(serializeLocalizedStringList(null)).toBe('')
        })

        it('returns empty string for undefined', () => {
            expect(serializeLocalizedStringList(undefined)).toBe('')
        })

        it('handles single-item array', () => {
            expect(serializeLocalizedStringList(['only'])).toBe('only')
        })
    })

    describe('hasMeaningfulLocalizedValue', () => {
        it('returns true for non-empty string', () => {
            expect(hasMeaningfulLocalizedValue('hello')).toBe(true)
        })

        it('returns false for empty string', () => {
            expect(hasMeaningfulLocalizedValue('')).toBe(false)
        })

        it('returns false for whitespace string', () => {
            expect(hasMeaningfulLocalizedValue('   ')).toBe(false)
        })

        it('returns true for array with non-empty items', () => {
            expect(hasMeaningfulLocalizedValue(['a', 'b'])).toBe(true)
        })

        it('returns false for array with all empty strings', () => {
            expect(hasMeaningfulLocalizedValue(['', '  '])).toBe(false)
        })

        it('returns false for null', () => {
            expect(hasMeaningfulLocalizedValue(null)).toBe(false)
        })

        it('returns false for undefined', () => {
            expect(hasMeaningfulLocalizedValue(undefined)).toBe(false)
        })
    })

    describe('isLocalizedSettingValue', () => {
        it('returns true for valid localized-text value', () => {
            const value = {
                version: 1,
                type: 'localized-text',
                locales: { 'zh-CN': 'Hello' },
            }
            expect(isLocalizedSettingValue(value)).toBe(true)
        })

        it('returns true for valid localized-string-list value', () => {
            const value = {
                version: 1,
                type: 'localized-string-list',
                locales: { 'zh-CN': ['a', 'b'] },
            }
            expect(isLocalizedSettingValue(value)).toBe(true)
        })

        it('returns false for wrong version', () => {
            const value = {
                version: 2,
                type: 'localized-text',
                locales: {},
            }
            expect(isLocalizedSettingValue(value)).toBe(false)
        })

        it('returns false for unknown type', () => {
            const value = {
                version: 1,
                type: 'unknown-type',
                locales: {},
            }
            expect(isLocalizedSettingValue(value)).toBe(false)
        })

        it('returns false for non-object', () => {
            expect(isLocalizedSettingValue('string')).toBe(false)
            expect(isLocalizedSettingValue(null)).toBe(false)
            expect(isLocalizedSettingValue(42)).toBe(false)
        })

        it('filters by expectedType', () => {
            const value = {
                version: 1,
                type: 'localized-text',
                locales: {},
            }
            expect(isLocalizedSettingValue(value, 'localized-text')).toBe(true)
            expect(isLocalizedSettingValue(value, 'localized-string-list')).toBe(false)
        })
    })

    describe('createEmptyLocalizedSettingValue', () => {
        it('creates empty localized-text value', () => {
            const value = createEmptyLocalizedSettingValue('localized-text')
            expect(value.version).toBe(1)
            expect(value.type).toBe('localized-text')
            expect(value.locales).toEqual({})
            expect(value.legacyValue).toBeNull()
        })

        it('creates empty localized-string-list value', () => {
            const value = createEmptyLocalizedSettingValue('localized-string-list')
            expect(value.type).toBe('localized-string-list')
        })

        it('stores provided legacyValue', () => {
            const value = createEmptyLocalizedSettingValue('localized-text', 'old value')
            expect(value.legacyValue).toBe('old value')
        })
    })

    describe('normalizeLocalizedLegacyValue', () => {
        it('returns null for null input', () => {
            expect(normalizeLocalizedLegacyValue(null, 'localized-text')).toBeNull()
        })

        it('returns null for empty string', () => {
            expect(normalizeLocalizedLegacyValue('', 'localized-text')).toBeNull()
        })

        it('returns string for text type', () => {
            expect(normalizeLocalizedLegacyValue('hello', 'localized-text')).toBe('hello')
        })

        it('splits and returns array for list type', () => {
            expect(normalizeLocalizedLegacyValue('a, b, c', 'localized-string-list')).toEqual(['a', 'b', 'c'])
        })

        it('returns null for whitespace-only string', () => {
            expect(normalizeLocalizedLegacyValue('   ', 'localized-text')).toBeNull()
        })
    })
})
