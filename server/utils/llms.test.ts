import { describe, expect, it } from 'vitest'
import { buildLlmsDocument, buildLocalizedPostUrl } from './llms'

describe('server/utils/llms', () => {
    it('builds localized llms post urls', () => {
        expect(buildLocalizedPostUrl('https://momei.app', 'zh-CN', 'nuxt-seo')).toBe('https://momei.app/posts/nuxt-seo')
        expect(buildLocalizedPostUrl('https://momei.app', 'en-US', 'nuxt-seo')).toBe('https://momei.app/en-US/posts/nuxt-seo')
        expect(buildLocalizedPostUrl('https://momei.app', 'ja-JP', 'nuxt-seo')).toBe('https://momei.app/ja-JP/posts/nuxt-seo')
    })

    it('builds a concise llms index with core resources and recent posts', () => {
        const document = buildLlmsDocument({
            siteUrl: 'https://momei.app',
            appName: '墨梅博客',
            description: 'AI-first developer blog.',
            generatedAt: new Date('2026-04-20T00:00:00.000Z'),
            posts: [
                {
                    title: 'Nuxt GEO Guide',
                    slug: 'nuxt-geo-guide',
                    language: 'en-US',
                    summary: 'A concise guide for improving AI crawler visibility and structured data quality.',
                    publishedAt: '2026-04-18T00:00:00.000Z',
                },
            ],
        })

        expect(document).toContain('# 墨梅博客')
        expect(document).toContain('- Sitemap: https://momei.app/sitemap.xml')
        expect(document).toContain('- Full Index: https://momei.app/llms-full.txt')
        expect(document).toContain('### [en-US] Nuxt GEO Guide')
        expect(document).toContain('- URL: https://momei.app/en-US/posts/nuxt-geo-guide')
    })

    it('builds a full llms index with fallback summary, category and tags', () => {
        const document = buildLlmsDocument({
            siteUrl: 'https://momei.app',
            appName: '墨梅博客',
            description: '',
            full: true,
            generatedAt: new Date('2026-04-20T00:00:00.000Z'),
            posts: [
                {
                    title: 'GEO FAQ Overview',
                    slug: 'geo-faq-overview',
                    language: 'zh-CN',
                    content: '# GEO FAQ\n\nGEO improves how AI systems discover, parse, and cite public content.',
                    category: {
                        name: 'SEO',
                        slug: 'seo',
                    },
                    tags: [
                        { name: 'GEO', slug: 'geo' },
                        { name: 'AI Crawler', slug: 'ai-crawler' },
                    ],
                },
            ],
        })

        expect(document).toContain('## Published Posts')
        expect(document).toContain('- Summary: GEO FAQ GEO improves how AI systems discover, parse, and cite public content.')
        expect(document).toContain('- Category: SEO')
        expect(document).toContain('- Tags: GEO, AI Crawler')
    })
})
