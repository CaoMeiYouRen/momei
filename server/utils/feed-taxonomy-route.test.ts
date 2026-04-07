import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { createTaxonomyFeedRoute, parseScopedFeedRequest, buildTaxonomyFeedTitle } from './feed-taxonomy-route'
import { dataSource } from '@/server/database'
import { generateFeed, getFeedLanguage } from '@/server/utils/feed'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/feed', () => ({
    generateFeed: vi.fn(),
    getFeedLanguage: vi.fn(),
}))

describe('server/utils/feed-taxonomy-route', () => {
    const mockRepository = {
        findOne: vi.fn(),
    }
    const mockGetRouterParam = vi.fn()
    const mockAppendHeader = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
        vi.stubGlobal('getRouterParam', mockGetRouterParam)
        vi.stubGlobal('appendHeader', mockAppendHeader)
        vi.stubGlobal('createError', vi.fn((options: Record<string, unknown>) => Object.assign(new Error(String(options.statusMessage)), options)))

        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepository as never)
        vi.mocked(getFeedLanguage).mockReturnValue('zh-CN')
    })

    it('parses atom and json suffixes into feed metadata', () => {
        expect(parseScopedFeedRequest('tech.atom')).toEqual({
            contentType: 'application/atom+xml',
            format: 'atom1',
            slug: 'tech',
        })

        expect(parseScopedFeedRequest('feed-tag.json')).toEqual({
            contentType: 'application/feed+json',
            format: 'json1',
            slug: 'feed-tag',
        })
    })

    it('decodes slugs and defaults xml requests to rss2', () => {
        expect(parseScopedFeedRequest('hello%20world.xml')).toEqual({
            contentType: 'application/xml',
            format: 'rss2',
            slug: 'hello world',
        })
    })

    it('builds localized taxonomy feed titles', () => {
        expect(buildTaxonomyFeedTitle('zh-CN', '技术', { default: 'Category', zhCN: '分类' })).toBe('分类: 技术')
        expect(buildTaxonomyFeedTitle('en-US', 'Guides', { default: 'Category', zhCN: '分类' })).toBe('Category: Guides')
    })

    it('creates a category handler that loads the item and returns atom feed output', async () => {
        const atomFeed = vi.fn(() => '<atom />')
        vi.mocked(generateFeed).mockResolvedValue({
            atom1: atomFeed,
            json1: vi.fn(),
            rss2: vi.fn(),
        } as never)
        mockGetRouterParam.mockReturnValue('rss-tech.atom')
        mockRepository.findOne.mockResolvedValue({
            id: 'category-1',
            language: 'zh-CN',
            name: '技术',
            slug: 'rss-tech',
        })

        const handler = createTaxonomyFeedRoute({
            entity: 'CategoryEntity',
            feedFilterKey: 'categoryId',
            labels: { default: 'Category', zhCN: '分类' },
            missingSlugMessage: 'Category slug is required',
            notFoundMessage: 'Category not found',
        })

        const event = {} as H3Event
        const result = await handler(event)

        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: {
                language: 'zh-CN',
                slug: 'rss-tech',
            },
        })
        expect(generateFeed).toHaveBeenCalledWith(event, {
            categoryId: 'category-1',
            language: 'zh-CN',
            titleSuffix: '分类: 技术',
        })
        expect(mockAppendHeader).toHaveBeenCalledWith(event, 'Content-Type', 'application/atom+xml')
        expect(atomFeed).toHaveBeenCalled()
        expect(result).toBe('<atom />')
    })

    it('creates a tag handler that returns json feed output', async () => {
        const jsonFeed = vi.fn(() => '{"version":"https://jsonfeed.org/version/1.1"}')
        vi.mocked(generateFeed).mockResolvedValue({
            atom1: vi.fn(),
            json1: jsonFeed,
            rss2: vi.fn(),
        } as never)
        vi.mocked(getFeedLanguage).mockReturnValue('en-US')
        mockGetRouterParam.mockReturnValue('feed-tag.json')
        mockRepository.findOne.mockResolvedValue({
            id: 'tag-1',
            language: 'en-US',
            name: 'Feed Tag',
            slug: 'feed-tag',
        })

        const handler = createTaxonomyFeedRoute({
            entity: 'TagEntity',
            feedFilterKey: 'tagId',
            labels: { default: 'Tag', zhCN: '标签' },
            missingSlugMessage: 'Tag slug is required',
            notFoundMessage: 'Tag not found',
        })

        const event = {} as H3Event
        const result = await handler(event)

        expect(generateFeed).toHaveBeenCalledWith(event, {
            tagId: 'tag-1',
            language: 'en-US',
            titleSuffix: 'Tag: Feed Tag',
        })
        expect(mockAppendHeader).toHaveBeenCalledWith(event, 'Content-Type', 'application/feed+json')
        expect(result).toBe('{"version":"https://jsonfeed.org/version/1.1"}')
    })

    it('throws a 404 error when the taxonomy item is missing', async () => {
        mockGetRouterParam.mockReturnValue('missing-tag.json')
        mockRepository.findOne.mockResolvedValue(null)

        const handler = createTaxonomyFeedRoute({
            entity: 'TagEntity',
            feedFilterKey: 'tagId',
            labels: { default: 'Tag', zhCN: '标签' },
            missingSlugMessage: 'Tag slug is required',
            notFoundMessage: 'Tag not found',
        })

        await expect(handler({} as H3Event)).rejects.toMatchObject({
            statusCode: 404,
            statusMessage: 'Tag not found',
        })
    })

    it('throws a 400 error when the decoded slug is empty', async () => {
        mockGetRouterParam.mockReturnValue('.xml')

        const handler = createTaxonomyFeedRoute({
            entity: 'CategoryEntity',
            feedFilterKey: 'categoryId',
            labels: { default: 'Category', zhCN: '分类' },
            missingSlugMessage: 'Category slug is required',
            notFoundMessage: 'Category not found',
        })

        await expect(handler({} as H3Event)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Category slug is required',
        })
    })
})
