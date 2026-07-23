import { describe, expect, it } from 'vitest'
import { isRecord, isSelectLocaleOption } from './type-guards'

describe('type-guards', () => {
    describe('isRecord', () => {
        it('returns true for plain objects', () => {
            expect(isRecord({})).toBe(true)
            expect(isRecord({ key: 'value' })).toBe(true)
            expect(isRecord({ nested: { a: 1 } })).toBe(true)
        })

        it('returns false for null', () => {
            expect(isRecord(null)).toBe(false)
        })

        it('returns false for arrays', () => {
            expect(isRecord([])).toBe(false)
            expect(isRecord([1, 2, 3])).toBe(false)
        })

        it('returns false for primitives', () => {
            expect(isRecord('string')).toBe(false)
            expect(isRecord(42)).toBe(false)
            expect(isRecord(true)).toBe(false)
            expect(isRecord(undefined)).toBe(false)
        })
    })

    describe('isSelectLocaleOption', () => {
        it('returns true for valid locale option objects', () => {
            expect(isSelectLocaleOption({ label: '中文', code: 'zh-CN' })).toBe(true)
            expect(isSelectLocaleOption({ label: 'English', code: 'en-US', extra: true })).toBe(true)
        })

        it('returns false when missing label or code', () => {
            expect(isSelectLocaleOption({ label: '中文' })).toBe(false)
            expect(isSelectLocaleOption({ code: 'zh-CN' })).toBe(false)
            expect(isSelectLocaleOption({})).toBe(false)
        })

        it('returns false for non-objects', () => {
            expect(isSelectLocaleOption('string')).toBe(false)
            expect(isSelectLocaleOption(null)).toBe(false)
            expect(isSelectLocaleOption(undefined)).toBe(false)
            expect(isSelectLocaleOption(42)).toBe(false)
        })
    })
})
