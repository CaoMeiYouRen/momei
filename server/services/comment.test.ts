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
            delete item[emailKey]
        }
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
            const mockComments = [
                { id: '1', postId: mockPostId, content: 'Comment 1', parentId: null, status: CommentStatus.PUBLISHED, authorEmail: '1@test.com' },
                { id: '2', postId: mockPostId, content: 'Comment 2', parentId: '1', status: CommentStatus.PUBLISHED, authorEmail: '2@test.com' },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                addOrderBy: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getMany: vi.fn().mockResolvedValue(mockComments),
            }

            mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await commentService.getCommentsByPostId(mockPostId, { isAdmin: true })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('1')
            expect(result[0].replies).toHaveLength(1)
            expect(result[0].replies[0].id).toBe('2')
            expect(result[0].authorEmail).toBe('1@test.com') // Admin should see email
        })

        it('should filter pending comments for non-admin viewers (Privacy Control)', async () => {
            const viewerEmail = 'viewer@test.com'
            const mockComments = [
                { id: '1', postId: mockPostId, content: 'Published', status: CommentStatus.PUBLISHED },
                { id: '2', postId: mockPostId, content: 'My Pending', status: CommentStatus.PENDING, authorEmail: viewerEmail },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
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
            expect(result[0].authorEmail).toBeUndefined() // Non-admin should NOT see email
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
            expect(tree[0].id).toBe('1')
            expect(tree[0].replies).toHaveLength(1)
            expect(tree[0].replies[0].id).toBe('2')
            expect(tree[0].authorEmail).toBeUndefined()
            expect(tree[0].ip).toBeUndefined()
        })
    })
})
