import { beforeAll, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import kanbanPostsHandler from '@/server/api/posts/kanban-posts.get'

// Mock auth + permission
vi.mock('@/lib/auth', () => ({
    auth: {
        api: { getSession: vi.fn().mockResolvedValue(null) },
    },
}))

describe('/api/posts/kanban-posts', () => {
    let author: User
    let draftEnPost: Post
    let draftZhPost: Post
    let publishedPost: Post

    beforeAll(async () => {
        vi.stubGlobal('getValidatedQuery', vi.fn(
            (_event: { query?: unknown }, parser: (query: unknown) => unknown) =>
                Promise.resolve(parser(_event.query || {})),
        ))
        vi.mock('@/server/utils/permission', () => ({
            requireAdminOrAuthor: vi.fn().mockResolvedValue({
                user: { id: 'admin-1', role: 'admin' },
            }),
        }))

        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Kanban Test Author'
        author.email = `kanban-author-${generateRandomString(5)}@test.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)

        // English draft with pipeline stage
        draftEnPost = new Post()
        draftEnPost.title = 'English Draft'
        draftEnPost.slug = `en-draft-${generateRandomString(8)}`
        draftEnPost.content = 'Draft content'
        draftEnPost.status = PostStatus.DRAFT
        draftEnPost.author = author
        draftEnPost.language = 'en-US'
        draftEnPost.metadata = { pipelineStage: 'writing' }
        await postRepo.save(draftEnPost)

        // Chinese draft without pipeline stage (should default to ideation)
        draftZhPost = new Post()
        draftZhPost.title = '中文草稿'
        draftZhPost.slug = `zh-draft-${generateRandomString(8)}`
        draftZhPost.content = '草稿内容'
        draftZhPost.status = PostStatus.DRAFT
        draftZhPost.author = author
        draftZhPost.language = 'zh-CN'
        await postRepo.save(draftZhPost)

        // Published post (should NOT appear in kanban)
        publishedPost = new Post()
        publishedPost.title = 'Published Post'
        publishedPost.slug = `pub-${generateRandomString(8)}`
        publishedPost.content = 'Published content'
        publishedPost.status = PostStatus.PUBLISHED
        publishedPost.author = author
        publishedPost.language = 'en-US'
        publishedPost.publishedAt = new Date('2026-06-01T10:00:00.000Z')
        await postRepo.save(publishedPost)
    })

    it('should only return draft posts (not published)', async () => {
        const result = await kanbanPostsHandler({
            context: {},
            query: {},
        } as any)

        expect(result.code).toBe(200)
        const allCards = [...result.data.ideation, ...result.data.writing, ...result.data.ready]
        // Published post should not be in kanban
        expect(allCards.some((c: any) => c.id === publishedPost.id)).toBe(false)
    })

    it('should filter by language when provided', async () => {
        const result = await kanbanPostsHandler({
            context: {},
            query: { language: 'zh-CN' },
        } as any)

        expect(result.code).toBe(200)
        const allCards = [...result.data.ideation, ...result.data.writing, ...result.data.ready]
        // Only Chinese draft should be returned
        expect(allCards.length).toBe(1)
        expect(allCards[0].language).toBe('zh-CN')
    })

    it('should return all languages when language param is omitted', async () => {
        const result = await kanbanPostsHandler({
            context: {},
            query: {},
        } as any)

        expect(result.code).toBe(200)
        const allCards = [...result.data.ideation, ...result.data.writing, ...result.data.ready]
        // Both drafts should appear (en-US + zh-CN)
        expect(allCards.length).toBeGreaterThanOrEqual(2)
    })

    it('should default posts without pipelineStage to ideation', async () => {
        const result = await kanbanPostsHandler({
            context: {},
            query: { language: 'zh-CN' },
        } as any)

        expect(result.code).toBe(200)
        // zh draft has no pipelineStage, should be in ideation
        expect(result.data.ideation.length).toBe(1)
        expect(result.data.writing.length).toBe(0)
        expect(result.data.ready.length).toBe(0)
    })

    it('should place posts with pipelineStage=writing in the writing column', async () => {
        const result = await kanbanPostsHandler({
            context: {},
            query: { language: 'en-US' },
        } as any)

        expect(result.code).toBe(200)
        expect(result.data.ideation.length).toBe(0)
        expect(result.data.writing.length).toBe(1)
        expect(result.data.ready.length).toBe(0)
    })

    it('should accept language as optional param', async () => {
        // Language omitted - should not throw
        const result = await kanbanPostsHandler({
            context: {},
            query: {},
        } as any)
        expect(result.code).toBe(200)
    })
})
