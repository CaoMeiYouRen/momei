import { describe, expect, it } from 'vitest'
import { publicPaths } from './public-paths'

describe('publicPaths', () => {
    it('should contain all expected public paths', () => {
        const expectedPaths = [
            '/login',
            '/about',
            '/register',
            '/forgot-password',
            '/reset-password',
            '/callback',
            '/privacy-policy',
            '/user-agreement',
            '/privacy',
            '/terms',
            '/installation',
            '/posts',
            '/categories',
            '/tags',
            '/archives',
            '/submit',
        ]

        expect(publicPaths).toEqual(expectedPaths)
    })

    it('should be an array', () => {
        expect(Array.isArray(publicPaths)).toBe(true)
    })

    it('should contain at least 10 paths', () => {
        expect(publicPaths.length).toBeGreaterThanOrEqual(10)
    })

    it('should contain authentication related paths', () => {
        expect(publicPaths).toContain('/login')
        expect(publicPaths).toContain('/register')
        expect(publicPaths).toContain('/forgot-password')
        expect(publicPaths).toContain('/reset-password')
    })

    it('should contain legal pages paths', () => {
        expect(publicPaths).toContain('/privacy-policy')
        expect(publicPaths).toContain('/user-agreement')
        expect(publicPaths).toContain('/privacy')
        expect(publicPaths).toContain('/terms')
    })

    it('should contain blog related paths', () => {
        expect(publicPaths).toContain('/posts')
        expect(publicPaths).toContain('/categories')
        expect(publicPaths).toContain('/tags')
        expect(publicPaths).toContain('/archives')
    })

    it('should contain installation path', () => {
        expect(publicPaths).toContain('/installation')
    })

    it('should contain submit path', () => {
        expect(publicPaths).toContain('/submit')
    })

    it('should not contain admin paths', () => {
        expect(publicPaths).not.toContain('/admin')
        expect(publicPaths).not.toContain('/admin/posts')
        expect(publicPaths).not.toContain('/admin/settings')
    })

    it('should not contain settings path', () => {
        expect(publicPaths).not.toContain('/settings')
    })
})
