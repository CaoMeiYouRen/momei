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
    const translationClusterId = generateRandomString(12)
    const mediaTranslationClusterId = generateRandomString(12)

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

        const translatedZhPost = new Post()
        translatedZhPost.title = '回退中文文章'
        translatedZhPost.slug = generateRandomString(10)
        translatedZhPost.content = 'Chinese fallback content'
        translatedZhPost.summary = 'Chinese summary'
        translatedZhPost.status = PostStatus.PUBLISHED
        translatedZhPost.author = author
        translatedZhPost.language = 'zh-CN'
        translatedZhPost.translationId = translationClusterId
        translatedZhPost.publishedAt = new Date()
        await postRepo.save(translatedZhPost)

        const translatedEnPost = new Post()
        translatedEnPost.title = 'Fallback English Post'
        translatedEnPost.slug = generateRandomString(10)
        translatedEnPost.content = 'English fallback content'
        translatedEnPost.summary = 'English summary'
        translatedEnPost.status = PostStatus.PUBLISHED
        translatedEnPost.author = author
        translatedEnPost.language = 'en-US'
        translatedEnPost.translationId = translationClusterId
        translatedEnPost.publishedAt = new Date()
        await postRepo.save(translatedEnPost)

        const translatedMediaZhPost = new Post()
        translatedMediaZhPost.title = '媒体回退中文文章'
        translatedMediaZhPost.slug = generateRandomString(10)
        translatedMediaZhPost.content = 'Chinese media fallback content'
        translatedMediaZhPost.summary = 'Chinese media summary'
        translatedMediaZhPost.status = PostStatus.PUBLISHED
        translatedMediaZhPost.author = author
        translatedMediaZhPost.language = 'zh-CN'
        translatedMediaZhPost.translationId = mediaTranslationClusterId
        translatedMediaZhPost.coverImage = '/covers/zh-media-cover.webp'
        translatedMediaZhPost.publishedAt = new Date()
        await postRepo.save(translatedMediaZhPost)

        const translatedMediaEnPost = new Post()
        translatedMediaEnPost.title = 'Media Fallback English Post'
        translatedMediaEnPost.slug = generateRandomString(10)
        translatedMediaEnPost.content = 'English media fallback content'
        translatedMediaEnPost.summary = 'English media summary'
        translatedMediaEnPost.status = PostStatus.PUBLISHED
        translatedMediaEnPost.author = author
        translatedMediaEnPost.language = 'en-US'
        translatedMediaEnPost.translationId = mediaTranslationClusterId
        translatedMediaEnPost.metadata = {
            audio: {
                url: '/audio/fallback-en.mp3',
                duration: 75,
            },
        }
        translatedMediaEnPost.publishedAt = new Date()
        await postRepo.save(translatedMediaEnPost)
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

    it('should use posts_per_page as default limit when request limit is missing', async () => {
        const previous = process.env.NUXT_PUBLIC_POSTS_PER_PAGE
        process.env.NUXT_PUBLIC_POSTS_PER_PAGE = '1'

        try {
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
            expect(result.data).toHaveProperty('limit', 1)
        } finally {
            if (previous === undefined) {
                delete process.env.NUXT_PUBLIC_POSTS_PER_PAGE
            } else {
                process.env.NUXT_PUBLIC_POSTS_PER_PAGE = previous
            }
        }
    })

    it('should prefer explicit request limit over posts_per_page setting', async () => {
        const previous = process.env.NUXT_PUBLIC_POSTS_PER_PAGE
        process.env.NUXT_PUBLIC_POSTS_PER_PAGE = '1'

        try {
            const event = {
                context: {},
                node: {
                    req: { headers: {} },
                    res: { setHeader: vi.fn() },
                },
                req: { headers: {} },
                query: {
                    limit: 2,
                },
            } as any

            const result = await postsHandler(event)

            expect(result.code).toBe(200)
            expect(result.data).toHaveProperty('limit', 2)
        } finally {
            if (previous === undefined) {
                delete process.env.NUXT_PUBLIC_POSTS_PER_PAGE
            } else {
                process.env.NUXT_PUBLIC_POSTS_PER_PAGE = previous
            }
        }
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

    it('should deduplicate fallback translations for ui-ready locales', async () => {
        const event = {
            context: {},
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                language: 'zh-TW',
                orderBy: 'publishedAt',
                order: 'DESC',
            },
        } as any

        const result = await postsHandler(event)
        const clusterPosts = result.data!.items.filter((item: any) => item.translationId === translationClusterId)

        expect(result.code).toBe(200)
        expect(clusterPosts).toHaveLength(1)
        expect(clusterPosts[0]?.language).toBe('zh-CN')
        expect(clusterPosts[0]?.title).toBe('回退中文文章')
    })

    it('should include aggregated translation media for management preview fallback', async () => {
        interface ManagementPostResponse {
            translationId?: string | null
            coverImage?: string | null
            translations?: {
                language: string
                translationId?: string | null
                metadata?: {
                    audio?: {
                        url?: string | null
                        duration?: number | null
                    }
                } | null
            }[] | null
        }

        const event = {
            context: {
                auth: {
                    user: {
                        id: 'admin-user',
                        role: 'admin',
                    },
                },
                user: {
                    id: 'admin-user',
                    role: 'admin',
                },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            query: {
                scope: 'manage',
                aggregate: true,
                language: 'zh-TW',
                search: '媒体回退中文文章',
            },
        } as any

        const result = await postsHandler(event)
        const responseItems = result.data!.items as ManagementPostResponse[]
        const mediaPost = responseItems.find((item) => item.translationId === mediaTranslationClusterId)
        const englishTranslation = mediaPost?.translations?.find((translation) => translation.language === 'en-US' && translation.translationId === mediaTranslationClusterId)

        expect(result.code).toBe(200)
        expect(mediaPost?.coverImage).toBe('/covers/zh-media-cover.webp')
        expect(englishTranslation?.metadata?.audio?.url).toBe('/audio/fallback-en.mp3')
        expect(englishTranslation?.metadata?.audio?.duration).toBe(75)
    })
})
