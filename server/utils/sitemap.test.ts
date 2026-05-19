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

        expect(entries).toHaveLength(10)
        expect(entries[0]?.loc).toBe('https://momei.app/')
        expect(entries[1]?.loc).toBe('https://momei.app/zh-TW/')
        expect(entries[2]?.loc).toBe('https://momei.app/en-US/')
        expect(entries[3]?.loc).toBe('https://momei.app/ko-KR/')
        expect(entries[4]?.loc).toBe('https://momei.app/ja-JP/')
        expect(entries[5]?.loc).toBe('https://momei.app/archives')
        expect(entries[6]?.loc).toBe('https://momei.app/zh-TW/archives')
        expect(entries[7]?.loc).toBe('https://momei.app/en-US/archives')
        expect(entries[8]?.loc).toBe('https://momei.app/ko-KR/archives')
        expect(entries[9]?.loc).toBe('https://momei.app/ja-JP/archives')
        expect(entries[0]?.alternatives).toEqual([
            { hreflang: 'zh-CN', href: 'https://momei.app/' },
            { hreflang: 'zh-TW', href: 'https://momei.app/zh-TW/' },
            { hreflang: 'en-US', href: 'https://momei.app/en-US/' },
            { hreflang: 'ko-KR', href: 'https://momei.app/ko-KR/' },
            { hreflang: 'ja-JP', href: 'https://momei.app/ja-JP/' },
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
                    language: 'zh-TW',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-09T00:00:00.000Z'),
                },
                {
                    id: '3',
                    slug: 'nuxt-seo',
                    language: 'en-US',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-10T00:00:00.000Z'),
                },
                {
                    id: '4',
                    slug: 'nuxt-seo',
                    language: 'ko-KR',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-11T00:00:00.000Z'),
                },
                {
                    id: '5',
                    slug: 'nuxt-seo',
                    language: 'ja-JP',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-12T00:00:00.000Z'),
                },
                {
                    id: '6',
                    slug: 'seo-fr',
                    language: 'fr-FR',
                    translationId: 'post-1',
                    updatedAt: new Date('2026-03-13T00:00:00.000Z'),
                },
            ],
            'https://momei.app',
            (item) => `/posts/${item.slug}`,
        )

        expect(entries).toHaveLength(5)
        expect(entries[0]?.loc).toBe('https://momei.app/posts/nuxt-seo')
        expect(entries[1]?.loc).toBe('https://momei.app/zh-TW/posts/nuxt-seo')
        expect(entries[2]?.loc).toBe('https://momei.app/en-US/posts/nuxt-seo')
        expect(entries[3]?.loc).toBe('https://momei.app/ko-KR/posts/nuxt-seo')
        expect(entries[4]?.loc).toBe('https://momei.app/ja-JP/posts/nuxt-seo')
        expect(entries[0]?.alternatives).toEqual([
            { hreflang: 'zh-CN', href: 'https://momei.app/posts/nuxt-seo' },
            { hreflang: 'zh-TW', href: 'https://momei.app/zh-TW/posts/nuxt-seo' },
            { hreflang: 'en-US', href: 'https://momei.app/en-US/posts/nuxt-seo' },
            { hreflang: 'ko-KR', href: 'https://momei.app/ko-KR/posts/nuxt-seo' },
            { hreflang: 'ja-JP', href: 'https://momei.app/ja-JP/posts/nuxt-seo' },
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
