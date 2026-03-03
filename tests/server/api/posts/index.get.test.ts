import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import postsHandler from '@/server/api/posts/index.get'

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('/api/posts', () => {
    let author: User
    let category: Category
    let tag: Tag

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

        const categoryRepo = dataSource.getRepository(Category)
        category = new Category()
        category.name = 'Technology'
        category.slug = 'tech'
        category.description = 'Tech articles'
        category.language = 'en'
        await categoryRepo.save(category)

        const tagRepo = dataSource.getRepository(Tag)
        tag = new Tag()
        tag.name = 'Test Tag'
        tag.slug = 'test'
        tag.language = 'en'
        await tagRepo.save(tag)

        const postRepo = dataSource.getRepository(Post)
        const posts = [
            { title: 'Published Post 1', status: PostStatus.PUBLISHED, category, tag: true },
            { title: 'Published Post 2', status: PostStatus.PUBLISHED, category, tag: true },
            { title: 'Draft Post', status: PostStatus.DRAFT, category, tag: false },
        ]

        for (const p of posts) {
            const post = new Post()
            post.title = p.title
            post.slug = generateRandomString(10)
            post.content = 'Content'
            post.summary = 'Summary'
            post.status = p.status
            post.author = author
            post.category = p.category
            if (p.tag) {
                post.tags = [tag]
            }
            post.publishedAt = new Date()
            await postRepo.save(post)
        }
    })

    it('should return posts list', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {},
        } as any

        const result = await postsHandler(event)

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
                limit: 10,
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data).toHaveProperty('items')
        expect(result.data).toHaveProperty('total')
        expect(result.data).toHaveProperty('totalPages')
        expect(result.data).toHaveProperty('page', 1)
        expect(result.data).toHaveProperty('limit', 10)
    })

    it('should filter by status', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                status: 'published',
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
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
                search: 'Published',
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
    })

    it('should filter by category', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                category: 'tech',
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
    })

    it('should filter by tag', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                tag: 'test',
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
    })

    it('should support sorting', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                orderBy: 'publishedAt',
                order: 'DESC',
            },
        } as any

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
    })

    it('should return empty array when no posts found', async () => {
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

        const result = await postsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items).toEqual([])
    })
})
