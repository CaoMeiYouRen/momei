import { describe, it, expect, vi, beforeEach } from 'vitest'
import { commentService } from './comment'
import { CommentStatus } from '@/types/comment'
import { dataSource } from '@/server/database'
import { limiterStorage } from '@/server/database/storage'
import { getSettings } from '@/server/services/setting'

// Mock dataSource
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

vi.mock('@/server/services/setting', () => ({
    getSettings: vi.fn(),
}))

vi.mock('./notification', () => ({
    notifyAdmins: vi.fn().mockResolvedValue(undefined),
    sendInAppNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/utils/author', () => ({
    processAuthorPrivacy: vi.fn().mockImplementation((item: Record<string, unknown>, isAdmin: boolean, emailKey: string) => {
        if (!isAdmin) {
            return Object.fromEntries(Object.entries(item).filter(([key]) => key !== emailKey))
        }

        return item
    }),
}))

describe('commentService', () => {
    const mockPostId = 'post-1'
    const mockCommentRepo = {
        createQueryBuilder: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
    }
    const mockPostRepo = {
        findOne: vi.fn(),
        find: vi.fn(),
    }
    const mockSettingRepo = {
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSettings).mockResolvedValue({
            blacklisted_keywords: '',
            enable_comment_review: 'false',
            comment_interval: '0',
        })
        vi.mocked(limiterStorage.increment).mockResolvedValue(1)
        ;(dataSource.getRepository as any).mockImplementation((entity: any) => {
            if (entity.name === 'Comment') {
                return mockCommentRepo
            }
            if (entity.name === 'Post') {
                return mockPostRepo
            }
            if (entity.name === 'Setting') {
                return mockSettingRepo
            }
            return {}
        })
    })

    describe('getCommentsByPostId', () => {
        it('should fetch comments and build a tree for admin', async () => {
            mockPostRepo.findOne.mockResolvedValue({
                id: mockPostId,
                language: 'zh-CN',
                translationId: 'cluster-1',
                slug: 'sample-post',
                title: '中文文章',
            })
            mockPostRepo.find.mockResolvedValue([{ id: mockPostId }])

            const mockComments = [
                {
                    id: '1',
                    postId: mockPostId,
                    content: 'Comment 1',
                    parentId: null,
                    status: CommentStatus.PUBLISHED,
                    authorEmail: '1@test.com',
                    isSticked: false,
                    createdAt: '2026-04-20T00:00:00.000Z',
                    post: { id: mockPostId, language: 'zh-CN', title: '中文文章' },
                },
                {
                    id: '2',
                    postId: mockPostId,
                    content: 'Comment 2',
                    parentId: '1',
                    status: CommentStatus.PUBLISHED,
                    authorEmail: '2@test.com',
                    isSticked: false,
                    createdAt: '2026-04-20T00:10:00.000Z',
                    post: { id: mockPostId, language: 'zh-CN', title: '中文文章' },
                },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                addSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                addOrderBy: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockComments),
            }

            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentsByPostId(mockPostId, { isAdmin: true })

            expect(result).toHaveLength(1)
            expect(result[0]!.id).toBe('1')
            expect(result[0]!.replies).toHaveLength(1)
            expect(result[0]!.replies?.[0]!.id).toBe('2')
            expect(result[0]!.authorEmail).toBe('1@test.com') // Admin should see email
        })

        it('should filter pending comments for non-admin viewers (Privacy Control)', async () => {
            const viewerEmail = 'viewer@test.com'
            mockPostRepo.findOne.mockResolvedValue({
                id: mockPostId,
                language: 'zh-CN',
                translationId: 'cluster-1',
                slug: 'sample-post',
                title: '中文文章',
            })
            mockPostRepo.find.mockResolvedValue([{ id: mockPostId }])
            const mockComments = [
                {
                    id: '1',
                    postId: mockPostId,
                    content: 'Published',
                    status: CommentStatus.PUBLISHED,
                    isSticked: false,
                    createdAt: '2026-04-20T00:00:00.000Z',
                    post: { id: mockPostId, language: 'zh-CN', title: '中文文章' },
                },
                {
                    id: '2',
                    postId: mockPostId,
                    content: 'My Pending',
                    status: CommentStatus.PENDING,
                    authorEmail: viewerEmail,
                    isSticked: false,
                    createdAt: '2026-04-20T00:10:00.000Z',
                    post: { id: mockPostId, language: 'zh-CN', title: '中文文章' },
                },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                addSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                addOrderBy: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockComments),
            }

            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentsByPostId(mockPostId, {
                isAdmin: false,
                viewerEmail,
            })

            expect(mockQueryBuilder.andWhere).toHaveBeenCalled()
            expect(result).toHaveLength(2)
            expect(result[0]!.authorEmail).toBeUndefined() // Non-admin should NOT see email
        })

        it('should prioritize current language threads and expose fallback translation metadata', async () => {
            mockPostRepo.findOne.mockResolvedValue({
                id: mockPostId,
                language: 'en-US',
                translationId: 'cluster-1',
                slug: 'sample-post',
                title: 'English Post',
            })
            mockPostRepo.find.mockResolvedValue([
                { id: mockPostId },
                { id: 'post-2' },
            ])

            const mockComments = [
                {
                    id: '2',
                    postId: 'post-2',
                    content: '中文评论',
                    parentId: null,
                    status: CommentStatus.PUBLISHED,
                    isSticked: false,
                    createdAt: '2026-04-20T00:05:00.000Z',
                    translationCache: {
                        'en-US': {
                            content: 'Translated Chinese comment',
                            updatedAt: '2026-04-20T00:06:00.000Z',
                        },
                    },
                    post: { id: 'post-2', language: 'zh-CN', title: '中文文章' },
                },
                {
                    id: '1',
                    postId: mockPostId,
                    content: 'English comment',
                    parentId: null,
                    status: CommentStatus.PUBLISHED,
                    isSticked: false,
                    createdAt: '2026-04-20T00:00:00.000Z',
                    translationCache: null,
                    post: { id: mockPostId, language: 'en-US', title: 'English Post' },
                },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                addSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                addOrderBy: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockComments),
            }

            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentsByPostId(mockPostId, {
                isAdmin: false,
            })

            expect(result).toHaveLength(2)
            expect(result[0]!.id).toBe('1')
            expect(result[1]!.id).toBe('2')
            expect(result[1]!.sourceLanguage).toBe('zh-CN')
            expect(result[1]!.isCrossLocaleFallback).toBe(true)
            expect(result[1]!.preferredTranslation).toEqual({
                targetLanguage: 'en-US',
                content: 'Translated Chinese comment',
                updatedAt: '2026-04-20T00:06:00.000Z',
            })
        })
    })

    describe('createComment', () => {
        it('should create a published comment for logged-in user', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve(c))

            const commentData = {
                postId: mockPostId,
                content: 'Test content',
                authorName: 'User',
                authorEmail: 'user@test.com',
                authorId: 'user-1',
            }

            const result = await commentService.createComment(commentData)

            expect(result.status).toBe(CommentStatus.PUBLISHED)
            expect(mockCommentRepo.save).toHaveBeenCalled()
            expect(limiterStorage.increment).not.toHaveBeenCalled()
        })

        it('should create a pending comment for guest', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve(c))

            const commentData = {
                postId: mockPostId,
                content: 'Test content',
                authorName: 'Guest',
                authorEmail: 'guest@test.com',
                authorId: null,
            }

            const result = await commentService.createComment(commentData)

            expect(result.status).toBe(CommentStatus.PENDING)
            expect(mockCommentRepo.save).toHaveBeenCalled()
        })

        it('should reject comments posted within the configured interval', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: '',
                enable_comment_review: 'false',
                comment_interval: '60',
            })
            vi.mocked(limiterStorage.increment).mockResolvedValue(2)

            const commentData = {
                postId: mockPostId,
                content: 'Test content',
                authorName: 'Guest',
                authorEmail: 'guest@test.com',
                authorId: null,
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('评论过于频繁')
            expect(limiterStorage.increment).toHaveBeenCalledWith('comment_interval:email:guest@test.com', 60)
        })

        it('should support human readable comment intervals', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: '',
                enable_comment_review: 'false',
                comment_interval: '5m',
            })
            vi.mocked(limiterStorage.increment).mockResolvedValue(2)

            const commentData = {
                postId: mockPostId,
                content: 'Test content',
                authorName: 'Guest',
                authorEmail: 'guest@test.com',
                authorId: null,
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('评论过于频繁')
            expect(limiterStorage.increment).toHaveBeenCalledWith('comment_interval:email:guest@test.com', 300)
        })

        it('should throw error if post not found', async () => {
            mockPostRepo.findOne.mockResolvedValue(null)

            const commentData = {
                postId: 'invalid',
                content: 'Test content',
                authorName: 'Guest',
                authorEmail: 'guest@test.com',
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('Post not found')
        })
    })

    describe('buildCommentTree', () => {
        it('should correctly nest replies and strip private info for non-admins', async () => {
            const comments = [
                { id: '1', parentId: null, authorEmail: '1@test.com', ip: '1.1.1.1' },
                { id: '2', parentId: '1', authorEmail: '2@test.com', ip: '2.2.2.2' },
            ] as any

            const tree = await commentService.buildCommentTree(comments, false)

            expect(tree).toHaveLength(1)
            expect(tree[0]!.id).toBe('1')
            expect(tree[0]!.replies).toHaveLength(1)
            expect(tree[0]!.replies?.[0]!.id).toBe('2')
            expect(tree[0]!.authorEmail).toBeUndefined()
            expect(tree[0]!.ip).toBeUndefined()
        })

        it('should keep IP and userAgent visible for admins', async () => {
            const comments = [
                { id: '1', parentId: null, authorEmail: 'admin@test.com', ip: '10.0.0.1', userAgent: 'Chrome' },
            ] as any

            const tree = await commentService.buildCommentTree(comments, true)

            expect(tree).toHaveLength(1)
            expect(tree[0]!.id).toBe('1')
            expect(tree[0]!.authorEmail).toBe('admin@test.com') // Admin sees email
            expect(tree[0]!.ip).toBe('10.0.0.1') // Admin sees IP
            expect(tree[0]!.userAgent).toBe('Chrome') // Admin sees user agent
        })

        it('should sort threads by language priority and sticked status', async () => {
            const comments: any[] = [
                { id: '1', postId: 'post-2', parentId: null, authorEmail: 'a@test.com', isSticked: false, createdAt: '2026-05-01T00:00:00.000Z', post: { id: 'post-2', language: 'zh-CN', title: '中文' } },
                { id: '2', postId: 'post-1', parentId: null, authorEmail: 'b@test.com', isSticked: false, createdAt: '2026-04-01T00:00:00.000Z', post: { id: 'post-1', language: 'en-US', title: 'English' } },
                { id: '3', postId: 'post-1', parentId: null, authorEmail: 'c@test.com', isSticked: true, createdAt: '2026-03-01T00:00:00.000Z', post: { id: 'post-1', language: 'en-US', title: 'English' } },
            ]

            const context = { currentPostId: 'post-1', currentLanguage: 'en-US' as any }
            const tree = await commentService.buildCommentTree(comments, true, context as any)

            // Pinned first, then current language, then other languages, then by date
            expect(tree[0]!.id).toBe('3') // Pinned
            expect(tree[1]!.id).toBe('2') // en-US (matches current language), earlier date
            expect(tree[2]!.id).toBe('1') // zh-CN (cross-locale fallback)
            expect(tree[1]!.isCrossLocaleFallback).toBe(false) // postId matches context
            expect(tree[2]!.isCrossLocaleFallback).toBe(true) // postId differs from context
        })
    })

    describe('getCommentById', () => {
        it('should fetch single comment with visibility filter', async () => {
            const mockComment = { id: 'comment-1', content: 'Test', postId: 'post-1' }
            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getOne: vi.fn().mockResolvedValue(mockComment),
            }
            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentById('comment-1', { isAdmin: true })

            expect(result).toEqual(mockComment)
            expect(mockQueryBuilder.getOne).toHaveBeenCalled()
        })

        it('should return null for non-existent comment', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getOne: vi.fn().mockResolvedValue(null),
            }
            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentById('non-existent')

            expect(result).toBeNull()
        })
    })

    describe('deleteComment', () => {
        it('should delete comment by id', async () => {
            mockCommentRepo.delete.mockResolvedValue({ affected: 1 })

            await commentService.deleteComment('comment-1')

            expect(mockCommentRepo.delete).toHaveBeenCalledWith('comment-1')
        })
    })

    describe('createComment - additional branch coverage', () => {
        it('should reject comments with blacklisted keywords', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: 'spam,bad word',
                enable_comment_review: 'false',
                comment_interval: '0',
            })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve(c))

            const commentData = {
                postId: mockPostId,
                content: 'This contains spam content',
                authorName: 'User',
                authorEmail: 'user@test.com',
                authorId: 'user-1',
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('评论包含不当内容')
        })

        it('should set all comments to pending when review mode is enabled', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId, authorId: 'author-1', title: 'Test Post' })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: '',
                enable_comment_review: 'true',
                comment_interval: '0',
            })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve({ ...c, id: 'new-comment-1' }))

            const commentData = {
                postId: mockPostId,
                content: 'Needs review',
                authorName: 'User',
                authorEmail: 'user@test.com',
                authorId: 'user-1',
            }

            const result = await commentService.createComment(commentData)

            expect(result.status).toBe(CommentStatus.PENDING) // Even logged-in user's comment is pending in review mode
        })

        it('should send in-app notification to post author when post has authorId', async () => {
            const { sendInAppNotification } = await import('./notification')
            vi.mocked(sendInAppNotification).mockResolvedValue({} as any)

            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId, authorId: 'author-1', title: 'Test Post', slug: 'test-post' })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve({
                ...c,
                id: 'new-comment-1',
                authorName: 'Commenter',
                content: 'Great post!',
            }))

            const commentData = {
                postId: mockPostId,
                content: 'Great post!',
                authorName: 'Commenter',
                authorEmail: 'commenter@test.com',
                authorId: 'user-2', // Different from post author
            }

            await commentService.createComment(commentData)

            expect(sendInAppNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'author-1',
                    type: 'COMMENT_REPLY',
                }),
            )
        })

        it('should not send notification when comment is by the post author themselves', async () => {
            const { sendInAppNotification } = await import('./notification')
            vi.mocked(sendInAppNotification).mockClear()

            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId, authorId: 'author-1', title: 'Test Post' })
            mockCommentRepo.save.mockImplementation((c) => Promise.resolve({
                ...c,
                id: 'self-comment',
                authorName: 'Author',
                content: 'Self comment',
            }))

            const commentData = {
                postId: mockPostId,
                content: 'Self comment',
                authorName: 'Author',
                authorEmail: 'author@test.com',
                authorId: 'author-1', // Same as post author
            }

            await commentService.createComment(commentData)

            // Should NOT send notification to self
            expect(sendInAppNotification).not.toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'author-1' }),
            )
        })

        it('should use user-based interval key when authorId is provided', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: '',
                enable_comment_review: 'false',
                comment_interval: '30',
            })
            vi.mocked(limiterStorage.increment).mockResolvedValue(2)

            const commentData = {
                postId: mockPostId,
                content: 'Test',
                authorName: 'User',
                authorEmail: 'user@test.com',
                authorId: 'user-1',
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('评论过于频繁')
            expect(limiterStorage.increment).toHaveBeenCalledWith('comment_interval:user:user-1', 30)
        })

        it('should use IP-based interval key when no authorId or email', async () => {
            mockPostRepo.findOne.mockResolvedValue({ id: mockPostId })
            vi.mocked(getSettings).mockResolvedValue({
                blacklisted_keywords: '',
                enable_comment_review: 'false',
                comment_interval: '30',
            })
            vi.mocked(limiterStorage.increment).mockResolvedValue(2)

            const commentData = {
                postId: mockPostId,
                content: 'Test',
                authorName: 'Guest',
                authorEmail: '',
                ip: '192.168.1.1',
            }

            await expect(commentService.createComment(commentData)).rejects.toThrow('评论过于频繁')
            expect(limiterStorage.increment).toHaveBeenCalledWith('comment_interval:ip:192.168.1.1', 30)
        })

        it('should refresh mocked module references after createComment test sequence', () => {
            // Re-mock notification module to ensure it's properly referenced
            vi.doMock('./notification', () => ({
                notifyAdmins: vi.fn().mockResolvedValue(undefined),
                sendInAppNotification: vi.fn().mockResolvedValue(undefined),
            }))
        })
    })

    describe('viewerId visibility filter', () => {
        it('should allow viewer to see their own pending comments via viewerId', async () => {
            const viewerId = 'viewer-123'
            mockPostRepo.findOne.mockResolvedValue({
                id: mockPostId,
                language: 'zh-CN',
                translationId: 'cluster-1',
                slug: 'sample-post',
                title: '中文文章',
            })
            mockPostRepo.find.mockResolvedValue([{ id: mockPostId }])

            const mockComments = [
                { id: '1', postId: mockPostId, content: 'Published', status: CommentStatus.PUBLISHED, isSticked: false, createdAt: '2026-04-20T00:00:00.000Z', post: { id: mockPostId, language: 'zh-CN', title: '中文文章' } },
                { id: '2', postId: mockPostId, content: 'My Pending', status: CommentStatus.PENDING, authorId: viewerId, isSticked: false, createdAt: '2026-04-20T00:10:00.000Z', post: { id: mockPostId, language: 'zh-CN', title: '中文文章' } },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                addSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                addOrderBy: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockComments),
            }

            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentsByPostId(mockPostId, {
                isAdmin: false,
                viewerId,
            })

            expect(result).toHaveLength(2)
        })
    })
})
