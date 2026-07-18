import { beforeEach, describe, expect, it, vi } from 'vitest'

const validateApiKeyRequest = vi.fn()
const createPostService = vi.fn()
const validateImportPathAliases = vi.fn()

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest,
}))

vi.mock('@/server/services/post', () => ({
    createPostService,
}))

vi.mock('@/server/services/import-path-alias', () => ({
    validateImportPathAliases,
}))

describe('external posts import api', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateApiKeyRequest.mockResolvedValue({
            user: {
                id: 'user-1',
                role: 'admin',
            },
        })
    })

    it('returns the path alias validation report from the validate endpoint', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: 'hexo-post',
            canonicalSource: 'slug',
            canImport: true,
            requiresConfirmation: false,
            hasBlockingIssues: false,
            summary: {
                accepted: 2,
                fallback: 0,
                repaired: 0,
                invalid: 0,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        const handler = (await import('@/server/api/external/posts/validate.post')).default
        const result = await handler({
            body: {
                title: 'Hexo Post',
                content: 'body',
                slug: 'hexo-post',
            },
        } as never)

        expect(validateImportPathAliases).toHaveBeenCalledWith(expect.objectContaining({ slug: 'hexo-post' }))
        expect(result.code).toBe(200)
        expect(result.data.canonicalSlug).toBe('hexo-post')
    })

    it('requires a valid api key for the validate endpoint', async () => {
        validateApiKeyRequest.mockRejectedValue(new Error('Unauthorized'))

        const handler = (await import('@/server/api/external/posts/validate.post')).default

        await expect(handler({
            body: {
                title: 'Hexo Post',
                content: 'body',
                slug: 'hexo-post',
            },
        } as never)).rejects.toThrow('Unauthorized')

        expect(validateImportPathAliases).not.toHaveBeenCalled()
    })

    it('rejects invalid body for the validate endpoint before alias validation', async () => {
        const handler = (await import('@/server/api/external/posts/validate.post')).default

        await expect(handler({
            body: {
                title: 'Missing Content',
            },
        } as never)).rejects.toThrow()

        expect(validateImportPathAliases).not.toHaveBeenCalled()
    })

    it('propagates validate endpoint alias validation service errors', async () => {
        validateImportPathAliases.mockRejectedValue(new Error('validation service unavailable'))

        const handler = (await import('@/server/api/external/posts/validate.post')).default

        await expect(handler({
            body: {
                title: 'Hexo Post',
                content: 'body',
                slug: 'hexo-post',
            },
        } as never)).rejects.toThrow('validation service unavailable')
    })

    it('uses the validated fallback slug when confirmation is explicitly provided', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: 'about-post',
            canonicalSource: 'fallback',
            canImport: true,
            requiresConfirmation: true,
            hasBlockingIssues: false,
            summary: {
                accepted: 1,
                fallback: 1,
                repaired: 0,
                invalid: 1,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        createPostService.mockResolvedValue({ id: 'post-1', slug: 'about-post' })

        const handler = (await import('@/server/api/external/posts.post')).default
        const result = await handler({
            body: {
                title: 'About Post',
                content: 'body',
                slug: 'about',
                abbrlink: 'about-post',
                confirmPathAliases: true,
            },
        } as never)

        expect(createPostService).toHaveBeenCalledWith(expect.objectContaining({
            slug: 'about-post',
            title: 'About Post',
        }), 'user-1', expect.any(Object))
        expect(result.data.url).toContain('/posts/about-post')
    })

    it('falls back to request slug when canonicalSlug is missing', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: null,
            canonicalSource: null,
            canImport: true,
            requiresConfirmation: false,
            hasBlockingIssues: false,
            summary: {
                accepted: 1,
                fallback: 0,
                repaired: 0,
                invalid: 0,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        createPostService.mockResolvedValue({ id: 'post-2', slug: 'request-slug' })

        const handler = (await import('@/server/api/external/posts.post')).default
        await handler({
            body: {
                title: 'Request Slug',
                content: 'body',
                slug: 'request-slug',
                sourceFile: 'posts/request-slug.md',
            },
        } as never)

        expect(createPostService).toHaveBeenCalledWith(expect.objectContaining({
            slug: 'request-slug',
        }), 'user-1', expect.any(Object))
    })

    it('normalizes updated/view aliases and forwards them to createPostService', async () => {
        createPostService.mockResolvedValue({ id: 'post-legacy', slug: 'legacy-post' })

        const handler = (await import('@/server/api/external/posts.post')).default
        await handler({
            body: {
                title: 'Legacy Metadata',
                content: 'body',
                updated: '2024-03-01T10:20:30.000Z',
                view: '9',
                disableComment: true,
            },
        } as never)

        expect(createPostService).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Legacy Metadata',
            views: 9,
            updatedAt: expect.any(Date),
        }), 'user-1', expect.any(Object))

        const [createInput] = createPostService.mock.calls[0] as [{ updatedAt?: Date }]
        expect(createInput.updatedAt?.toISOString()).toBe('2024-03-01T10:20:30.000Z')
    })

    it('rejects imports that still require confirmation', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: 'about-post',
            canonicalSource: 'fallback',
            canImport: true,
            requiresConfirmation: true,
            hasBlockingIssues: false,
            summary: {
                accepted: 1,
                fallback: 1,
                repaired: 0,
                invalid: 1,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        const handler = (await import('@/server/api/external/posts.post')).default

        await expect(handler({
            body: {
                title: 'About Post',
                content: 'body',
                slug: 'about',
                abbrlink: 'about-post',
            },
        } as never)).rejects.toThrow('Import path aliases require confirmation')
    })

    it('rejects imports when alias validation reports blocking issues', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: 'about-post',
            canonicalSource: 'slug',
            canImport: true,
            requiresConfirmation: false,
            hasBlockingIssues: true,
            summary: {
                accepted: 0,
                fallback: 0,
                repaired: 0,
                invalid: 1,
                conflict: 1,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        const handler = (await import('@/server/api/external/posts.post')).default

        await expect(handler({
            body: {
                title: 'About Post',
                content: 'body',
                slug: 'about-post',
            },
        } as never)).rejects.toThrow('Import path alias validation failed')

        expect(createPostService).not.toHaveBeenCalled()
    })

    it('rejects imports when alias validation disallows importing', async () => {
        validateImportPathAliases.mockResolvedValue({
            language: 'zh-CN',
            canonicalSlug: 'about-post',
            canonicalSource: 'slug',
            canImport: false,
            requiresConfirmation: false,
            hasBlockingIssues: false,
            summary: {
                accepted: 0,
                fallback: 0,
                repaired: 0,
                invalid: 1,
                conflict: 0,
                'needs-confirmation': 0,
                skipped: 0,
            },
            items: [],
        })

        const handler = (await import('@/server/api/external/posts.post')).default

        await expect(handler({
            body: {
                title: 'About Post',
                content: 'body',
                slug: 'about-post',
            },
        } as never)).rejects.toThrow('Import path alias validation failed')

        expect(createPostService).not.toHaveBeenCalled()
    })

    it('rejects invalid legacy view alias payload before createPostService', async () => {
        const handler = (await import('@/server/api/external/posts.post')).default

        await expect(handler({
            body: {
                title: 'Invalid Views',
                content: 'body',
                view: '-1',
            },
        } as never)).rejects.toThrow()

        expect(createPostService).not.toHaveBeenCalled()
    })

    it('propagates createPostService failures', async () => {
        createPostService.mockRejectedValue(new Error('database unavailable'))

        const handler = (await import('@/server/api/external/posts.post')).default

        await expect(handler({
            body: {
                title: 'Broken Create',
                content: 'body',
            },
        } as never)).rejects.toThrow('database unavailable')
    })
})
