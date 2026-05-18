import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
    function createQueryBuilder() {
        const queryBuilder = {
            select: vi.fn(),
            leftJoin: vi.fn(),
            addSelect: vi.fn(),
            andWhere: vi.fn(),
            innerJoin: vi.fn(),
            orderBy: vi.fn(),
            take: vi.fn(),
            getMany: vi.fn(),
        }

        queryBuilder.select.mockReturnValue(queryBuilder)
        queryBuilder.leftJoin.mockReturnValue(queryBuilder)
        queryBuilder.addSelect.mockReturnValue(queryBuilder)
        queryBuilder.andWhere.mockReturnValue(queryBuilder)
        queryBuilder.innerJoin.mockReturnValue(queryBuilder)
        queryBuilder.orderBy.mockReturnValue(queryBuilder)
        queryBuilder.take.mockReturnValue(queryBuilder)
        queryBuilder.getMany.mockResolvedValue([])

        return queryBuilder
    }

    return {
        createQueryBuilder,
        queryBuilder: createQueryBuilder(),
        mockGetRepository: vi.fn(),
        mockApplyPostVisibilityFilter: vi.fn((qb: unknown) => qb),
        mockApplyPostsReadModelFromMetadata: vi.fn(),
        mockT: vi.fn((key: string) => key),
        mockGetLocale: vi.fn(() => 'en-US'),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: hoisted.mockGetRepository,
    },
}))

vi.mock('./post-access', () => ({
    applyPostVisibilityFilter: hoisted.mockApplyPostVisibilityFilter,
}))

vi.mock('./post-metadata', () => ({
    applyPostsReadModelFromMetadata: hoisted.mockApplyPostsReadModelFromMetadata,
}))

vi.mock('./i18n', () => ({
    t: hoisted.mockT,
    getLocale: hoisted.mockGetLocale,
}))

vi.mock('feed', () => ({
    Feed: class MockFeed {
        options: Record<string, unknown>
        items: unknown[] = []

        constructor(options: Record<string, unknown>) {
            this.options = options
        }

        addItem(item: unknown) {
            this.items.push(item)
        }

        rss2() {
            return '<rss />'
        }

        atom1() {
            return '<atom />'
        }

        json1() {
            return '{"version":"https://jsonfeed.org/version/1"}'
        }
    },
}))

vi.mock('markdown-it', () => ({
    default: class MockMarkdownIt {
        use() {
            return this
        }

        render(value: string) {
            return value
        }
    },
}))

vi.mock('markdown-it-anchor', () => ({
    default: {
        permalink: {
            headerLink: vi.fn(() => undefined),
        },
    },
}))

vi.mock('@/i18n/config/locale-registry', () => ({
    getLocaleRoutePrefix: vi.fn((language: string) => language === 'zh-CN' ? '' : `/${language}`),
}))

vi.mock('@/utils/shared/seo', () => ({
    buildAbsoluteUrl: vi.fn((siteUrl: string, path: string) => `${siteUrl}${path}`),
}))

vi.mock('@/utils/shared/citable-content', () => ({
    resolveCitableExcerpt: vi.fn(() => 'excerpt'),
}))

import { generateFeed } from './feed'

describe('server/utils/feed query shape', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: {
                appName: '墨梅博客',
                siteDescription: 'Mock description',
                siteUrl: 'https://momei.app',
            },
        }))

        hoisted.queryBuilder = hoisted.createQueryBuilder()
        hoisted.mockGetRepository.mockReturnValue({
            createQueryBuilder: vi.fn(() => hoisted.queryBuilder),
        })
        hoisted.mockApplyPostVisibilityFilter.mockImplementation((qb: unknown) => qb)
        hoisted.mockT.mockImplementation((key: string) => key)
        hoisted.mockGetLocale.mockReturnValue('en-US')
    })

    it('reuses the narrowed post list select for the default public feed query', async () => {
        await generateFeed({
            context: {},
            path: '/feed.xml',
        } as never, { language: 'en-US' })

        const leftJoinCalls = hoisted.queryBuilder.leftJoin.mock.calls
        const addSelectCalls = hoisted.queryBuilder.addSelect.mock.calls.map((call) => call[0] as string[])

        expect(leftJoinCalls).toContainEqual(['post.author', 'author'])
        expect(leftJoinCalls).toContainEqual(['post.category', 'category'])
        expect(leftJoinCalls).not.toContainEqual(['post.tags', 'tags'])
        expect(addSelectCalls).toContainEqual(['author.id', 'author.name', 'author.image'])
        expect(addSelectCalls).toContainEqual(['category.id', 'category.name', 'category.slug'])
        expect(addSelectCalls).toContainEqual(['post.content'])
        expect(addSelectCalls.some((fields) => fields.includes('author.email'))).toBe(false)
        expect(hoisted.queryBuilder.innerJoin).not.toHaveBeenCalled()
        expect(hoisted.mockApplyPostVisibilityFilter).toHaveBeenCalledWith(hoisted.queryBuilder, undefined, 'feed')
    })

    it('filters scoped category feeds by categoryId without adding extra tag joins', async () => {
        await generateFeed({
            context: {},
            path: '/feed/category/rss-tech.xml',
        } as never, {
            categoryId: 'category-1',
            language: 'en-US',
        })

        expect(hoisted.queryBuilder.andWhere).toHaveBeenCalledWith('post.categoryId = :categoryId', {
            categoryId: 'category-1',
        })
        expect(hoisted.queryBuilder.leftJoin).not.toContainEqual(['post.tags', 'tags'])
    })

    it('adds a filter-only tag join for scoped tag feeds', async () => {
        await generateFeed({
            context: {},
            path: '/feed/tag/feed-tag.xml',
        } as never, {
            language: 'en-US',
            tagId: 'tag-1',
        })

        expect(hoisted.queryBuilder.innerJoin).toHaveBeenCalledWith(
            'post.tags',
            'filterTag',
            'filterTag.id = :tagId',
            { tagId: 'tag-1' },
        )
        expect(hoisted.queryBuilder.leftJoin).not.toContainEqual(['post.tags', 'tags'])
    })
})
