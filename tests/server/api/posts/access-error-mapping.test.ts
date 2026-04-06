import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { Subscriber } from '@/server/entities/subscriber'
import { PostStatus, PostVisibility } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import postsHandler from '@/server/api/posts/index.get'
import archiveHandler from '@/server/api/posts/archive.get'
import searchHandler from '@/server/api/search/index.get'
import postDetailHandler from '@/server/api/posts/[id].get'
import postSlugDetailHandler from '@/server/api/posts/slug/[slug].get'
import { POST_ACCESS_STATE_ERROR_MESSAGE } from '@/server/utils/post-access'

describe('content access API error mapping', () => {
    let subscriberPostId = ''
    let subscriberPostSlug = ''

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.stubGlobal('getCookie', vi.fn(() => ''))
        vi.stubGlobal('getQuery', vi.fn((event: { query?: Record<string, unknown> }) => event.query || {}))

        const userRepo = dataSource.getRepository(User)
        const author = new User()
        author.name = 'Access Mapping Author'
        author.email = `access_mapping_${generateRandomString(6)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)

        const publicPost = new Post()
        publicPost.title = 'Access Mapping Public Post'
        publicPost.slug = `mapping-public-${generateRandomString(6)}`
        publicPost.content = 'Public content'
        publicPost.summary = 'Public summary'
        publicPost.status = PostStatus.PUBLISHED
        publicPost.visibility = PostVisibility.PUBLIC
        publicPost.author = author
        publicPost.publishedAt = new Date('2026-04-06T00:00:00.000Z')
        await postRepo.save(publicPost)

        const subscriberPost = new Post()
        subscriberPost.title = 'Access Mapping Subscriber Post'
        subscriberPost.slug = `mapping-subscriber-${generateRandomString(6)}`
        subscriberPost.content = 'Subscriber content'
        subscriberPost.summary = 'Subscriber summary'
        subscriberPost.status = PostStatus.PUBLISHED
        subscriberPost.visibility = PostVisibility.SUBSCRIBER
        subscriberPost.author = author
        subscriberPost.publishedAt = new Date('2026-04-06T01:00:00.000Z')
        await postRepo.save(subscriberPost)

        subscriberPostId = subscriberPost.id
        subscriberPostSlug = subscriberPost.slug
    })

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getCookie).mockReturnValue('')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    function withSubscriberLookupFailure() {
        const actualGetRepository = dataSource.getRepository.bind(dataSource)

        return vi.spyOn(dataSource, 'getRepository').mockImplementation((entity: any) => {
            if (entity === Subscriber) {
                return {
                    findOne: vi.fn().mockRejectedValue(new Error('db unavailable')),
                } as any
            }

            return actualGetRepository(entity)
        })
    }

    function expectMappedAccessError(promise: Promise<unknown>) {
        return expect(promise).rejects.toMatchObject({
            statusCode: 503,
            statusMessage: POST_ACCESS_STATE_ERROR_MESSAGE,
        })
    }

    it('应该将 /api/posts 的订阅状态查询失败统一映射为 503', async () => {
        withSubscriberLookupFailure()

        await expectMappedAccessError(postsHandler({
            context: {
                user: { id: 'viewer-1', role: 'user' },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {},
        } as any))
    })

    it('应该将 /api/posts/archive 的订阅状态查询失败统一映射为 503', async () => {
        withSubscriberLookupFailure()

        await expectMappedAccessError(archiveHandler({
            context: {
                auth: { user: { id: 'viewer-1', role: 'user' } },
                user: { id: 'viewer-1', role: 'user' },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {},
        } as any))
    })

    it('应该将 /api/search 的订阅状态查询失败统一映射为 503', async () => {
        withSubscriberLookupFailure()

        await expectMappedAccessError(searchHandler({
            context: {
                auth: { user: { id: 'viewer-1', role: 'user' } },
                user: { id: 'viewer-1', role: 'user' },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: { q: 'Access' },
        } as any))
    })

    it('应该将 /api/posts/[id] 的订阅状态查询失败统一映射为 503', async () => {
        withSubscriberLookupFailure()

        await expectMappedAccessError(postDetailHandler({
            context: {
                params: { id: subscriberPostId },
                auth: { user: { id: 'viewer-1', role: 'user' } },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
        } as any))
    })

    it('应该将 /api/posts/slug/[slug] 的订阅状态查询失败统一映射为 503', async () => {
        withSubscriberLookupFailure()

        await expectMappedAccessError(postSlugDetailHandler({
            context: {
                params: { slug: subscriberPostSlug },
                auth: { user: { id: 'viewer-1', role: 'user' } },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
        } as any))
    })
})
