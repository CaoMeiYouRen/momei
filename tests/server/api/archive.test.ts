import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import archiveHandler from '@/server/api/posts/archive.get'

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('Archive API', async () => {
    let author: User

    // Skip actual Nuxt setup since we are unit testing the handler logic with mocked globals
    // But we need DB connection. Nuxt test utils setup handles environment variables often.
    // However, since we import handler directly, we might not need full setup if we initialize DB manually.
    // We already have manual initializeDB call below.
    // Let's keep a minimal setup or remove it if problematic.
    // For now, removing 'setup' call and relying on manual DB init is faster for this specific test style.
    // But vitest-environment-nuxt might need it.

    // Actually, 'setup' from @nuxt/test-utils/e2e is for E2E.
    // We can remove it and just rely on manual DB.

    beforeAll(async () => {
        // Initialize DB
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Test Author'
        author.email = `author_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)
        // Extract year/month creation logic
        const date2023_01 = new Date('2023-01-15T12:00:00Z')
        const date2023_02 = new Date('2023-02-20T12:00:00Z')
        const date2024_01 = new Date('2024-01-10T12:00:00Z')

        const posts = [
            { title: 'Post 1', created: date2023_01 },
            { title: 'Post 2', created: date2023_01 }, // Two in Jan 2023
            { title: 'Post 3', created: date2023_02 }, // One in Feb 2023
            { title: 'Post 4', created: date2024_01 }, // One in Jan 2024
        ]

        for (const p of posts) {
            const post = new Post()
            post.title = p.title
            post.slug = generateRandomString(10)
            post.content = 'Content'
            post.status = PostStatus.PUBLISHED
            post.author = author
            post.publishedAt = p.created
            post.createdAt = p.created // Force createdAt if API uses it.
            await postRepo.save(post)
        }
    })

    it('should group posts by year and month', async () => {
        // Simulate H3 event
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {}, // Mock query for getValidatedQuery
        } as any

        const result = await archiveHandler(event)

        expect(result.code).toBe(200)
        const data = result.data as any[]
        expect(Array.isArray(data)).toBe(true)

        const year2024 = data.find((y: any) => y.year === 2024)
        expect(year2024).toBeDefined()
        // 2024 has 1 post in Jan (month 1)
        const jan2024 = year2024.months.find((m: any) => m.month === 1)
        expect(jan2024).toBeDefined()
        expect(jan2024.count).toBeGreaterThanOrEqual(1)

        const year2023 = data.find((y: any) => y.year === 2023)
        expect(year2023).toBeDefined()
        // 2023 has posts in Jan (2) and Feb (1)
        // Note: Raw count might vary due to other tests, so we check existence
        expect(year2023.months.length).toBeGreaterThanOrEqual(2)
    })

    it('should return posts list when includePosts=true', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                includePosts: true,
                year: 2024,
                month: 1,
                page: 1,
                limit: 10,
            },
        } as any

        const result = await archiveHandler(event)

        expect(result.code).toBe(200)
        const data = result.data as any
        expect(data.items).toBeDefined()
        // Should find the 1 post from 2024-01
        expect(data.total).toBeGreaterThanOrEqual(1)
        const doc = data.items[0]
        expect(doc.title).toBe('Post 4')
    })
})
