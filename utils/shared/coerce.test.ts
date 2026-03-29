import { describe, expect, it } from 'vitest'
import { normalizeOptionalString } from './coerce'

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
