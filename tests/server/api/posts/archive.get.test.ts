import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import archiveHandler from '@/server/api/posts/archive.get'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import { invalidateRuntimeApiCacheNamespace, resetRuntimeApiCacheStats } from '@/server/utils/api-runtime-cache'

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn().mockResolvedValue(null),
        },
    },
}))

describe('/api/posts/archive', () => {
    beforeEach(() => {
        invalidateRuntimeApiCacheNamespace('posts:archive')
        resetRuntimeApiCacheStats('posts:archive')
    })

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        const userRepo = dataSource.getRepository(User)
        const postRepo = dataSource.getRepository(Post)

        const author = new User()
        author.name = 'Archive Test Author'
        author.email = `archive_author_${generateRandomString(5)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const post = new Post()
        post.title = 'Archive Published Post'
        post.slug = `archive-${generateRandomString(8)}`
        post.content = 'Archive content'
        post.summary = 'Archive summary'
        post.status = PostStatus.PUBLISHED
        post.author = author
        post.language = 'zh-CN'
        post.publishedAt = new Date('2026-05-20T08:00:00.000Z')
        await postRepo.save(post)
    })

    it('should skip posts_per_page lookup when archive limit is explicitly provided', async () => {
        const settingService = await import('@/server/services/setting')
        const getSettingSpy = vi.spyOn(settingService, 'getSetting')

        try {
            const result = await archiveHandler({
                context: {},
                node: {
                    req: { headers: {} },
                    res: { setHeader: vi.fn() },
                },
                req: { headers: {} },
                query: {
                    scope: 'public',
                    limit: 3,
                },
            } as any)

            expect(result.code).toBe(200)
            expect(getSettingSpy).not.toHaveBeenCalled()
        } finally {
            getSettingSpy.mockRestore()
        }
    })

    it('should use posts_per_page when archive limit is omitted', async () => {
        const settingService = await import('@/server/services/setting')
        const getSettingSpy = vi.spyOn(settingService, 'getSetting')

        try {
            const result = await archiveHandler({
                context: {},
                node: {
                    req: { headers: {} },
                    res: { setHeader: vi.fn() },
                },
                req: { headers: {} },
                query: {
                    scope: 'public',
                },
            } as any)

            expect(result.code).toBe(200)
            expect(getSettingSpy).toHaveBeenCalledWith('posts_per_page', '10')
        } finally {
            getSettingSpy.mockRestore()
        }
    })
})
