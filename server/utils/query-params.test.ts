import { describe, expect, it } from 'vitest'
import { toQueryString, toQueryStringArray } from './query-params'

describe('toQueryString', () => {
    it('returns a string value as-is', () => {
        expect(toQueryString('hello')).toBe('hello')
    })

    it('returns the first element when given an array', () => {
        expect(toQueryString(['first', 'second'])).toBe('first')
    })

    it('returns undefined for a number', () => {
        expect(toQueryString(42)).toBeUndefined()
    })

    it('returns undefined for undefined', () => {
        expect(toQueryString(undefined)).toBeUndefined()
    })

    it('returns undefined for null', () => {
        expect(toQueryString(null)).toBeUndefined()
    })

    it('returns undefined for an empty array', () => {
        expect(toQueryString([])).toBeUndefined()
    })

    it('returns string from single-element array', () => {
        expect(toQueryString(['single'])).toBe('single')
    })
})

describe('toQueryStringArray', () => {
    it('returns undefined for undefined', () => {
        expect(toQueryStringArray(undefined)).toBeUndefined()
    })

    it('returns undefined for null', () => {
        expect(toQueryStringArray(null)).toBeUndefined()
    })

    it('wraps a single string in an array', () => {
        expect(toQueryStringArray('hello')).toEqual(['hello'])
    })

    it('filters non-string values from an array', () => {
        expect(toQueryStringArray(['hello', 42, null, 'world'])).toEqual(['hello', 'world'])
    })

    it('returns all string values from an array', () => {
        expect(toQueryStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('returns undefined when array has no strings', () => {
        expect(toQueryStringArray([42, null])).toBeUndefined()
    })

    it('returns undefined for empty array', () => {
        expect(toQueryStringArray([])).toBeUndefined()
    })
})
