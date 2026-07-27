import { describe, expect, it } from 'vitest'
import { getErrorDetail } from './error-detail'

describe('getErrorDetail', () => {
    it('should extract data.message from error response', () => {
        const error = { data: { message: 'Not found' } }
        expect(getErrorDetail(error, 'fallback')).toBe('Not found')
    })

    it('should extract data.statusMessage from error response', () => {
        const error = { data: { statusMessage: 'Bad Request' } }
        expect(getErrorDetail(error, 'fallback')).toBe('Bad Request')
    })

    it('should prefer data.message over data.statusMessage', () => {
        const error = { data: { message: 'Primary error', statusMessage: 'Secondary error' } }
        expect(getErrorDetail(error, 'fallback')).toBe('Primary error')
    })

    it('should fall back to statusMessage at root level', () => {
        const error = { statusMessage: 'Root status error' }
        expect(getErrorDetail(error, 'fallback')).toBe('Root status error')
    })

    it('should fall back to root message when data is absent', () => {
        const error = { message: 'Root message error' }
        expect(getErrorDetail(error, 'fallback')).toBe('Root message error')
    })

    it('should use fallback when all error fields are undefined', () => {
        const error = {}
        expect(getErrorDetail(error, 'fallback message')).toBe('fallback message')
    })

    it('should handle null error gracefully', () => {
        expect(getErrorDetail(null, 'null fallback')).toBe('null fallback')
    })

    it('should handle undefined error gracefully', () => {
        expect(getErrorDetail(undefined, 'undefined fallback')).toBe('undefined fallback')
    })

    it('should handle string errors gracefully', () => {
        expect(getErrorDetail('string error', 'fallback')).toBe('fallback')
    })

    it('should return fallback when error has no matching fields', () => {
        const error = { code: 500, details: 'server error' }
        expect(getErrorDetail(error, 'generic fallback')).toBe('generic fallback')
    })
})
