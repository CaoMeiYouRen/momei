import { describe, it, expect, beforeAll } from 'vitest'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { Category } from '@/server/entities/category'
import { Tag } from '@/server/entities/tag'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import { generateFeed } from '@/server/utils/feed'

describe('Feed Generation Utility', async () => {
    let author: User
    let category: Category
    let tag: Tag

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        // Clear tables to ensure isolation
        await dataSource.getRepository(Post).clear()
        await dataSource.getRepository(Category).clear()
        await dataSource.getRepository(Tag).clear()

        const userRepo = dataSource.getRepository(User)
        author = new User()
        author.name = 'Feed Author'
        author.email = `feed_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const catRepo = dataSource.getRepository(Category)
        category = new Category()
        category.name = 'RSS Tech'
        category.slug = 'rss-tech'
        category.language = 'en-US'
        await catRepo.save(category)

        const tagRepo = dataSource.getRepository(Tag)
        tag = new Tag()
        tag.name = 'FeedTag'
        tag.slug = 'feed-tag'
        tag.language = 'en-US'
        await tagRepo.save(tag)

        const postRepo = dataSource.getRepository(Post)

        // Post in ZH
        const postZh = new Post()
        postZh.title = 'RSS 中文文章'
        postZh.slug = 'rss-zh'
        postZh.content = '中文内容'
        postZh.language = 'zh-CN'
        postZh.status = PostStatus.PUBLISHED
        postZh.author = author
        postZh.publishedAt = new Date()
        await postRepo.save(postZh)

        // Post 1 in EN
        const postEn = new Post()
        postEn.title = 'RSS English Post'
        postEn.slug = 'rss-en-1'
        postEn.content = 'English content'
        postEn.language = 'en-US'
        postEn.status = PostStatus.PUBLISHED
        postEn.author = author
        postEn.category = category
        postEn.tags = [tag]
        postEn.publishedAt = new Date()
        await postRepo.save(postEn)

        // Post 2 in EN (Unique)
        const postEn2 = new Post()
        postEn2.title = 'RSS English Post 2'
        postEn2.slug = 'rss-en-2'
        postEn2.content = 'More English content'
        postEn2.language = 'en-US'
        postEn2.status = PostStatus.PUBLISHED
        postEn2.author = author
        postEn2.publishedAt = new Date()
        await postRepo.save(postEn2)
    })

    it('should generate global feed default to zh-CN (based on mock event)', async () => {
        const event = {
            path: '/feed.xml',
            headers: new Headers({ 'accept-language': 'zh-CN,zh;q=0.9' }),
            node: {
                req: { headers: { 'accept-language': 'zh-CN,zh;q=0.9' } },
            },
        } as any

        const feed = await generateFeed(event)
        expect(feed.options.title).toBe('墨梅博客')
        expect(feed.options.language).toBe('zh-CN')
        // Should only contain the ZH post
        expect(feed.items.length).toBe(1)
        expect(feed.items[0]!.title).toBe('RSS 中文文章')
    })

    it('should generate feed for specific language en-US', async () => {
        const event = {
            path: '/feed.xml?lang=en-US',
            query: { lang: 'en-US' },
            node: {
                req: { headers: {} },
            },
        } as any

        const feed = await generateFeed(event, { language: 'en-US' })
        expect(feed.options.language).toBe('en-US')
        expect(feed.items.length).toBe(2)
        expect(feed.items.some((i) => i.title === 'RSS English Post')).toBe(true)
        expect(feed.items.some((i) => i.title === 'RSS English Post 2')).toBe(true)
    })

    it('should filter by category', async () => {
        const event = {
            path: '/feed/category/rss-tech',
            node: {
                req: { headers: {} },
            },
        } as any

        const feed = await generateFeed(event, {
            categoryId: category.id,
            language: 'en-US',
        })
        expect(feed.items.length).toBe(1)
        expect(feed.items[0]!.title).toBe('RSS English Post')
    })

    it('should filter by tag', async () => {
        const event = {
            path: '/feed/tag/feed-tag',
            node: {
                req: { headers: {} },
            },
        } as any

        const feed = await generateFeed(event, {
            tagId: tag.id,
            language: 'en-US',
        })
        expect(feed.items.length).toBe(1)
        expect(feed.items[0]!.title).toBe('RSS English Post')
    })

    it('should generate podcast feed with audio enclosure and image in content', async () => {
        const postRepo = dataSource.getRepository(Post)
        const postPod = new Post()
        postPod.title = 'Podcast Episode'
        postPod.slug = 'podcast-ep'
        postPod.content = 'Episode content'
        postPod.language = 'en-US'
        postPod.status = PostStatus.PUBLISHED
        postPod.author = author
        postPod.audioUrl = 'https://example.com/audio.mp3'
        postPod.audioSize = 5000
        postPod.audioMimeType = 'audio/mpeg'
        postPod.coverImage = 'https://example.com/cover.png'
        postPod.publishedAt = new Date()
        await postRepo.save(postPod)

        const event = {
            path: '/feed/podcast.xml',
            node: { req: { headers: {} } },
        } as any

        const feed = await generateFeed(event, { language: 'en-US', isPodcast: true })

        const item = feed.items.find((i) => i.title === 'Podcast Episode')
        expect(item).toBeDefined()
        expect(item!.enclosure).toBeDefined()
        expect(item!.enclosure!.url).toBe('https://example.com/audio.mp3')
        expect(item!.image).toBeUndefined() // Should be undefined to avoid overwriting enclosure in RSS 2.0
        expect(item!.content).toContain('<img src="https://example.com/cover.png"')
    })
})
