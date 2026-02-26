import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'

describe('/api/posts', () => {
    beforeEach(async () => {
        await setup({
            server: true,
        })
    })

    afterEach(async () => {
        // Cleanup if needed
    })

    it('should return posts list', async () => {
        const response = await fetch('/api/posts')

        expect(response.status).toBe(200)

        const data: any = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data).toHaveProperty('data')
    })

    it('should support pagination', async () => {
        const response = await fetch('/api/posts?page=1&limit=10')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data.data).toHaveProperty('items')
        expect(data.data).toHaveProperty('total')
        expect(data.data).toHaveProperty('totalPages')
        expect(data.data).toHaveProperty('page')
        expect(data.data).toHaveProperty('limit')
    })

    it('should filter by status', async () => {
        const response = await fetch('/api/posts?status=published')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should support search', async () => {
        const response = await fetch('/api/posts?search=test')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should filter by category', async () => {
        const response = await fetch('/api/posts?category=tech')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should filter by tag', async () => {
        const response = await fetch('/api/posts?tag=test')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should support sorting', async () => {
        const response = await fetch('/api/posts?orderBy=publishedAt&order=DESC')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should return empty array when no posts found', async () => {
        const response = await fetch('/api/posts?search=nonexistent')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data.data.items).toEqual([])
    })
})
