import { describe, it, expect } from 'vitest'
import { getSemanticScale, normalizeAspectRatio, calculateDimension } from './image-utils'

describe('getSemanticScale', () => {
    it('returns 1 for 1K (default)', () => {
        expect(getSemanticScale('1K')).toBe(1)
        expect(getSemanticScale('unknown')).toBe(1)
    })

    it('returns 2 for 2K', () => {
        expect(getSemanticScale('2K')).toBe(2)
    })

    it('returns 4 for 4K', () => {
        expect(getSemanticScale('4K')).toBe(4)
    })

    it('returns 0.5 for 512px', () => {
        expect(getSemanticScale('512px')).toBe(0.5)
        expect(getSemanticScale('512PX')).toBe(0.5)
    })

    it('is case-insensitive', () => {
        expect(getSemanticScale('2k')).toBe(2)
        expect(getSemanticScale('4k')).toBe(4)
    })
})

describe('normalizeAspectRatio', () => {
    it('removes whitespace', () => {
        expect(normalizeAspectRatio('16 : 9')).toBe('16:9')
    })

    it('returns ratio as-is when no validation list', () => {
        expect(normalizeAspectRatio('16:9')).toBe('16:9')
    })

    it('returns valid ratio when in validRatios list', () => {
        expect(normalizeAspectRatio('16:9', ['16:9', '1:1'])).toBe('16:9')
    })

    it('returns 1:1 fallback when ratio not in validRatios', () => {
        expect(normalizeAspectRatio('5:3', ['16:9', '1:1'])).toBe('1:1')
    })
})

describe('calculateDimension', () => {
    it('returns square for 1:1', () => {
        const dim = calculateDimension(1024, '1:1')
        expect(dim.width).toBe(1024)
        expect(dim.height).toBe(1024)
    })

    it('calculates 16:9 landscape', () => {
        const dim = calculateDimension(1024, '16:9')
        expect(dim.width).toBe(Math.round(1024 * 1.77))
        expect(dim.height).toBe(1024)
    })

    it('calculates 9:16 portrait', () => {
        const dim = calculateDimension(1024, '9:16')
        expect(dim.width).toBe(1024)
        expect(dim.height).toBe(Math.round(1024 * 1.77))
    })

    it('calculates 4:3', () => {
        const dim = calculateDimension(1024, '4:3')
        expect(dim.width).toBe(Math.round(1024 * 1.33))
        expect(dim.height).toBe(1024)
    })

    it('calculates 3:4', () => {
        const dim = calculateDimension(1024, '3:4')
        expect(dim.width).toBe(1024)
        expect(dim.height).toBe(Math.round(1024 * 1.33))
    })

    it('calculates 3:2', () => {
        const dim = calculateDimension(1024, '3:2')
        expect(dim.width).toBe(Math.round(1024 * 1.5))
        expect(dim.height).toBe(1024)
    })

    it('calculates 2:3', () => {
        const dim = calculateDimension(1024, '2:3')
        expect(dim.width).toBe(1024)
        expect(dim.height).toBe(Math.round(1024 * 1.5))
    })
})
