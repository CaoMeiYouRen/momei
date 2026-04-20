import { describe, expect, it } from 'vitest'
import { normalizeStringList, splitAndNormalizeStringList } from './string-list'

describe('string-list', () => {
    it('should trim values while preserving order by default', () => {
        expect(normalizeStringList([' alpha ', 'beta', '  ', 'gamma '])).toEqual(['alpha', 'beta', 'gamma'])
    })

    it('should dedupe, lowercase, and enforce a limit when requested', () => {
        expect(normalizeStringList([' Foo ', 'bar', 'foo', 'BAR', 'baz'], {
            dedupe: true,
            lowercase: true,
            limit: 2,
        })).toEqual(['foo', 'bar'])
    })

    it('should split and normalize delimited input', () => {
        expect(splitAndNormalizeStringList(' a, b\n a ,, c ', {
            delimiters: /[\n,]/,
            dedupe: true,
        })).toEqual(['a', 'b', 'c'])
    })

    it('should support string delimiters while preserving duplicates by default', () => {
        expect(splitAndNormalizeStringList(' a, a , b ', {
            delimiters: ',',
        })).toEqual(['a', 'a', 'b'])
    })
})
