import { describe, expect, it } from 'vitest'
import {
    computeAuditMetaCompleteness,
    computeQuickAuditResult,
    type PostAuditQuickInput,
} from './post-audit-quick'
import { AUDIT_SCHEMA_VERSION } from '@/types/post'

const MSG = 'pages.admin.posts.audit.msg'

function createPost(overrides: Partial<PostAuditQuickInput> = {}): PostAuditQuickInput {
    return {
        title: '一个长度理想的标题',
        summary: '摘'.repeat(90),
        coverImage: 'https://cdn.example.com/cover.png',
        tags: [{ id: '1' }, { id: '2' }, { id: '3' }],
        categoryId: 'category-1',
        content: '## 小标题\n\n正文段落内容。',
        ...overrides,
    }
}

describe('computeAuditMetaCompleteness', () => {
    it('元数据齐备时五项均满分', () => {
        const result = computeAuditMetaCompleteness(createPost())

        expect(result.score).toBe(100)
        expect(result.details).toEqual({
            title: { score: 20, key: `${MSG}.title_ideal` },
            summary: { score: 20, key: `${MSG}.summary_detailed` },
            coverImage: { score: 20, key: `${MSG}.cover_image_set` },
            tags: { score: 20, key: `${MSG}.tags_assigned`, params: { count: 3 } },
            category: { score: 20, key: `${MSG}.category_assigned` },
        })
    })

    it('全部缺失时得分为 0 并落到 missing 文案', () => {
        const result = computeAuditMetaCompleteness({
            title: '',
            summary: null,
            coverImage: null,
            tags: null,
            categoryId: null,
        })

        expect(result.score).toBe(0)
        expect(result.details.title.key).toBe(`${MSG}.title_missing`)
        expect(result.details.summary.key).toBe(`${MSG}.summary_missing`)
        expect(result.details.coverImage.key).toBe(`${MSG}.cover_image_missing`)
        expect(result.details.tags.key).toBe(`${MSG}.tags_missing`)
        expect(result.details.category.key).toBe(`${MSG}.category_missing`)
    })

    it.each([
        [3, 18, 'title_slightly_off'],
        [61, 19, 'title_slightly_off'],
        [5, 20, 'title_ideal'],
        [60, 20, 'title_ideal'],
    ])('标题长度 %i 时得分 %i', (length, score, keySuffix) => {
        const result = computeAuditMetaCompleteness(createPost({ title: '标'.repeat(length) }))

        expect(result.details.title.score).toBe(score)
        expect(result.details.title.key).toBe(`${MSG}.${keySuffix}`)
    })

    it.each([
        [5, 10, 'summary_very_brief'],
        [21, 15, 'summary_present_but_short'],
        [81, 20, 'summary_detailed'],
    ])('摘要长度 %i 时得分 %i', (length, score, keySuffix) => {
        const result = computeAuditMetaCompleteness(createPost({ summary: '摘'.repeat(length) }))

        expect(result.details.summary.score).toBe(score)
        expect(result.details.summary.key).toBe(`${MSG}.${keySuffix}`)
    })

    it.each([
        [1, 10, 'tags_few'],
        [2, 10, 'tags_few'],
        [3, 20, 'tags_assigned'],
    ])('标签数量 %i 时得分 %i 且带计数参数', (count, score, keySuffix) => {
        const tags = Array.from({ length: count }, (_, index) => ({ id: String(index) }))
        const result = computeAuditMetaCompleteness(createPost({ tags }))

        expect(result.details.tags.score).toBe(score)
        expect(result.details.tags.key).toBe(`${MSG}.${keySuffix}`)
        expect(result.details.tags.params).toEqual({ count })
    })

    it('缺少封图与分类时各自归零', () => {
        const result = computeAuditMetaCompleteness(createPost({ coverImage: null, categoryId: null }))

        expect(result.details.coverImage).toEqual({ score: 0, key: `${MSG}.cover_image_missing` })
        expect(result.details.category).toEqual({ score: 0, key: `${MSG}.category_missing` })
        expect(result.score).toBe(60)
    })
})

describe('computeQuickAuditResult', () => {
    it('正文为空时可读性取基准 50 并落入待改进档', () => {
        const result = computeQuickAuditResult({
            title: '',
            content: '',
            summary: null,
            coverImage: null,
            tags: null,
            categoryId: null,
        })

        expect(result.readability.score).toBe(50)
        expect(result.readability.suggestions).toEqual([])
        expect(result.score).toBe(25)
        expect(result.tier).toBe('needs_improvement')
        expect(result.version).toBe(AUDIT_SCHEMA_VERSION)
        expect(Number.isNaN(Date.parse(result.cachedAt))).toBe(false)
    })

    it('小标题与短段落都能加分', () => {
        const result = computeQuickAuditResult(createPost({
            content: '## 小标题\n\n一段很短的正文。',
        }))

        expect(result.readability.score).toBe(85)
        expect(result.tier).toBe('good')
    })

    it('段落长度落在中等区间时加 8 分，超过阈值不加分', () => {
        const mediumParagraph = computeQuickAuditResult(createPost({
            content: '字'.repeat(300),
        }))
        const longParagraph = computeQuickAuditResult(createPost({
            content: '字'.repeat(500),
        }))

        expect(mediumParagraph.readability.score).toBe(73)
        expect(longParagraph.readability.score).toBe(65)
    })

    it('代码块、行内代码、图片与链接不计入篇幅', () => {
        const result = computeQuickAuditResult(createPost({
            content: '```ts\nconst a = 1\n```\n\n`inline`\n\n![封面](https://cdn.example.com/a.png)',
        }))

        // 去掉围栏代码 / 行内代码 / 图片后正文几乎为空，只剩下段落结构带来的基本分。
        expect(result.readability.score).toBe(70)
    })

    it('只含图片与链接时不会因为 Markdown 语法长度抬分', () => {
        const withLinks = computeQuickAuditResult(createPost({
            content: `## 标题\n\n${'[链接](https://example.com/a)'.repeat(20)}`,
        }))
        const blank = computeQuickAuditResult(createPost({ content: '## 标题' }))

        expect(withLinks.readability.score).toBe(blank.readability.score)
    })

    it('综合分按元数据与可读性各占一半加权', () => {
        const result = computeQuickAuditResult(createPost())

        expect(result.metaCompleteness.score).toBe(100)
        expect(result.readability.score).toBe(85)
        expect(result.score).toBe(Math.round((100 + 85) / 2))
    })
})
