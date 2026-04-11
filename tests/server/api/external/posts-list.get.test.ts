import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dataSource } from '@/server/database'
import { Category } from '@/server/entities/category'
import { Post } from '@/server/entities/post'
import { Tag } from '@/server/entities/tag'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'

const { validateApiKeyRequest } = vi.hoisted(() => ({
    validateApiKeyRequest: vi.fn(),
}))

vi.mock('@/server/utils/validate-api-key', () => ({
    validateApiKeyRequest,
}))

import postsListHandler from '@/server/api/external/posts.get'

describe('external posts list api', () => {
    let author: User
    let otherAuthor: User
    let category: Category
    let tag: Tag

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)

        author = new User()
        author.name = 'External Author'
        author.email = `external_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        otherAuthor = new User()
        otherAuthor.name = 'Other Author'
        otherAuthor.email = `other_${generateRandomString(5)}@example.com`
        otherAuthor.role = 'author'
        await userRepo.save(otherAuthor)

        const categoryRepo = dataSource.getRepository(Category)
        category = new Category()
        category.name = 'External Category'
        category.slug = `external-category-${generateRandomString(4)}`
        category.language = 'en-US'
        await categoryRepo.save(category)

        const tagRepo = dataSource.getRepository(Tag)
        tag = new Tag()
        tag.name = 'External Tag'
        tag.slug = `external-tag-${generateRandomString(4)}`
        tag.language = 'en-US'
        await tagRepo.save(tag)

        const postRepo = dataSource.getRepository(Post)

        const ownPost = new Post()
        ownPost.title = 'External Own Post'
        ownPost.slug = `external-own-${generateRandomString(6)}`
        ownPost.content = 'Should not be returned in list payload'
        ownPost.summary = 'Own summary'
        ownPost.status = PostStatus.PUBLISHED
        ownPost.author = author
        ownPost.category = category
        ownPost.tags = [tag]
        ownPost.language = 'en-US'
        ownPost.publishedAt = new Date()
        await postRepo.save(ownPost)

        const otherPost = new Post()
        otherPost.title = 'External Other Post'
        otherPost.slug = `external-other-${generateRandomString(6)}`
        otherPost.content = 'Should not be visible to author api key'
        otherPost.summary = 'Other summary'
        otherPost.status = PostStatus.PUBLISHED
        otherPost.author = otherAuthor
        otherPost.category = category
        otherPost.tags = [tag]
        otherPost.language = 'en-US'
        otherPost.publishedAt = new Date()
        await postRepo.save(otherPost)
    })

    beforeEach(() => {
        vi.clearAllMocks()
        validateApiKeyRequest.mockResolvedValue({
            user: {
                id: author.id,
                role: 'author',
            },
        })
    })

    it('should return only the api key owner posts and keep list payload slim', async () => {
        const previous = process.env.NUXT_PUBLIC_POSTS_PER_PAGE
        process.env.NUXT_PUBLIC_POSTS_PER_PAGE = '1'

        try {
            const result = await postsListHandler({
                query: {},
            } as never)

            expect(validateApiKeyRequest).toHaveBeenCalled()
            expect(result.code).toBe(200)
            expect(result.data.limit).toBe(1)
            expect(result.data.total).toBeGreaterThan(0)
            expect(result.data.items.every((item: any) => item.authorId === author.id)).toBe(true)
            expect(result.data.items[0]?.content).toBeUndefined()
            expect(result.data.items[0]?.category?.slug).toBe(category.slug)
            expect(result.data.items[0]?.tags?.[0]?.slug).toBe(tag.slug)
        } finally {
            if (previous === undefined) {
                delete process.env.NUXT_PUBLIC_POSTS_PER_PAGE
            } else {
                process.env.NUXT_PUBLIC_POSTS_PER_PAGE = previous
            }
        }
    })
})
