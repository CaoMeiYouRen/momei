import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { User } from '@/server/entities/user'
import { PostStatus, PostVisibility } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import postDetailHandler from '@/server/api/posts/[id].get'
import postDetailBySlugHandler from '@/server/api/posts/slug/[slug].get'

describe('/api/posts/[id]', () => {
    let author: User
    let latestPublicPostId = ''
    let currentPostId = ''
    let oldestPublicPostId = ''
    let relatedCurrentPostId = ''
    let relatedCurrentPostSlug = ''
    const translationId = generateRandomString(12)

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.stubGlobal('getQuery', vi.fn((event: { query?: Record<string, string> }) => event.query || {}))
        vi.stubGlobal('getCookie', vi.fn(() => ''))

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Detail Navigation Author'
        author.email = `detail_${generateRandomString(6)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)
        const categoryRepo = dataSource.getRepository(Category)
        const tagRepo = dataSource.getRepository(Tag)

        const createCategory = async (input: {
            name: string
            slug: string
            language: string
            translationId?: string | null
        }) => {
            const category = new Category()
            category.name = input.name
            category.slug = input.slug
            category.language = input.language
            category.translationId = input.translationId ?? null
            category.description = null
            category.parentId = null
            await categoryRepo.save(category)
            return category
        }

        const createTag = async (input: {
            name: string
            slug: string
            language: string
            translationId?: string | null
        }) => {
            const tag = new Tag()
            tag.name = input.name
            tag.slug = input.slug
            tag.language = input.language
            tag.translationId = input.translationId ?? null
            await tagRepo.save(tag)
            return tag
        }

        const createPost = async (input: {
            title: string
            slug: string
            publishedAt: string
            language?: string
            translationId?: string | null
            visibility?: PostVisibility
            isPinned?: boolean
            category?: Category | null
            tags?: Tag[]
        }) => {
            const post = new Post()
            post.title = input.title
            post.slug = input.slug
            post.content = `${input.title} content`
            post.summary = `${input.title} summary`
            post.status = PostStatus.PUBLISHED
            post.visibility = input.visibility ?? PostVisibility.PUBLIC
            post.language = input.language ?? 'fr-FR'
            post.translationId = input.translationId ?? null
            post.isPinned = input.isPinned ?? false
            post.author = author
            post.categoryId = input.category?.id ?? null
            if (input.category) {
                post.category = input.category
            }
            post.tags = input.tags ?? []
            post.publishedAt = new Date(input.publishedAt)
            await postRepo.save(post)
            return post
        }

        const latestPost = await createPost({
            title: 'Latest public post',
            slug: `latest-${generateRandomString(6)}`,
            publishedAt: '2026-03-10T12:00:00.000Z',
        })
        latestPublicPostId = latestPost.id

        const currentPost = await createPost({
            title: 'Current public post',
            slug: `current-${generateRandomString(6)}`,
            publishedAt: '2026-03-09T12:00:00.000Z',
            translationId,
        })
        currentPostId = currentPost.id

        await createPost({
            title: 'Restricted closer post',
            slug: `restricted-${generateRandomString(6)}`,
            publishedAt: '2026-03-08T12:00:00.000Z',
            visibility: PostVisibility.REGISTERED,
        })

        await createPost({
            title: 'Regular older post',
            slug: `older-${generateRandomString(6)}`,
            publishedAt: '2026-03-07T12:00:00.000Z',
        })

        await createPost({
            title: 'Pinned far older post',
            slug: `pinned-${generateRandomString(6)}`,
            publishedAt: '2026-03-05T12:00:00.000Z',
            isPinned: true,
        })

        const oldestPost = await createPost({
            title: 'Oldest public post',
            slug: `oldest-${generateRandomString(6)}`,
            publishedAt: '2026-03-04T12:00:00.000Z',
        })
        oldestPublicPostId = oldestPost.id

        await createPost({
            title: '当前中文翻译文章',
            slug: `zh-${generateRandomString(6)}`,
            publishedAt: '2026-03-09T12:00:00.000Z',
            language: 'zh-CN',
            translationId,
        })

        const techCategoryZhTw = await createCategory({
            name: '前端工程',
            slug: `frontend-zh-tw-${generateRandomString(4)}`,
            language: 'zh-TW',
            translationId: 'category-frontend-cluster',
        })
        const techCategoryZhCn = await createCategory({
            name: '前端工程',
            slug: `frontend-zh-cn-${generateRandomString(4)}`,
            language: 'zh-CN',
            translationId: 'category-frontend-cluster',
        })
        const opsCategoryEn = await createCategory({
            name: 'Operations',
            slug: `ops-en-${generateRandomString(4)}`,
            language: 'en-US',
            translationId: 'category-ops-cluster',
        })

        const nuxtTagZhTw = await createTag({
            name: 'Nuxt',
            slug: `nuxt-zh-tw-${generateRandomString(4)}`,
            language: 'zh-TW',
            translationId: 'tag-nuxt-cluster',
        })
        const nuxtTagZhCn = await createTag({
            name: 'Nuxt',
            slug: `nuxt-zh-cn-${generateRandomString(4)}`,
            language: 'zh-CN',
            translationId: 'tag-nuxt-cluster',
        })
        const i18nTagZhTw = await createTag({
            name: '多语言',
            slug: `i18n-zh-tw-${generateRandomString(4)}`,
            language: 'zh-TW',
            translationId: 'tag-i18n-cluster',
        })
        const i18nTagZhCn = await createTag({
            name: '多语言',
            slug: `i18n-zh-cn-${generateRandomString(4)}`,
            language: 'zh-CN',
            translationId: 'tag-i18n-cluster',
        })
        const i18nTagEn = await createTag({
            name: 'i18n',
            slug: `i18n-en-${generateRandomString(4)}`,
            language: 'en-US',
            translationId: 'tag-i18n-cluster',
        })
        const securityTagZhCn = await createTag({
            name: '安全',
            slug: `security-zh-cn-${generateRandomString(4)}`,
            language: 'zh-CN',
            translationId: 'tag-security-cluster',
        })

        const relatedCurrentPost = await createPost({
            title: '目前文章的繁體版本',
            slug: `related-current-${generateRandomString(6)}`,
            publishedAt: '2026-03-12T12:00:00.000Z',
            language: 'zh-TW',
            translationId: 'related-current-cluster',
            category: techCategoryZhTw,
            tags: [nuxtTagZhTw, i18nTagZhTw],
        })
        relatedCurrentPostId = relatedCurrentPost.id
        relatedCurrentPostSlug = relatedCurrentPost.slug

        await createPost({
            title: '同主题繁体推荐',
            slug: `related-zh-tw-${generateRandomString(6)}`,
            publishedAt: '2026-03-11T12:00:00.000Z',
            language: 'zh-TW',
            translationId: 'related-shared-cluster',
            category: techCategoryZhTw,
            tags: [nuxtTagZhTw],
        })
        await createPost({
            title: '同主题简体重复项',
            slug: `related-zh-cn-dup-${generateRandomString(6)}`,
            publishedAt: '2026-03-10T12:00:00.000Z',
            language: 'zh-CN',
            translationId: 'related-shared-cluster',
            category: techCategoryZhCn,
            tags: [nuxtTagZhCn],
        })
        await createPost({
            title: '仅简体可用的相关文章',
            slug: `related-zh-cn-${generateRandomString(6)}`,
            publishedAt: '2026-03-09T18:00:00.000Z',
            language: 'zh-CN',
            translationId: 'related-fallback-cluster',
            category: techCategoryZhCn,
            tags: [i18nTagZhCn],
        })
        await createPost({
            title: '英语标签匹配文章',
            slug: `related-en-${generateRandomString(6)}`,
            publishedAt: '2026-03-08T12:00:00.000Z',
            language: 'en-US',
            translationId: 'related-english-cluster',
            category: opsCategoryEn,
            tags: [i18nTagEn],
        })
        await createPost({
            title: '不应命中的无关文章',
            slug: `related-miss-${generateRandomString(6)}`,
            publishedAt: '2026-03-07T12:00:00.000Z',
            language: 'zh-CN',
            translationId: 'related-miss-cluster',
            category: opsCategoryEn,
            tags: [securityTagZhCn],
        })
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    function createEvent(id: string) {
        return {
            context: {
                params: { id },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
        } as any
    }

    function createSlugEvent(slug: string, language?: string) {
        return {
            context: {
                params: { slug },
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            path: `/api/posts/slug/${slug}`,
            method: 'GET',
            query: language ? { language } : {},
        } as any
    }

    it('should return adjacent public posts from the same language timeline', async () => {
        const result = await postDetailHandler(createEvent(currentPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost?.title).toBe('Latest public post')
        expect(data.nextPost?.title).toBe('Regular older post')
        expect(data.nextPost?.title).not.toBe('Restricted closer post')
        expect(data.nextPost?.title).not.toBe('Pinned far older post')
    })

    it('should include published translations for the current cluster', async () => {
        const result = await postDetailHandler(createEvent(currentPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.translations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ language: 'fr-FR' }),
                expect.objectContaining({ language: 'zh-CN' }),
            ]),
        )
    })

    it('should return null previous post for the latest article', async () => {
        const result = await postDetailHandler(createEvent(latestPublicPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost).toBeNull()
        expect(data.nextPost?.title).toBe('Current public post')
    })

    it('should return null next post for the oldest article', async () => {
        const result = await postDetailHandler(createEvent(oldestPublicPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.previousPost?.title).toBe('Pinned far older post')
        expect(data.nextPost).toBeNull()
    })

    it('should return related posts using taxonomy translation clusters without duplicate cluster slots', async () => {
        const result = await postDetailHandler(createEvent(relatedCurrentPostId))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.relatedPosts?.map((item: { title: string, language: string }) => `${item.language}:${item.title}`)).toEqual([
            'zh-TW:同主题繁体推荐',
            'zh-CN:仅简体可用的相关文章',
            'en-US:英语标签匹配文章',
        ])
        expect(data.relatedPosts?.some((item: { title: string }) => item.title === '同主题简体重复项')).toBe(false)
        expect(data.relatedPosts?.some((item: { title: string }) => item.title === '不应命中的无关文章')).toBe(false)
    })

    it('should return related posts for slug detail when language query is provided', async () => {
        const result = await postDetailBySlugHandler(createSlugEvent(relatedCurrentPostSlug, 'zh-TW'))
        const data = result.data!

        expect(result.code).toBe(200)
        expect(data.relatedPosts?.map((item: { title: string, language: string }) => `${item.language}:${item.title}`)).toEqual([
            'zh-TW:同主题繁体推荐',
            'zh-CN:仅简体可用的相关文章',
            'en-US:英语标签匹配文章',
        ])
    })
})
