import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'

describe('/api/tags', () => {
    beforeEach(async () => {
        await setup({
            server: true,
        })
    })

    afterEach(async () => {
        // Cleanup if needed
    })

    it('should return tags list', async () => {
        const response = await fetch('/api/tags')

        expect(response.status).toBe(200)

        const data: any = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data).toHaveProperty('data')
    })

    it('should support pagination', async () => {
        const response = await fetch('/api/tags?page=1&limit=20')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data.data).toHaveProperty('items')
        expect(data.data).toHaveProperty('total')
        expect(data.data).toHaveProperty('page')
        expect(data.data).toHaveProperty('limit')
    })

    it('should support search', async () => {
        const response = await fetch('/api/tags?search=test')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should support ordering by post count', async () => {
        const response = await fetch('/api/tags?orderBy=postCount&order=DESC')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
    })

    it('should return empty array when no tags found', async () => {
        const response = await fetch('/api/tags?search=nonexistent')

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('code', 200)
        expect(data.data.items).toEqual([])
    })
})
