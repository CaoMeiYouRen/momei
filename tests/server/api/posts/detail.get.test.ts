import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus, PostVisibility } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import postDetailHandler from '@/server/api/posts/[id].get'

describe('/api/posts/[id]', () => {
    let author: User
    let latestPublicPostId = ''
    let currentPostId = ''
    let oldestPublicPostId = ''
    const translationId = generateRandomString(12)

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.stubGlobal('getCookie', vi.fn(() => ''))

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Detail Navigation Author'
        author.email = `detail_${generateRandomString(6)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)
        const createPost = async (input: {
            title: string
            slug: string
            publishedAt: string
            language?: string
            translationId?: string | null
            visibility?: PostVisibility
            isPinned?: boolean
        }) => {
            const post = new Post()
            post.title = input.title
            post.slug = input.slug
            post.content = `${input.title} content`
            post.summary = `${input.title} summary`
            post.status = PostStatus.PUBLISHED
            post.visibility = input.visibility ?? PostVisibility.PUBLIC
            post.language = input.language ?? 'fr-FR'
            post.translationId = input.translationId ?? null
            post.isPinned = input.isPinned ?? false
            post.author = author
            post.publishedAt = new Date(input.publishedAt)
            await postRepo.save(post)
            return post
        }

        const latestPost = await createPost({
            title: 'Latest public post',
            slug: `latest-${generateRandomString(6)}`,
            publishedAt: '2026-03-10T12:00:00.000Z',
        })
        latestPublicPostId = latestPost.id

        const currentPost = await createPost({
            title: 'Current public post',
            slug: `current-${generateRandomString(6)}`,
            publishedAt: '2026-03-09T12:00:00.000Z',
            translationId,
        })
        currentPostId = currentPost.id

        await createPost({
            title: 'Restricted closer post',
            slug: `restricted-${generateRandomString(6)}`,
            publishedAt: '2026-03-08T12:00:00.000Z',
            visibility: PostVisibility.REGISTERED,
        })

        await createPost({
            title: 'Regular older post',
            slug: `older-${generateRandomString(6)}`,
            publishedAt: '2026-03-07T12:00:00.000Z',
        })

        await createPost({
            title: 'Pinned far older post',
            slug: `pinned-${generateRandomString(6)}`,
            publishedAt: '2026-03-05T12:00:00.000Z',
            isPinned: true,
        })

        const oldestPost = await createPost({
            title: 'Oldest public post',
            slug: `oldest-${generateRandomString(6)}`,
            publishedAt: '2026-03-04T12:00:00.000Z',
        })
        oldestPublicPostId = oldestPost.id

        await createPost({
            title: '当前中文翻译文章',
            slug: `zh-${generateRandomString(6)}`,
            publishedAt: '2026-03-09T12:00:00.000Z',
            language: 'zh-CN',
            translationId,
        })
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    function createEvent(id: string) {
        return {
            context: {
                params: { id },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
        } as any
    }

    it('should return adjacent public posts from the same language timeline', async () => {
        const result = await postDetailHandler(createEvent(currentPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost?.title).toBe('Latest public post')
        expect(data.nextPost?.title).toBe('Regular older post')
        expect(data.nextPost?.title).not.toBe('Restricted closer post')
        expect(data.nextPost?.title).not.toBe('Pinned far older post')
    })

    it('should include published translations for the current cluster', async () => {
        const result = await postDetailHandler(createEvent(currentPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.translations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ language: 'fr-FR' }),
                expect.objectContaining({ language: 'zh-CN' }),
            ]),
        )
    })

    it('should return null previous post for the latest article', async () => {
        const result = await postDetailHandler(createEvent(latestPublicPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost).toBeNull()
        expect(data.nextPost?.title).toBe('Current public post')
    })

    it('should return null next post for the oldest article', async () => {
        const result = await postDetailHandler(createEvent(oldestPublicPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost?.title).toBe('Pinned far older post')
        expect(data.nextPost).toBeNull()
    })
})
