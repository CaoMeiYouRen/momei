import { beforeAll, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import homePostsHandler from '@/server/api/posts/home.get'

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('/api/posts/home', () => {
    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        const categoryRepo = dataSource.getRepository(Category)
        const postRepo = dataSource.getRepository(Post)

        const author = new User()
        author.name = 'Homepage Author'
        author.email = `home_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const category = new Category()
        category.name = 'Homepage Category'
        category.slug = `home-${generateRandomString(6)}`
        category.description = 'Homepage category'
        category.language = 'zh-CN'
        await categoryRepo.save(category)

        const posts = [
            { title: 'Pinned A', isPinned: true, publishedAt: '2026-04-05T00:00:00.000Z' },
            { title: 'Pinned B', isPinned: true, publishedAt: '2026-04-04T00:00:00.000Z' },
            { title: 'Regular A', isPinned: false, publishedAt: '2026-04-03T00:00:00.000Z' },
            { title: 'Regular B', isPinned: false, publishedAt: '2026-04-02T00:00:00.000Z' },
            { title: 'Regular C', isPinned: false, publishedAt: '2026-04-01T00:00:00.000Z' },
        ]

        for (const input of posts) {
            const post = new Post()
            post.title = `${input.title}-${generateRandomString(4)}`
            post.slug = generateRandomString(10)
            post.content = 'Homepage content'
            post.summary = 'Homepage summary'
            post.status = PostStatus.PUBLISHED
            post.author = author
            post.category = category
            post.isPinned = input.isPinned
            post.publishedAt = new Date(input.publishedAt)
            await postRepo.save(post)
        }
    })

    it('should keep only one pinned post on the homepage latest feed', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                language: 'zh-CN',
            },
        } as any

        const result = await homePostsHandler(event)
        const items = result.data?.items || []
        const pinnedItems = items.filter((item: Post) => item.isPinned)

        expect(result.code).toBe(200)
        expect(items).toHaveLength(3)
        expect(pinnedItems).toHaveLength(1)
    })
})
