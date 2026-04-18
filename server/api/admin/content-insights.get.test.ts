import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './content-insights.get'
import { dataSource } from '@/server/database'
import { Comment } from '@/server/entities/comment'
import { Post } from '@/server/entities/post'
import {
    buildAdminContentInsights,
    resolveAdminContentInsightsTimeZone,
} from '@/server/utils/admin-content-insights'
import { requireAdminOrAuthor } from '@/server/utils/permission'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/permission', () => ({
    requireAdminOrAuthor: vi.fn(),
}))

vi.mock('@/server/utils/admin-content-insights', () => ({
    buildAdminContentInsights: vi.fn(),
    resolveAdminContentInsightsTimeZone: vi.fn(),
}))

function createPostQueryBuilder(posts: any[]) {
    const queryBuilder: Record<string, any> = {
        leftJoinAndSelect: vi.fn(),
        select: vi.fn(),
        andWhere: vi.fn(),
        getMany: vi.fn().mockResolvedValue(posts),
    }

    Object.keys(queryBuilder).forEach((key) => {
        if (key !== 'getMany') {
            queryBuilder[key].mockReturnValue(queryBuilder)
        }
    })

    return queryBuilder
}

function createCommentQueryBuilder(rows: { postId: string, count: string }[]) {
    const queryBuilder: Record<string, any> = {
        select: vi.fn(),
        addSelect: vi.fn(),
        where: vi.fn(),
        andWhere: vi.fn(),
        groupBy: vi.fn(),
        getRawMany: vi.fn().mockResolvedValue(rows),
    }

    Object.keys(queryBuilder).forEach((key) => {
        if (key !== 'getRawMany') {
            queryBuilder[key].mockReturnValue(queryBuilder)
        }
    })

    return queryBuilder
}

describe('GET /api/admin/content-insights', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getQuery', vi.fn((event: { query?: unknown }) => event.query || {}))
    })

    it('应为 author 收紧到本人内容，并把 public 范围与 locale 过滤传入聚合器', async () => {
        const posts = [{ id: 'post-1', title: 'First post' }]
        const postQueryBuilder = createPostQueryBuilder(posts)
        const commentQueryBuilder = createCommentQueryBuilder([{ postId: 'post-1', count: '3' }])

        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: {
                id: 'author-1',
                role: 'author',
            },
        } as never)
        vi.mocked(resolveAdminContentInsightsTimeZone).mockReturnValue('Asia/Tokyo')
        vi.mocked(buildAdminContentInsights).mockReturnValue({ ok: true } as never)
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === Post) {
                return {
                    createQueryBuilder: vi.fn(() => postQueryBuilder),
                } as never
            }

            if (entity === Comment) {
                return {
                    createQueryBuilder: vi.fn(() => commentQueryBuilder),
                } as never
            }

            throw new Error('Unexpected repository request')
        })

        const result = await handler({
            query: {
                range: '7',
                scope: 'public',
                contentLanguage: 'en-US',
                language: 'ja-JP',
                timezone: 'Asia/Tokyo',
            },
        } as never)

        expect(postQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.category', 'category')
        expect(postQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('post.tags', 'tag')
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith('post.authorId = :authorId', { authorId: 'author-1' })
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith('post.language = :contentLanguage', {
            contentLanguage: 'en-US',
        })
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith('post.status = :publishedStatus', {
            publishedStatus: 'published',
        })
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith('post.visibility = :publicVisibility', {
            publicVisibility: 'public',
        })
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith(
            'post.publishedAt BETWEEN :minWindowStart AND :maxWindowEnd',
            expect.objectContaining({
                minWindowStart: expect.any(Date),
                maxWindowEnd: expect.any(Date),
            }),
        )

        expect(commentQueryBuilder.where).toHaveBeenCalledWith('comment.postId IN (:...postIds)', {
            postIds: ['post-1'],
        })
        expect(commentQueryBuilder.andWhere).toHaveBeenCalledWith('comment.status != :spamStatus', {
            spamStatus: 'spam',
        })

        expect(buildAdminContentInsights).toHaveBeenCalledWith(posts, { 'post-1': 3 }, {
            selectedRange: 7,
            scope: 'public',
            timezone: 'Asia/Tokyo',
            preferredLocale: 'ja-JP',
            contentLanguage: 'en-US',
        })
        expect(result).toEqual({ ok: true })
    })

    it('应对 admin 使用默认 query，并在无帖子时跳过评论聚合', async () => {
        const postQueryBuilder = createPostQueryBuilder([])
        const commentRepo = {
            createQueryBuilder: vi.fn(),
        }

        vi.mocked(requireAdminOrAuthor).mockResolvedValue({
            user: {
                id: 'admin-1',
                role: 'admin',
            },
        } as never)
        vi.mocked(resolveAdminContentInsightsTimeZone).mockReturnValue('UTC')
        vi.mocked(buildAdminContentInsights).mockReturnValue({ empty: true } as never)
        vi.mocked(dataSource.getRepository).mockImplementation((entity: unknown) => {
            if (entity === Post) {
                return {
                    createQueryBuilder: vi.fn(() => postQueryBuilder),
                } as never
            }

            if (entity === Comment) {
                return commentRepo as never
            }

            throw new Error('Unexpected repository request')
        })

        const result = await handler({ query: {} } as never)

        expect(postQueryBuilder.andWhere).not.toHaveBeenCalledWith('post.authorId = :authorId', expect.anything())
        expect(postQueryBuilder.andWhere).toHaveBeenCalledWith(
            'COALESCE(post.publishedAt, post.createdAt) BETWEEN :minWindowStart AND :maxWindowEnd',
            expect.objectContaining({
                minWindowStart: expect.any(Date),
                maxWindowEnd: expect.any(Date),
            }),
        )
        expect(commentRepo.createQueryBuilder).not.toHaveBeenCalled()
        expect(buildAdminContentInsights).toHaveBeenCalledWith([], {}, {
            selectedRange: 30,
            scope: 'all',
            timezone: 'UTC',
            preferredLocale: undefined,
            contentLanguage: undefined,
        })
        expect(result).toEqual({ empty: true })
    })
})
