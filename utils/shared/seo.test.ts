import { describe, expect, it } from 'vitest'
import {
    buildAbsoluteUrl,
    buildBlogPostingStructuredData,
    buildCollectionPageStructuredData,
    buildWebsiteStructuredData,
    resolveSeoImageUrl,
} from './seo'

describe('utils/shared/seo', () => {
    it('should build absolute urls from site url and route path', () => {
        expect(buildAbsoluteUrl('https://momei.app', '/en-US/posts/test-post?page=2')).toBe('https://momei.app/en-US/posts/test-post?page=2')
        expect(buildAbsoluteUrl('https://momei.app/', 'posts/test-post')).toBe('https://momei.app/posts/test-post')
    })

    it('should resolve seo image urls for relative and absolute values', () => {
        expect(resolveSeoImageUrl('https://momei.app', '/cover.png')).toBe('https://momei.app/cover.png')
        expect(resolveSeoImageUrl('https://momei.app', 'https://cdn.example.com/cover.png')).toBe('https://cdn.example.com/cover.png')
        expect(resolveSeoImageUrl('https://momei.app', null)).toBeNull()
    })

    it('should build website and collection structured data', () => {
        const website = buildWebsiteStructuredData({
            url: 'https://momei.app/',
            siteUrl: 'https://momei.app/',
            name: '墨梅博客',
            description: '站点描述',
            inLanguage: 'zh-CN',
            image: 'https://momei.app/logo.png',
        })

        const collection = buildCollectionPageStructuredData({
            url: 'https://momei.app/categories/nuxt',
            siteUrl: 'https://momei.app/',
            name: 'Nuxt 分类',
            description: 'Nuxt 分类描述',
            inLanguage: 'zh-CN',
        })

        expect(website['@type']).toBe('WebSite')
        expect(website.inLanguage).toBe('zh-CN')
        expect(collection['@type']).toBe('CollectionPage')
        expect(collection.url).toBe('https://momei.app/categories/nuxt')
    })

    it('should build blog posting structured data with seo fields', () => {
        const article = buildBlogPostingStructuredData({
            url: 'https://momei.app/posts/test-post',
            siteUrl: 'https://momei.app/',
            headline: '测试文章',
            description: '测试摘要',
            inLanguage: 'zh-CN',
            publisherName: '墨梅博客',
            authorName: '作者',
            image: 'https://momei.app/cover.png',
            publishedAt: '2026-03-08T00:00:00.000Z',
            updatedAt: '2026-03-09T00:00:00.000Z',
            section: 'Nuxt',
            tags: ['Nuxt', 'SEO'],
        })

        expect(article['@type']).toBe('BlogPosting')
        expect(article.headline).toBe('测试文章')
        expect(article.articleSection).toBe('Nuxt')
        expect(article.keywords).toBe('Nuxt, SEO')
        expect(article.datePublished).toBe('2026-03-08T00:00:00.000Z')
        expect(article.dateModified).toBe('2026-03-09T00:00:00.000Z')
    })
})
