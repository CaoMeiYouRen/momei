import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import tagsHandler from '@/server/api/tags/index.get'

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('/api/tags', () => {
    let author: User

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

        const tagRepo = dataSource.getRepository(Tag)
        const tags = [
            { name: 'JavaScript', slug: 'javascript', language: 'en' },
            { name: 'Python', slug: 'python', language: 'en' },
            { name: '前端', slug: 'frontend', language: 'zh' },
        ]

        for (const t of tags) {
            const tag = new Tag()
            tag.name = t.name
            tag.slug = t.slug
            tag.language = t.language
            await tagRepo.save(tag)
        }

        // Create some published posts to test postCount
        const postRepo = dataSource.getRepository(Post)
        const jsTag = await tagRepo.findOne({ where: { slug: 'javascript' } })
        if (jsTag) {
            for (let i = 0; i < 3; i++) {
                const post = new Post()
                post.title = `JS Post ${i}`
                post.slug = generateRandomString(10)
                post.content = 'Content'
                post.status = PostStatus.PUBLISHED
                post.author = author
                post.tags = [jsTag]
                post.language = 'en'
                post.publishedAt = new Date()
                await postRepo.save(post)
            }
        }
    })

    it('should return tags list', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {},
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data).toHaveProperty('items')
        expect(result.data).toHaveProperty('total')
    })

    it('should support pagination', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                page: 1,
                limit: 20,
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data).toHaveProperty('items')
        expect(result.data).toHaveProperty('total')
        expect(result.data).toHaveProperty('page', 1)
        expect(result.data).toHaveProperty('limit', 20)
    })

    it('should support search', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                search: 'script',
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
    })

    it('should support ordering by post count', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                orderBy: 'postCount',
                order: 'DESC',
                language: 'en',
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        // The 'javascript' tag should have the highest post count
        const jsTag = result.data!.items.find((item: Tag) => item.slug === 'javascript')
        expect(jsTag).toBeDefined()
    })

    it('should return empty array when no tags found', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                search: 'nonexistent',
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items).toEqual([])
    })
})
