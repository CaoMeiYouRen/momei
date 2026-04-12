import { describe, it, expect } from 'vitest'
import { stableSerialize } from './stable-serialize'

describe('stableSerialize', () => {
    it('serializes primitives via JSON.stringify', () => {
        expect(stableSerialize(42)).toBe('42')
        expect(stableSerialize('hello')).toBe('"hello"')
        expect(stableSerialize(true)).toBe('true')
        expect(stableSerialize(null)).toBe('null')
    })

    it('serializes arrays', () => {
        expect(stableSerialize([1, 2, 3])).toBe('[1,2,3]')
        expect(stableSerialize(['a', 'b'])).toBe('["a","b"]')
    })

    it('sorts object keys alphabetically', () => {
        expect(stableSerialize({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}')
    })

    it('produces same output regardless of key insertion order', () => {
        const obj1 = { b: 2, a: 1 }
        const obj2 = { a: 1, b: 2 }
        expect(stableSerialize(obj1)).toBe(stableSerialize(obj2))
    })

    it('handles nested objects', () => {
        const result = stableSerialize({ b: { d: 4, c: 3 }, a: 1 })
        expect(result).toBe('{"a":1,"b":{"c":3,"d":4}}')
    })

    it('handles empty object', () => {
        expect(stableSerialize({})).toBe('{}')
    })

    it('handles empty array', () => {
        expect(stableSerialize([])).toBe('[]')
    })

    it('handles undefined as null (JSON standard)', () => {
        expect(stableSerialize(undefined)).toBe(undefined)
    })
})
