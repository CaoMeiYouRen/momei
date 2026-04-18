import { describe, expect, it } from 'vitest'
import { buildAdminContentInsights, type AdminContentInsightsSourcePost } from './admin-content-insights'
import { PostStatus, PostVisibility } from '@/types/post'

const createPost = (overrides: Partial<AdminContentInsightsSourcePost>): AdminContentInsightsSourcePost => ({
    id: overrides.id || 'post-default',
    title: overrides.title || 'Default Post',
    slug: overrides.slug || 'default-post',
    language: overrides.language || 'zh-CN',
    translationId: overrides.translationId || null,
    status: overrides.status || PostStatus.PUBLISHED,
    visibility: overrides.visibility || PostVisibility.PUBLIC,
    views: overrides.views || 0,
    publishedAt: overrides.publishedAt || '2026-04-18T09:00:00+08:00',
    createdAt: overrides.createdAt || '2026-04-18T08:00:00+08:00',
    category: overrides.category || null,
    tags: overrides.tags || [],
})

describe('buildAdminContentInsights', () => {
    it('应按时区窗口聚合真实阅读、评论和发文事件', () => {
        const posts = [
            createPost({
                id: 'post-current-1',
                title: 'Current One',
                slug: 'current-one',
                publishedAt: '2026-04-18T10:00:00+08:00',
            }),
            createPost({
                id: 'post-current-2',
                title: 'Current Two',
                slug: 'current-two',
                publishedAt: '2026-04-13T09:00:00+08:00',
            }),
            createPost({
                id: 'post-previous',
                title: 'Previous One',
                slug: 'previous-one',
                publishedAt: '2026-04-07T12:00:00+08:00',
            }),
        ]

        const viewEvents = [
            { postId: 'post-current-1', bucketHourUtc: '2026-04-18T02:00:00.000Z', views: 12 },
            { postId: 'post-current-2', bucketHourUtc: '2026-04-13T01:00:00.000Z', views: 3 },
            { postId: 'post-previous', bucketHourUtc: '2026-04-07T04:00:00.000Z', views: 8 },
        ]

        const commentEvents = [
            { postId: 'post-current-1', createdAt: '2026-04-18T03:00:00.000Z' },
            { postId: 'post-current-1', createdAt: '2026-04-18T05:00:00.000Z' },
            { postId: 'post-current-2', createdAt: '2026-04-13T02:00:00.000Z' },
            { postId: 'post-previous', createdAt: '2026-04-07T08:00:00.000Z' },
        ]

        const insights = buildAdminContentInsights(posts, viewEvents, commentEvents, {
            selectedRange: 7,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'zh-CN',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        const sevenDaySummary = insights.summaries.find((item) => item.days === 7)
        const thirtyDaySummary = insights.summaries.find((item) => item.days === 30)

        expect(sevenDaySummary?.metrics.views).toEqual({
            total: 15,
            previousTotal: 8,
            delta: 7,
            deltaRate: 87.5,
        })
        expect(sevenDaySummary?.metrics.comments.total).toBe(3)
        expect(sevenDaySummary?.metrics.posts).toEqual({
            total: 2,
            previousTotal: 1,
            delta: 1,
            deltaRate: 100,
        })
        expect(thirtyDaySummary?.metrics.views.total).toBe(23)
        expect(sevenDaySummary?.trend.find((item) => item.date === '2026-04-18')).toMatchObject({
            views: 12,
            comments: 2,
            posts: 1,
        })
        expect(insights.rankings.posts.map((item) => item.id)).toEqual([
            'post-current-1',
            'post-current-2',
        ])
    })

    it('未指定内容语言时应按代表版本去重并聚合整个翻译簇的事件', () => {
        const posts = [
            createPost({
                id: 'cluster-zh',
                title: '中文稿',
                slug: 'cluster-post',
                language: 'zh-CN',
                translationId: 'cluster-a',
            }),
            createPost({
                id: 'cluster-en',
                title: 'English Copy',
                slug: 'cluster-post',
                language: 'en-US',
                translationId: 'cluster-a',
            }),
            createPost({
                id: 'single-zh',
                title: 'Single Post',
                slug: 'single-post',
                language: 'zh-CN',
            }),
        ]

        const viewEvents = [
            { postId: 'cluster-zh', bucketHourUtc: '2026-04-18T02:00:00.000Z', views: 40 },
            { postId: 'cluster-en', bucketHourUtc: '2026-04-18T03:00:00.000Z', views: 30 },
            { postId: 'single-zh', bucketHourUtc: '2026-04-18T04:00:00.000Z', views: 20 },
        ]

        const commentEvents = [
            { postId: 'cluster-zh', createdAt: '2026-04-18T03:00:00.000Z' },
            { postId: 'cluster-en', createdAt: '2026-04-18T05:00:00.000Z' },
            { postId: 'single-zh', createdAt: '2026-04-18T06:00:00.000Z' },
        ]

        const dedupedByLocale = buildAdminContentInsights(posts, viewEvents, commentEvents, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'en-US',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        expect(dedupedByLocale.summaries.find((item) => item.days === 30)?.metrics.views.total).toBe(90)
        expect(dedupedByLocale.summaries.find((item) => item.days === 30)?.metrics.posts.total).toBe(2)
        expect(dedupedByLocale.rankings.posts.map((item) => item.id)).toEqual([
            'cluster-en',
            'single-zh',
        ])
        expect(dedupedByLocale.rankings.posts[0]).toMatchObject({
            views: 70,
            commentCount: 2,
        })

        const filteredByLanguage = buildAdminContentInsights(posts, viewEvents, commentEvents, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'en-US',
            contentLanguage: 'zh-CN',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        expect(filteredByLanguage.contentLanguage).toBe('zh-CN')
        expect(filteredByLanguage.summaries.find((item) => item.days === 30)?.metrics.views.total).toBe(60)
        expect(filteredByLanguage.rankings.posts.map((item) => item.id)).toEqual([
            'cluster-zh',
            'single-zh',
        ])
    })

    it('应按请求时区折叠小时桶并稳定生成排行', () => {
        const posts = [
            createPost({
                id: 'alpha',
                title: 'Alpha',
                slug: 'alpha',
                tags: [{ id: 'tag-1', name: 'One', slug: 'one', language: 'en-US', translationId: 'tag-one' }],
                category: { id: 'cat-a', name: 'Cat A', slug: 'cat-a', language: 'en-US' },
                publishedAt: '2026-04-18T09:00:00+09:00',
            }),
            createPost({
                id: 'beta',
                title: 'Beta',
                slug: 'beta',
                tags: [{ id: 'tag-1b', name: 'One', slug: 'one', language: 'en-US', translationId: 'tag-one' }],
                category: { id: 'cat-b', name: 'Cat B', slug: 'cat-b', language: 'en-US' },
                publishedAt: '2026-04-17T09:00:00+09:00',
            }),
            createPost({
                id: 'gamma',
                title: 'Gamma',
                slug: 'gamma',
                tags: [{ id: 'tag-2', name: 'Two', slug: 'two', language: 'en-US' }],
                category: { id: 'cat-b', name: 'Cat B', slug: 'cat-b', language: 'en-US' },
            }),
        ]

        const viewEvents = [
            { postId: 'alpha', bucketHourUtc: '2026-04-17T15:00:00.000Z', views: 8 },
            { postId: 'beta', bucketHourUtc: '2026-04-18T01:00:00.000Z', views: 8 },
            { postId: 'gamma', bucketHourUtc: '2026-04-18T03:00:00.000Z', views: 12 },
        ]

        const commentEvents = [
            { postId: 'alpha', createdAt: '2026-04-18T00:30:00.000Z' },
            { postId: 'alpha', createdAt: '2026-04-18T00:45:00.000Z' },
            { postId: 'beta', createdAt: '2026-04-18T02:00:00.000Z' },
            { postId: 'gamma', createdAt: '2026-04-18T04:00:00.000Z' },
        ]

        const insights = buildAdminContentInsights(posts, viewEvents, commentEvents, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Tokyo',
            preferredLocale: 'en-US',
            baseDate: '2026-04-18T12:00:00+09:00',
        })

        expect(insights.rankings.posts.map((item) => item.id)).toEqual(['gamma', 'alpha', 'beta'])
        expect(insights.rankings.tags.map((item) => item.name)).toEqual(['One', 'Two'])
        expect(insights.rankings.tags[0]).toMatchObject({
            postCount: 2,
            views: 16,
            commentCount: 3,
        })
        expect(insights.rankings.categories.map((item) => item.name)).toEqual(['Cat B', 'Cat A'])
        expect(insights.summaries.find((item) => item.days === 30)?.trend.find((item) => item.date === '2026-04-18')).toMatchObject({
            views: 28,
            comments: 4,
            posts: 2,
        })
    })
})
