import { describe, it, expect, beforeAll, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import categoriesHandler from '@/server/api/categories/index.get'

// Mock auth
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('/api/categories', () => {
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

        const categoryRepo = dataSource.getRepository(Category)
        const categories = [
            { name: '技术', slug: 'tech', description: '技术相关文章', language: 'zh' },
            { name: '生活', slug: 'life', description: '生活随笔', language: 'zh' },
            { name: 'Technology', slug: 'technology', description: 'Tech articles', language: 'en' },
        ]

        for (const cat of categories) {
            const category = new Category()
            category.name = cat.name
            category.slug = cat.slug
            category.description = cat.description
            category.language = cat.language
            await categoryRepo.save(category)
        }

        // Create some published posts to test postCount
        const postRepo = dataSource.getRepository(Post)
        const techCategory = await categoryRepo.findOne({ where: { slug: 'tech' } })
        if (techCategory) {
            for (let i = 0; i < 3; i++) {
                const post = new Post()
                post.title = `Tech Post ${i}`
                post.slug = generateRandomString(10)
                post.content = 'Content'
                post.status = PostStatus.PUBLISHED
                post.author = author
                post.category = techCategory
                post.language = 'zh'
                post.publishedAt = new Date()
                await postRepo.save(post)
            }
        }
    })

    it('should return categories list', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {},
        } as any

        const result = await categoriesHandler(event)

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

        const result = await categoriesHandler(event)

        expect(result.code).toBe(200)
        expect(result.data).toHaveProperty('items')
        expect(result.data).toHaveProperty('total')
        expect(result.data).toHaveProperty('page', 1)
        expect(result.data).toHaveProperty('limit', 10)
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
                search: 'tech',
            },
        } as any

        const result = await categoriesHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
    })

    it('should support language filter', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                language: 'zh',
            },
        } as any

        const result = await categoriesHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.length).toBeGreaterThan(0)
        // Verify all returned categories are in Chinese
        result.data!.items.forEach((item: Category) => {
            expect(item.language).toBe('zh')
        })
    })

    it('should return empty array when no categories found', async () => {
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

        const result = await categoriesHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items).toEqual([])
    })

    it('should support sorting by postCount', async () => {
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
                language: 'zh',
            },
        } as any

        const result = await categoriesHandler(event)

        expect(result.code).toBe(200)
        // The 'tech' category should have the highest post count
        const techCategory = result.data!.items.find((item: Category) => item.slug === 'tech')
        expect(techCategory).toBeDefined()
    })
})
