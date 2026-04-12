import { describe, it, expect } from 'vitest'
import { DEFAULT_AI_COST_DISPLAY, normalizeAICostDisplay, formatAICost } from './ai-cost'

describe('ai-cost utils', () => {
    describe('DEFAULT_AI_COST_DISPLAY', () => {
        it('has the expected default values', () => {
            expect(DEFAULT_AI_COST_DISPLAY.currencyCode).toBe('CNY')
            expect(DEFAULT_AI_COST_DISPLAY.currencySymbol).toBe('¥')
            expect(DEFAULT_AI_COST_DISPLAY.quotaUnitPrice).toBe(0)
        })
    })

    describe('normalizeAICostDisplay', () => {
        it('returns defaults when called with no args', () => {
            const result = normalizeAICostDisplay()
            expect(result.currencyCode).toBe('CNY')
            expect(result.currencySymbol).toBe('¥')
            expect(result.quotaUnitPrice).toBe(0)
        })

        it('returns defaults when called with null', () => {
            const result = normalizeAICostDisplay(null)
            expect(result.currencyCode).toBe('CNY')
            expect(result.currencySymbol).toBe('¥')
        })

        it('uppercases currencyCode', () => {
            const result = normalizeAICostDisplay({ currencyCode: 'usd', currencySymbol: '$', quotaUnitPrice: 0 })
            expect(result.currencyCode).toBe('USD')
        })

        it('trims currencySymbol', () => {
            const result = normalizeAICostDisplay({ currencyCode: 'USD', currencySymbol: '  $  ', quotaUnitPrice: 0 })
            expect(result.currencySymbol).toBe('$')
        })

        it('uses provided finite quotaUnitPrice', () => {
            const result = normalizeAICostDisplay({ currencyCode: 'USD', currencySymbol: '$', quotaUnitPrice: 1.5 })
            expect(result.quotaUnitPrice).toBe(1.5)
        })

        it('falls back to 0 for non-finite quotaUnitPrice', () => {
            const result = normalizeAICostDisplay({ currencyCode: 'USD', currencySymbol: '$', quotaUnitPrice: NaN })
            expect(result.quotaUnitPrice).toBe(0)
        })

        it('falls back to 0 for Infinity quotaUnitPrice', () => {
            const result = normalizeAICostDisplay({ currencyCode: 'USD', currencySymbol: '$', quotaUnitPrice: Infinity })
            expect(result.quotaUnitPrice).toBe(0)
        })
    })

    describe('formatAICost', () => {
        it('formats value with default display (¥ symbol)', () => {
            const result = formatAICost(10, null, 2)
            expect(result).toBe('¥10.00')
        })

        it('formats with custom cost display', () => {
            const result = formatAICost(9.99, { currencyCode: 'USD', currencySymbol: '$', quotaUnitPrice: 0 }, 2)
            expect(result).toBe('$9.99')
        })

        it('defaults to 2 decimal places', () => {
            const result = formatAICost(5)
            expect(result).toBe('¥5.00')
        })

        it('handles 0 value', () => {
            const result = formatAICost(0, null, 2)
            expect(result).toBe('¥0.00')
        })
    })
})
