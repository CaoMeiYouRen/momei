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
    const translatedTagGroup = `tag-group-${generateRandomString(6)}`

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
            { name: '回退标签', slug: 'fallback-tag-zh-cn', language: 'zh-CN', translationId: translatedTagGroup },
            { name: 'Fallback Tag', slug: 'fallback-tag-en-us', language: 'en-US', translationId: translatedTagGroup },
            { name: '回退標籤', slug: 'fallback-tag-zh-tw', language: 'zh-TW', translationId: translatedTagGroup },
        ]

        for (const t of tags) {
            const tag = new Tag()
            tag.name = t.name
            tag.slug = t.slug
            tag.language = t.language
            tag.translationId = t.translationId || null
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

        const fallbackZhTag = await tagRepo.findOne({ where: { slug: 'fallback-tag-zh-cn' } })
        const fallbackEnTag = await tagRepo.findOne({ where: { slug: 'fallback-tag-en-us' } })

        if (fallbackZhTag && fallbackEnTag) {
            const zhPost = new Post()
            zhPost.title = '标签回退中文文章'
            zhPost.slug = generateRandomString(10)
            zhPost.content = 'Content'
            zhPost.status = PostStatus.PUBLISHED
            zhPost.author = author
            zhPost.tags = [fallbackZhTag]
            zhPost.language = 'zh-CN'
            zhPost.translationId = 'tag-fallback-post'
            zhPost.publishedAt = new Date()
            await postRepo.save(zhPost)

            const enPost = new Post()
            enPost.title = 'Tag fallback English post'
            enPost.slug = generateRandomString(10)
            enPost.content = 'Content'
            enPost.status = PostStatus.PUBLISHED
            enPost.author = author
            enPost.tags = [fallbackEnTag]
            enPost.language = 'en-US'
            enPost.translationId = 'tag-fallback-post'
            enPost.publishedAt = new Date()
            await postRepo.save(enPost)
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

    it('should support aggregate mode without count query alias errors', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                aggregate: true,
                language: 'zh-CN',
                orderBy: 'createdAt',
                order: 'DESC',
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(Array.isArray(result.data?.items)).toBe(true)
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

    it('should count translated tag posts for zh-TW fallback pages', async () => {
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

        const result = await tagsHandler(event)
        const translatedTag = result.data!.items.find((item: any) => item.slug === 'fallback-tag-zh-tw')

        expect(result.code).toBe(200)
        expect(translatedTag).toBeDefined()
        if (!translatedTag) {
            throw new Error('Expected zh-TW fallback tag to exist')
        }
        expect(translatedTag.postCount).toBe(1)
    })

    it('should filter tags by translation cluster id', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                translationId: translatedTagGroup,
                aggregate: false,
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items).toHaveLength(3)
        expect(result.data!.items.every((item: Tag) => item.translationId === translatedTagGroup)).toBe(true)
    })

    it('should filter tags by slug fallback when translationId is empty', async () => {
        const tagRepo = dataSource.getRepository(Tag)
        const fallbackClusterSlug = `manual-tag-cluster-${generateRandomString(5)}`

        const zhTag = new Tag()
        zhTag.name = '手动修复标签'
        zhTag.slug = fallbackClusterSlug
        zhTag.language = 'zh-CN'
        zhTag.translationId = null
        await tagRepo.save(zhTag)

        const enTag = new Tag()
        enTag.name = 'Manual Repair Tag'
        enTag.slug = `manual-repair-tag-${generateRandomString(4)}`
        enTag.language = 'en-US'
        enTag.translationId = fallbackClusterSlug
        await tagRepo.save(enTag)

        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                translationId: fallbackClusterSlug,
                aggregate: false,
            },
        } as any

        const result = await tagsHandler(event)

        expect(result.code).toBe(200)
        expect(result.data!.items.map((item: Tag) => item.id)).toEqual(expect.arrayContaining([zhTag.id, enTag.id]))
    })
})
