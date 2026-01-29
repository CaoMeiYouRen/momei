import { describe, expect, it } from 'vitest'
import { processAuthorPrivacy, processAuthorsPrivacy } from './author'

describe('author utils', () => {
    describe('processAuthorPrivacy', () => {
        it('should compute email hash for admin', async () => {
            const author = { email: 'test@example.com', name: 'Test User' }
            const result = await processAuthorPrivacy(author, true)

            expect(result.emailHash).toBeDefined()
            expect(result.email).toBe('test@example.com')
        })

        it('should hide email for non-admin', async () => {
            const author = { email: 'test@example.com', name: 'Test User' }
            const result = await processAuthorPrivacy(author, false)

            expect(result.emailHash).toBeDefined()
            expect(result.email).toBeUndefined()
        })

        it('should handle null author', async () => {
            const result = await processAuthorPrivacy(null, false)
            expect(result).toBeNull()
        })

        it('should handle undefined author', async () => {
            const result = await processAuthorPrivacy(undefined, false)
            expect(result).toBeUndefined()
        })

        it('should handle author without email', async () => {
            const author = { name: 'Test User' }
            const result = await processAuthorPrivacy(author, false)

            expect(result.emailHash).toBeUndefined()
            expect(result.name).toBe('Test User')
        })

        it('should use custom email field name', async () => {
            const author = { authorEmail: 'test@example.com', name: 'Test User' }
            const result = await processAuthorPrivacy(author, false, 'authorEmail', 'authorEmailHash')

            expect(result.authorEmailHash).toBeDefined()
            expect(result.authorEmail).toBeUndefined()
        })
    })

    describe('processAuthorsPrivacy', () => {
        it('should process multiple authors', async () => {
            const items = [
                { author: { email: 'test1@example.com', name: 'User 1' } },
                { author: { email: 'test2@example.com', name: 'User 2' } },
            ]

            const result = await processAuthorsPrivacy(items, false)

            expect(result[0].author.emailHash).toBeDefined()
            expect(result[0].author.email).toBeUndefined()
            expect(result[1].author.emailHash).toBeDefined()
            expect(result[1].author.email).toBeUndefined()
        })

        it('should keep email for admin', async () => {
            const items = [
                { author: { email: 'test1@example.com', name: 'User 1' } },
            ]

            const result = await processAuthorsPrivacy(items, true)

            expect(result[0].author.emailHash).toBeDefined()
            expect(result[0].author.email).toBe('test1@example.com')
        })

        it('should handle empty array', async () => {
            const result = await processAuthorsPrivacy([], false)
            expect(result).toEqual([])
        })

        it('should handle null/undefined', async () => {
            const result1 = await processAuthorsPrivacy(null as any, false)
            const result2 = await processAuthorsPrivacy(undefined as any, false)

            expect(result1).toBeNull()
            expect(result2).toBeUndefined()
        })

        it('should handle items without author', async () => {
            const items = [
                { title: 'Post 1' },
                { title: 'Post 2' },
            ]

            const result = await processAuthorsPrivacy(items, false)

            expect(result).toHaveLength(2)
            expect(result[0].title).toBe('Post 1')
        })

        it('should use custom author key', async () => {
            const items = [
                { creator: { email: 'test@example.com', name: 'User' } },
            ]

            const result = await processAuthorsPrivacy(items, false, 'creator')

            expect(result[0].creator.emailHash).toBeDefined()
            expect(result[0].creator.email).toBeUndefined()
        })
    })
})
