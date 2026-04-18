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
    it('应按时区窗口聚合当前区间与上一等长区间', () => {
        const posts = [
            createPost({
                id: 'post-current-1',
                title: 'Current One',
                slug: 'current-one',
                views: 120,
                publishedAt: '2026-04-18T10:00:00+08:00',
            }),
            createPost({
                id: 'post-current-2',
                title: 'Current Two',
                slug: 'current-two',
                views: 30,
                publishedAt: '2026-04-13T09:00:00+08:00',
            }),
            createPost({
                id: 'post-previous',
                title: 'Previous One',
                slug: 'previous-one',
                views: 80,
                publishedAt: '2026-04-07T12:00:00+08:00',
            }),
        ]

        const insights = buildAdminContentInsights(posts, {
            'post-current-1': 8,
            'post-current-2': 3,
            'post-previous': 4,
        }, {
            selectedRange: 7,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'zh-CN',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        const sevenDaySummary = insights.summaries.find((item) => item.days === 7)
        const thirtyDaySummary = insights.summaries.find((item) => item.days === 30)

        expect(sevenDaySummary?.metrics.views).toEqual({
            total: 150,
            previousTotal: 80,
            delta: 70,
            deltaRate: 87.5,
        })
        expect(sevenDaySummary?.metrics.comments.total).toBe(11)
        expect(sevenDaySummary?.metrics.posts).toEqual({
            total: 2,
            previousTotal: 1,
            delta: 1,
            deltaRate: 100,
        })
        expect(thirtyDaySummary?.metrics.views.total).toBe(230)
        expect(insights.rankings.posts.map((item) => item.id)).toEqual([
            'post-current-1',
            'post-current-2',
        ])
    })

    it('未指定内容语言时应按代表版本去重，并在指定语言后切换到对应版本', () => {
        const posts = [
            createPost({
                id: 'cluster-zh',
                title: '中文稿',
                slug: 'cluster-post',
                language: 'zh-CN',
                translationId: 'cluster-a',
                views: 50,
            }),
            createPost({
                id: 'cluster-en',
                title: 'English Copy',
                slug: 'cluster-post',
                language: 'en-US',
                translationId: 'cluster-a',
                views: 20,
            }),
            createPost({
                id: 'single-zh',
                title: 'Single Post',
                slug: 'single-post',
                language: 'zh-CN',
                views: 30,
            }),
        ]

        const commentCounts = {
            'cluster-zh': 5,
            'cluster-en': 2,
            'single-zh': 1,
        }

        const dedupedByLocale = buildAdminContentInsights(posts, commentCounts, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'en-US',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        expect(dedupedByLocale.summaries.find((item) => item.days === 30)?.metrics.views.total).toBe(50)
        expect(dedupedByLocale.summaries.find((item) => item.days === 30)?.metrics.posts.total).toBe(2)
        expect(dedupedByLocale.rankings.posts.map((item) => item.id)).toEqual([
            'single-zh',
            'cluster-en',
        ])

        const filteredByLanguage = buildAdminContentInsights(posts, commentCounts, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'en-US',
            contentLanguage: 'zh-CN',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        expect(filteredByLanguage.contentLanguage).toBe('zh-CN')
        expect(filteredByLanguage.summaries.find((item) => item.days === 30)?.metrics.views.total).toBe(80)
        expect(filteredByLanguage.rankings.posts.map((item) => item.id)).toEqual([
            'cluster-zh',
            'single-zh',
        ])
    })

    it('应稳定生成热门文章、标签与分类排行', () => {
        const posts = [
            createPost({
                id: 'alpha',
                title: 'Alpha',
                slug: 'alpha',
                views: 100,
                tags: [{ id: 'tag-1', name: 'One', slug: 'one', language: 'en-US', translationId: 'tag-one' }],
                category: { id: 'cat-a', name: 'Cat A', slug: 'cat-a', language: 'en-US' },
            }),
            createPost({
                id: 'beta',
                title: 'Beta',
                slug: 'beta',
                views: 100,
                tags: [{ id: 'tag-1b', name: 'One', slug: 'one', language: 'en-US', translationId: 'tag-one' }],
                category: { id: 'cat-b', name: 'Cat B', slug: 'cat-b', language: 'en-US' },
            }),
            createPost({
                id: 'gamma',
                title: 'Gamma',
                slug: 'gamma',
                views: 120,
                tags: [{ id: 'tag-2', name: 'Two', slug: 'two', language: 'en-US' }],
                category: { id: 'cat-b', name: 'Cat B', slug: 'cat-b', language: 'en-US' },
            }),
        ]

        const insights = buildAdminContentInsights(posts, {
            alpha: 10,
            beta: 10,
            gamma: 4,
        }, {
            selectedRange: 30,
            scope: 'public',
            timezone: 'Asia/Shanghai',
            preferredLocale: 'en-US',
            baseDate: '2026-04-18T12:00:00+08:00',
        })

        expect(insights.rankings.posts.map((item) => item.id)).toEqual(['gamma', 'alpha', 'beta'])
        expect(insights.rankings.tags.map((item) => item.name)).toEqual(['One', 'Two'])
        expect(insights.rankings.tags[0]).toMatchObject({
            postCount: 2,
            views: 200,
            commentCount: 20,
        })
        expect(insights.rankings.categories.map((item) => item.name)).toEqual(['Cat B', 'Cat A'])
    })
})
