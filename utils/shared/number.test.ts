import { describe, it, expect } from 'vitest'
import { roundTo, formatDecimal, formatCurrency } from './number'

describe('number utils', () => {
    describe('roundTo', () => {
        it('rounds to 2 decimal places by default', () => {
            expect(roundTo(1.2345)).toBe(1.23)
        })

        it('rounds to specified digits', () => {
            expect(roundTo(1.2355, 3)).toBe(1.236)
            expect(roundTo(1.2345, 0)).toBe(1)
        })

        it('handles zero and negatives', () => {
            expect(roundTo(0)).toBe(0)
            expect(roundTo(-1.2345, 2)).toBe(-1.23)
        })

        it('handles already-exact values', () => {
            expect(roundTo(1.5, 2)).toBe(1.5)
        })
    })

    describe('formatDecimal', () => {
        it('formats number to 2 places by default', () => {
            expect(formatDecimal(3.5)).toBe('3.50')
        })

        it('accepts string input', () => {
            expect(formatDecimal('2.1')).toBe('2.10')
        })

        it('respects digits parameter', () => {
            expect(formatDecimal(1.23456, 4)).toBe('1.2346')
        })

        it('handles zero', () => {
            expect(formatDecimal(0)).toBe('0.00')
        })

        it('handles null/undefined as 0', () => {
            expect(formatDecimal(null)).toBe('0.00')
            expect(formatDecimal(undefined)).toBe('0.00')
        })
    })

    describe('formatCurrency', () => {
        it('uses $ symbol with 4 decimal places by default', () => {
            expect(formatCurrency(10)).toBe('$10.0000')
        })

        it('uses custom symbol', () => {
            expect(formatCurrency(9.99, 2, '¥')).toBe('¥9.99')
        })

        it('handles string input', () => {
            expect(formatCurrency('5.5', 2)).toBe('$5.50')
        })

        it('handles zero', () => {
            expect(formatCurrency(0, 2)).toBe('$0.00')
        })
    })
})
