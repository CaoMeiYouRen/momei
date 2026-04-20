import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
    mockSetHeader: vi.fn(),
    mockBuildLlmsDocument: vi.fn(() => '# 墨梅博客\n'),
    mockFetchPublishedLlmsPosts: vi.fn(),
}))

vi.mock('@/server/utils/llms', () => ({
    buildLlmsDocument: hoisted.mockBuildLlmsDocument,
    fetchPublishedLlmsPosts: hoisted.mockFetchPublishedLlmsPosts,
}))

describe('AI discovery routes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
        vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
        vi.stubGlobal('setHeader', hoisted.mockSetHeader)
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: {
                siteUrl: 'https://momei.app',
                appName: '墨梅博客',
            },
        }))

        hoisted.mockFetchPublishedLlmsPosts.mockResolvedValue([
            {
                title: 'Nuxt GEO Guide',
                slug: 'nuxt-geo-guide',
                language: 'en-US',
                summary: 'AI crawler visibility guide.',
            },
        ])
    })

    it('renders robots with sitemap and llms discovery hints', async () => {
        const event = {}
        const { default: handler } = await import('./robots.txt')
        const result = handler(event as never)

        expect(hoisted.mockSetHeader).toHaveBeenCalledWith(event, 'Content-Type', 'text/plain; charset=utf-8')
        expect(result).toContain('Allow: /llms.txt')
        expect(result).toContain('Allow: /llms-full.txt')
        expect(result).toContain('# llms: https://momei.app/llms.txt')
        expect(result).toContain('Sitemap: https://momei.app/sitemap.xml')
    })

    it('renders concise llms markdown index', async () => {
        const event = {}
        const { default: handler } = await import('./llms.txt')
        const result = await handler(event as never)

        expect(hoisted.mockFetchPublishedLlmsPosts).toHaveBeenCalledWith(12)
        expect(hoisted.mockBuildLlmsDocument).toHaveBeenCalledWith(expect.objectContaining({
            siteUrl: 'https://momei.app',
            appName: '墨梅博客',
            posts: expect.any(Array),
        }))
        expect(hoisted.mockSetHeader).toHaveBeenCalledWith(event, 'Content-Type', 'text/markdown; charset=utf-8')
        expect(result).toBe('# 墨梅博客\n')
    })

    it('renders expanded llms markdown index', async () => {
        const event = {}
        const { default: handler } = await import('./llms-full.txt')
        const result = await handler(event as never)

        expect(hoisted.mockFetchPublishedLlmsPosts).toHaveBeenCalledWith(80)
        expect(hoisted.mockBuildLlmsDocument).toHaveBeenCalledWith(expect.objectContaining({
            siteUrl: 'https://momei.app',
            appName: '墨梅博客',
            full: true,
            posts: expect.any(Array),
        }))
        expect(hoisted.mockSetHeader).toHaveBeenCalledWith(event, 'Content-Type', 'text/markdown; charset=utf-8')
        expect(result).toBe('# 墨梅博客\n')
    })
})
