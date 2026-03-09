import { describe, expect, it } from 'vitest'
import { buildLocalizedSitemapEntries, buildStaticSitemapEntries } from './sitemap'

describe('server/utils/sitemap', () => {
    it('should build localized static sitemap entries with alternates', () => {
        const entries = buildStaticSitemapEntries(
            [
                { path: '/' },
                { path: '/archives' },
            ],
            'https://momei.app',
        )

        expect(entries).toHaveLength(4)
        expect(entries[0]?.loc).toBe('https://momei.app/')
        expect(entries[1]?.loc).toBe('https://momei.app/en-US/')
        expect(entries[2]?.loc).toBe('https://momei.app/archives')
        expect(entries[3]?.loc).toBe('https://momei.app/en-US/archives')
        expect(entries[0]?.alternatives).toEqual([
            { hreflang: 'zh-CN', href: 'https://momei.app/' },
            { hreflang: 'en-US', href: 'https://momei.app/en-US/' },
        ])
    })

    it('should build sitemap entries with locale alternates for translation groups', () => {
        const entries = buildLocalizedSitemapEntries(
            [
                {
                    id: '1',
                    slug: 'nuxt-seo',
                    language: 'zh-CN',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-08T00:00:00.000Z'),
                },
                {
                    id: '2',
                    slug: 'nuxt-seo',
                    language: 'en-US',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-09T00:00:00.000Z'),
                },
                {
                    id: '3',
                    slug: 'seo-fr',
                    language: 'fr-FR',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-10T00:00:00.000Z'),
                },
            ],
            'https://momei.app',
            (item) => `/posts/${item.slug}`,
        )

        expect(entries).toHaveLength(2)
        expect(entries[0]?.loc).toBe('https://momei.app/posts/nuxt-seo')
        expect(entries[1]?.loc).toBe('https://momei.app/en-US/posts/nuxt-seo')
        expect(entries[0]?.alternatives).toEqual([
            { hreflang: 'zh-CN', href: 'https://momei.app/posts/nuxt-seo' },
            { hreflang: 'en-US', href: 'https://momei.app/en-US/posts/nuxt-seo' },
        ])
    })

    it('should keep standalone entries without alternates', () => {
        const entries = buildLocalizedSitemapEntries(
            [
                {
                    id: 'category-1',
                    slug: 'nuxt',
                    language: 'zh-CN',
                    translationId: null,
                    updatedAt: new Date('2026-03-08T00:00:00.000Z'),
                },
            ],
            'https://momei.app',
            (item) => `/categories/${item.slug}`,
        )

        expect(entries).toEqual([
            {
                loc: 'https://momei.app/categories/nuxt',
                lastmod: new Date('2026-03-08T00:00:00.000Z'),
                alternatives: undefined,
            },
        ])
    })
})
