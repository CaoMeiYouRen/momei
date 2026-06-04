import { beforeAll, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import calendarPostsHandler from '@/server/api/posts/calendar-posts.get'

// Mock auth + permission
vi.mock('@/lib/auth', () => ({
    auth: {
        api: { getSession: vi.fn().mockResolvedValue(null) },
    },
}))

describe('/api/posts/calendar-posts', () => {
    let author: User
    let enPost: Post
    let zhPost: Post

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
        author.name = 'Calendar Test Author'
        author.email = `cal-author-${generateRandomString(5)}@test.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)

        // English post
        enPost = new Post()
        enPost.title = 'English Calendar Post'
        enPost.slug = `en-cal-${generateRandomString(8)}`
        enPost.content = 'English content'
        enPost.status = PostStatus.PUBLISHED
        enPost.author = author
        enPost.language = 'en-US'
        enPost.publishedAt = new Date('2026-06-01T10:00:00.000Z')
        await postRepo.save(enPost)

        // Chinese post
        zhPost = new Post()
        zhPost.title = '中文日历文章'
        zhPost.slug = `zh-cal-${generateRandomString(8)}`
        zhPost.content = '中文内容'
        zhPost.status = PostStatus.PUBLISHED
        zhPost.author = author
        zhPost.language = 'zh-CN'
        zhPost.publishedAt = new Date('2026-06-01T10:00:00.000Z')
        await postRepo.save(zhPost)
    })

    it('should return posts within date range', async () => {
        const result = await calendarPostsHandler({
            context: {},
            query: {
                startDate: '2026-06-01',
                endDate: '2026-06-30',
            },
        } as any)

        expect(result.code).toBe(200)
        expect(result.data.groups.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by language when provided', async () => {
        const result = await calendarPostsHandler({
            context: {},
            query: {
                startDate: '2026-06-01',
                endDate: '2026-06-30',
                language: 'zh-CN',
            },
        } as any)

        expect(result.code).toBe(200)
        const allPosts = result.data.groups.flatMap((g: { posts: any[] }) => g.posts)
        expect(allPosts.every((p: any) => p.language === 'zh-CN')).toBe(true)
    })

    it('should return all languages when language param is omitted', async () => {
        const result = await calendarPostsHandler({
            context: {},
            query: {
                startDate: '2026-06-01',
                endDate: '2026-06-30',
            },
        } as any)

        expect(result.code).toBe(200)
        const allPosts = result.data.groups.flatMap((g: { posts: any[] }) => g.posts)
        const languages = new Set(allPosts.map((p: any) => p.language))
        // Should contain both English and Chinese
        expect(languages.size).toBeGreaterThanOrEqual(2)
    })

    it('should validate required date params', async () => {
        await expect(calendarPostsHandler({
            context: {},
            query: {
                startDate: 'invalid',
                endDate: '2026-06-30',
            },
        } as any)).rejects.toThrow()
    })
})
