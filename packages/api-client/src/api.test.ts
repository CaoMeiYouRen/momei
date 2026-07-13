import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MomeiHttpClient } from './client'

import { PostsApi } from './posts'
import { CategoriesApi } from './categories'
import { TagsApi } from './tags'
import { SnippetsApi } from './snippets'
import { AiApi } from './ai'
import { MigrationsApi } from './migrations'
import { VersionsApi } from './versions'
import { createMomeiApi } from './index'

function createClient(): MomeiHttpClient {
    return new MomeiHttpClient({ apiUrl: 'http://test.api', apiKey: 'test-key' })
}

function mockOkResponse(data: unknown) {
    return {
        ok: true,
        json: () => Promise.resolve({ code: 200, data }),
    }
}

describe('PostsApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should list posts with query', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({
            items: [{ id: '1', title: 'Post 1' }],
            total: 1, page: 1, limit: 10,
        }))

        const api = new PostsApi(createClient())
        const result = await api.list({ status: 'published', page: 1, limit: 10 })

        expect(result.items).toHaveLength(1)
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts?status=published&page=1&limit=10',
            expect.anything(),
        )
    })

    it('should get a single post', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ id: '1', title: 'Post 1' }))

        const api = new PostsApi(createClient())
        const result = await api.get('1')

        expect(result.title).toBe('Post 1')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts/1',
            expect.anything(),
        )
    })

    it('should create a post', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ id: '42' }))

        const api = new PostsApi(createClient())
        const result = await api.create({ title: 'New Post', content: 'Content' })

        expect(result.id).toBe('42')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/posts',
            expect.objectContaining({ method: 'POST' }),
        )
    })

    it('should validate import post', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({
            canonicalSlug: 'test-post',
            canImport: true,
            summary: { accepted: 1, fallback: 0, repaired: 0, invalid: 0, conflict: 0, 'needs-confirmation': 0, skipped: 0 },
            items: [],
        }))

        const api = new PostsApi(createClient())
        const result = await api.validate({ title: 'Test', content: 'Test content' })

        expect(result.canImport).toBe(true)
        expect(result.canonicalSlug).toBe('test-post')
    })
})

describe('CategoriesApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should create a category', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ id: '1', name: 'Tech', slug: 'tech' }))

        const api = new CategoriesApi(createClient())
        const result = await api.create({ name: 'Tech', slug: 'tech' })

        expect(result.name).toBe('Tech')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/categories',
            expect.objectContaining({ method: 'POST' }),
        )
    })

    it('should delete a category', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ message: 'Deleted' }))

        const api = new CategoriesApi(createClient())
        const result = await api.delete('1')

        expect(result.message).toBe('Deleted')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/categories/1',
            expect.objectContaining({ method: 'DELETE' }),
        )
    })
})

describe('TagsApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should list tags', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({
            items: [{ id: '1', name: 'vue' }],
            total: 1, page: 1, limit: 20,
        }))

        const api = new TagsApi(createClient())
        const result = await api.list({ limit: 20 })

        expect(result.items).toHaveLength(1)
    })
})

describe('SnippetsApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should create a snippet', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ id: '1', content: 'Idea' }))

        const api = new SnippetsApi(createClient())
        const result = await api.create({ content: 'Idea', source: 'web' })

        expect(result.id).toBe('1')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/snippets',
            expect.objectContaining({ method: 'POST' }),
        )
    })

    it('should convert snippet to post', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ postId: 'p1', snippetId: 's1', url: '/posts/p1' }))

        const api = new SnippetsApi(createClient())
        const result = await api.convertToPost('s1')

        expect(result.postId).toBe('p1')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://test.api/api/external/snippets/s1/convert',
            expect.objectContaining({ method: 'POST' }),
        )
    })
})

describe('AiApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should suggest titles', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse(['Title A', 'Title B']))

        const api = new AiApi(createClient())
        const result = await api.suggestTitles({ content: 'Content' })

        expect(result).toEqual(['Title A', 'Title B'])
    })

    it('should get task status', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ id: 't1', status: 'completed', progress: 100 }))

        const api = new AiApi(createClient())
        const result = await api.getTask('t1')

        expect(result.status).toBe('completed')
        expect(result.progress).toBe(100)
    })
})

describe('MigrationsApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should dry-run link governance', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({
            reportId: 'r1',
            mode: 'dry-run',
            summary: { total: 5, resolved: 5, rewritten: 0, unchanged: 0, skipped: 0, failed: 0, needsConfirmation: 0 },
            items: [],
            redirectSeeds: [],
        }))

        const api = new MigrationsApi(createClient())
        const result = await api.dryRunLinkGovernance({ scopes: ['post-link'] })

        expect(result.reportId).toBe('r1')
        expect(result.mode).toBe('dry-run')
    })
})

describe('VersionsApi', () => {
    let mockFetch: ReturnType<typeof vi.fn>
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
        mockFetch = vi.fn()
        globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should list versions', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ items: [{ id: 'v1', sequence: 1 }], total: 1 }))

        const api = new VersionsApi(createClient())
        const result = await api.list('p1')

        expect(result.items).toHaveLength(1)
        expect(result.items[0]?.sequence).toBe(1)
    })

    it('should create version', async () => {
        mockFetch.mockResolvedValueOnce(mockOkResponse({ created: true, version: { id: 'v1', sequence: 1 } }))

        const api = new VersionsApi(createClient())
        const result = await api.create('p1')

        expect(result.created).toBe(true)
        expect(result.version.id).toBe('v1')
    })
})

describe('createMomeiApi', () => {
    it('should create a fully configured API client factory', () => {
        const api = createMomeiApi({ apiUrl: 'http://test.api', apiKey: 'test-key' })

        expect(api.posts).toBeInstanceOf(PostsApi)
        expect(api.ai).toBeInstanceOf(AiApi)
        expect(api.categories).toBeInstanceOf(CategoriesApi)
        expect(api.tags).toBeInstanceOf(TagsApi)
        expect(api.snippets).toBeInstanceOf(SnippetsApi)
        expect(api.versions).toBeInstanceOf(VersionsApi)
        expect(api.migrations).toBeInstanceOf(MigrationsApi)
        expect(api.client).toBeInstanceOf(MomeiHttpClient)
    })
})
