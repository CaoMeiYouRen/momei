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
})
