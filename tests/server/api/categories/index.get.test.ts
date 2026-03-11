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
    const translatedCategoryGroup = `tech-group-${generateRandomString(6)}`

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
            { name: '技术专题', slug: 'tech-cn-fallback', description: '简体分类', language: 'zh-CN', translationId: translatedCategoryGroup },
            { name: 'Technology Fallback', slug: 'tech-en-fallback', description: 'English category', language: 'en-US', translationId: translatedCategoryGroup },
            { name: '技術專題', slug: 'tech-zh-tw-fallback', description: '繁體分類', language: 'zh-TW', translationId: translatedCategoryGroup },
        ]

        for (const cat of categories) {
            const category = new Category()
            category.name = cat.name
            category.slug = cat.slug
            category.description = cat.description
            category.language = cat.language
            category.translationId = cat.translationId || null
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

        const translatedZhCategory = await categoryRepo.findOne({ where: { slug: 'tech-cn-fallback' } })
        const translatedEnCategory = await categoryRepo.findOne({ where: { slug: 'tech-en-fallback' } })

        if (translatedZhCategory && translatedEnCategory) {
            const zhPost = new Post()
            zhPost.title = '分类回退中文文章'
            zhPost.slug = generateRandomString(10)
            zhPost.content = 'Content'
            zhPost.status = PostStatus.PUBLISHED
            zhPost.author = author
            zhPost.category = translatedZhCategory
            zhPost.language = 'zh-CN'
            zhPost.translationId = 'category-fallback-post'
            zhPost.publishedAt = new Date()
            await postRepo.save(zhPost)

            const enPost = new Post()
            enPost.title = 'Category fallback English post'
            enPost.slug = generateRandomString(10)
            enPost.content = 'Content'
            enPost.status = PostStatus.PUBLISHED
            enPost.author = author
            enPost.category = translatedEnCategory
            enPost.language = 'en-US'
            enPost.translationId = 'category-fallback-post'
            enPost.publishedAt = new Date()
            await postRepo.save(enPost)
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

    it('should count translated category posts for zh-TW fallback pages', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                language: 'zh-TW',
            },
        } as any

        const result = await categoriesHandler(event)
        const translatedCategory = result.data!.items.find((item: any) => item.slug === 'tech-zh-tw-fallback')

        expect(result.code).toBe(200)
        expect(translatedCategory).toBeDefined()
        if (!translatedCategory) {
            throw new Error('Expected zh-TW fallback category to exist')
        }
        expect(translatedCategory.postCount).toBe(1)
    })
})
