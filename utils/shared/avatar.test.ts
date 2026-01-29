import { describe, expect, it } from 'vitest'
import { getGravatarUrl } from './avatar'

describe('getGravatarUrl', () => {
    it('should generate gravatar URL with default parameters', () => {
        const hash = 'd4c74594d841139328695756648b6bd6'
        const url = getGravatarUrl(hash)
        expect(url).toBe('https://0.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=120&d=mp')
    })

    it('should generate gravatar URL with custom size', () => {
        const hash = 'd4c74594d841139328695756648b6bd6'
        const url = getGravatarUrl(hash, 200)
        expect(url).toBe('https://0.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=200&d=mp')
    })

    it('should generate gravatar URL with custom default image', () => {
        const hash = 'd4c74594d841139328695756648b6bd6'
        const url = getGravatarUrl(hash, 120, 'identicon')
        expect(url).toBe('https://0.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=120&d=identicon')
    })

    it('should handle email addresses by converting to lowercase', () => {
        const email = 'Test@Example.COM'
        const url = getGravatarUrl(email)
        expect(url).toBe('https://0.gravatar.com/avatar/test@example.com?s=120&d=mp')
    })

    it('should trim whitespace from identifier', () => {
        const hash = '  d4c74594d841139328695756648b6bd6  '
        const url = getGravatarUrl(hash)
        expect(url).toBe('https://0.gravatar.com/avatar/d4c74594d841139328695756648b6bd6?s=120&d=mp')
    })

    it('should work with different default image types', () => {
        const hash = 'd4c74594d841139328695756648b6bd6'
        const types = ['mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank']

        types.forEach((type) => {
            const url = getGravatarUrl(hash, 120, type)
            expect(url).toContain(`d=${type}`)
        })
    })
})
