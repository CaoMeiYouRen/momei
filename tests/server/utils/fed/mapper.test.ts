import { describe, it, expect, vi } from 'vitest'
import { postToNote, buildCollection } from '@/server/utils/fed/mapper'
import type { User } from '@/server/entities/user'
import type { Post } from '@/server/entities/post'

// Mock 加密工具
vi.mock('@/server/utils/fed/crypto', () => ({
    getOrCreateUserKeyPair: vi.fn().mockResolvedValue({
        publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----',
    }),
}))

describe('Fed Mapper Utils', () => {
    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        image: 'https://example.com/avatar.webp',
        createdAt: new Date('2024-01-01'),
    } as User

    const mockPostBase = {
        id: 'post-123',
        title: 'Test Post Title',
        slug: 'test-post-slug',
        content: '# Hello World\n\nThis is **test** content.',
        summary: 'Test post summary',
        coverImage: 'https://example.com/cover.webp',
        publishedAt: new Date('2024-06-15T10:00:00Z'),
        createdAt: new Date('2024-06-14T08:00:00Z'),
        updatedAt: new Date('2024-06-15T09:00:00Z'),
        author: mockUser,
        tags: [
            { id: 'tag-1', name: 'TypeScript', slug: 'typescript' },
            { id: 'tag-2', name: 'Vue', slug: 'vue' },
        ],
        category: { id: 'cat-1', name: 'Tech', slug: 'tech' },
    }

    const createMockPost = (overrides: Partial<Post> = {}): Post => Object.assign({}, mockPostBase, overrides) as Post
    const mockPost = createMockPost()

    const siteUrl = 'https://example.com'

    describe('postToNote', () => {
        it('应该正确转换 Post 到 Note', () => {
            const note = postToNote(mockPost, siteUrl)

            expect(note.id).toBe(`${siteUrl}/fed/note/${mockPost.id}`)
            expect(note.type).toBe('Article')
            expect(note.name).toBe(mockPost.title)
            expect(note.url).toBe(`${siteUrl}/posts/${mockPost.slug}`)
            expect(note.attributedTo).toBe(`${siteUrl}/fed/actor/${mockUser.username}`)
            expect(note.to).toContain('https://www.w3.org/ns/activitystreams#Public')
        })

        it('应该渲染 Markdown 为 HTML', () => {
            const note = postToNote(mockPost, siteUrl)

            // content 应该是渲染后的 HTML，包含 <h1> 标签
            expect(note.content).toContain('<h1>')
            expect(note.content).toContain('Hello World')
            expect(note.content).toContain('<strong>')
            expect(note.content).toContain('test')
        })

        it('应该包含封面图附件', () => {
            const note = postToNote(mockPost, siteUrl)
            const firstAttachment = note.attachment?.[0]

            expect(note.attachment).toBeDefined()
            expect(note.attachment).toHaveLength(1)
            expect(firstAttachment).toBeDefined()
            expect(firstAttachment?.type).toBe('Image')
            expect(firstAttachment?.url).toBe(mockPost.coverImage)
        })

        it('应该包含标签', () => {
            const note = postToNote(mockPost, siteUrl)

            expect(note.tag).toBeDefined()
            expect(note.tag!.length).toBeGreaterThanOrEqual(2) // 至少有 2 个标签
            expect(note.tag!.some((t) => t.name === '#TypeScript')).toBe(true)
            expect(note.tag!.some((t) => t.name === '#Vue')).toBe(true)
        })

        it('应该包含分类作为标签', () => {
            const note = postToNote(mockPost, siteUrl)

            expect(note.tag!.some((t) => t.name === '#Tech')).toBe(true)
        })

        it('应该处理没有封面图的文章', () => {
            const postWithoutCover = createMockPost({ coverImage: null })
            const note = postToNote(postWithoutCover, siteUrl)

            expect(note.attachment).toBeUndefined()
        })

        it('应该处理没有标签的文章', () => {
            const postWithoutTags = createMockPost({ tags: [] })
            const note = postToNote(postWithoutTags, siteUrl)

            // 应该至少有分类标签
            expect(note.tag!.some((t) => t.name === '#Tech')).toBe(true)
        })

        it('应该使用 publishedAt 作为发布时间', () => {
            const note = postToNote(mockPost, siteUrl)

            expect(note.published).toBe(mockPost.publishedAt!.toISOString())
        })

        it('应该在缺少 publishedAt 时使用 createdAt', () => {
            const postWithoutPublishedAt = createMockPost({ publishedAt: null })
            const note = postToNote(postWithoutPublishedAt, siteUrl)

            expect(note.published).toBe(mockPost.createdAt.toISOString())
        })
    })

    describe('buildCollection', () => {
        it('应该构建正确的 Collection 对象', () => {
            const collection = buildCollection('followers', 'testuser', 42, siteUrl)

            expect(collection.id).toBe(`${siteUrl}/fed/actor/testuser/followers`)
            expect(collection.type).toBe('Collection')
            expect(collection.totalItems).toBe(42)
            expect(collection.first).toBe(`${siteUrl}/fed/actor/testuser/followers?page=1`)
        })

        it('应该支持 following 类型', () => {
            const collection = buildCollection('following', 'testuser', 10, siteUrl)

            expect(collection.id).toBe(`${siteUrl}/fed/actor/testuser/following`)
            expect(collection.totalItems).toBe(10)
        })
    })
})
