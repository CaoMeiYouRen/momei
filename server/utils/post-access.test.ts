import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Brackets } from 'typeorm'
import { applyPostVisibilityFilter, checkPostAccess } from './post-access'
import { PostStatus, PostVisibility } from '@/types/post'
import type { Post } from '@/server/entities/post'
import { UserRole } from '@/utils/shared/roles'
import { dataSource } from '@/server/database'

// Mock dataSource
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: false,
        initialize: vi.fn(),
    },
}))

describe('post-access utils', () => {
    const mockRepo = {
        findOne: vi.fn(),
    }

    type MockPostOverrides = Partial<Post> & {
        html?: string
    }

    const mockPostBase = {
        id: '1',
        title: 'Test Post',
        content: 'Test Content',
        html: '<p>Test Content</p>',
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        authorId: 'author-1',
        password: null,
    }

    const createPost = (overrides: MockPostOverrides = {}): Post => Object.assign({}, mockPostBase, overrides) as unknown as Post
    const mockPost = createPost()

    const createQueryBuilderMock = () => ({
        andWhere: vi.fn().mockReturnThis(),
    })

    const extractBracketConditions = (input: unknown) => {
        expect(input).toBeInstanceOf(Brackets)

        const conditions: string[] = []
        const bracketBuilder = {
            where(condition: string) {
                conditions.push(condition)
                return bracketBuilder
            },
            orWhere(condition: string) {
                conditions.push(condition)
                return bracketBuilder
            },
        }

        ;(input as Brackets & { whereFactory: (builder: typeof bracketBuilder) => void }).whereFactory(bracketBuilder)

        return conditions
    }

    beforeEach(() => {
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        mockRepo.findOne.mockReset()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('applyPostVisibilityFilter', () => {
        it('应该在管理模式下不追加任何过滤条件', async () => {
            const qb = createQueryBuilderMock()

            const result = await applyPostVisibilityFilter(qb as any, { id: 'user-1', role: UserRole.AUTHOR }, 'manage')

            expect(result).toBe(qb)
            expect(qb.andWhere).not.toHaveBeenCalled()
        })

        it('应该在订阅源模式下仅保留已发布公开文章', async () => {
            const qb = createQueryBuilderMock()

            await applyPostVisibilityFilter(qb as any, undefined, 'feed')

            expect(qb.andWhere).toHaveBeenNthCalledWith(1, 'post.status = :status', { status: PostStatus.PUBLISHED })
            expect(qb.andWhere).toHaveBeenNthCalledWith(2, 'post.visibility = :visibility', { visibility: PostVisibility.PUBLIC })
        })

        it('应该在匿名公共列表中过滤掉注册态和订阅态文章', async () => {
            const qb = createQueryBuilderMock()

            await applyPostVisibilityFilter(qb as any, undefined, 'public')

            expect(qb.andWhere).toHaveBeenNthCalledWith(1, 'post.status = :status', { status: PostStatus.PUBLISHED })

            const conditions = extractBracketConditions(qb.andWhere.mock.calls[1]?.[0])

            expect(conditions).toContain('post.visibility = :publicVisibility')
            expect(conditions).toContain('post.visibility = :passwordVisibility')
            expect(conditions).not.toContain('post.authorId = :currentUserId')
            expect(conditions).not.toContain('post.visibility = :registeredVisibility')
            expect(conditions).not.toContain('post.visibility = :subscriberVisibility')
        })

        it('应该在已登录但未订阅的公共列表中放行注册态并继续拦截订阅态文章', async () => {
            const qb = createQueryBuilderMock()
            mockRepo.findOne.mockResolvedValue(null)

            await applyPostVisibilityFilter(qb as any, { id: 'user-1', role: UserRole.USER }, 'public')

            const conditions = extractBracketConditions(qb.andWhere.mock.calls[1]?.[0])

            expect(conditions).toContain('post.authorId = :currentUserId')
            expect(conditions).toContain('post.visibility = :registeredVisibility')
            expect(conditions).toContain('post.visibility = :passwordVisibility')
            expect(conditions).not.toContain('post.visibility = :subscriberVisibility')
        })

        it('应该在订阅用户公共列表中放行作者、注册态和订阅态文章', async () => {
            const qb = createQueryBuilderMock()
            mockRepo.findOne.mockResolvedValue({ userId: 'user-1', isActive: true })

            await applyPostVisibilityFilter(qb as any, { id: 'user-1', role: UserRole.USER }, 'public')

            expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1', isActive: true } })

            const conditions = extractBracketConditions(qb.andWhere.mock.calls[1]?.[0])

            expect(conditions).toContain('post.authorId = :currentUserId')
            expect(conditions).toContain('post.visibility = :registeredVisibility')
            expect(conditions).toContain('post.visibility = :subscriberVisibility')
            expect(conditions).toContain('post.visibility = :passwordVisibility')
        })

        it('应该在订阅状态查询失败时显式抛错而不是静默降级', async () => {
            const qb = createQueryBuilderMock()
            mockRepo.findOne.mockRejectedValue(new Error('db unavailable'))

            await expect(applyPostVisibilityFilter(
                qb as any,
                { id: 'user-1', role: UserRole.USER },
                'public',
            )).rejects.toThrow('Failed to resolve subscriber status')
        })
    })

    describe('checkPostAccess', () => {
        it('应该允许管理员访问任何文章', async () => {
            const adminSession = {
                user: { id: 'admin-1', role: UserRole.ADMIN },
            }

            const result = await checkPostAccess(mockPost, adminSession)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该允许作者访问自己的文章', async () => {
            const authorSession = {
                user: { id: 'author-1', role: UserRole.AUTHOR },
            }

            const result = await checkPostAccess(mockPost, authorSession)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该拒绝访问未发布的文章并返回 404', async () => {
            const draftPost = createPost({ status: PostStatus.DRAFT })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            const result = await checkPostAccess(draftPost, userSession)

            expect(result.allowed).toBe(false)
            expect(result.shouldNotFound).toBe(true)
        })

        it('应该拒绝访问私有文章并返回 404', async () => {
            const privatePost = createPost({ visibility: PostVisibility.PRIVATE })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            const result = await checkPostAccess(privatePost, userSession)

            expect(result.allowed).toBe(false)
            expect(result.shouldNotFound).toBe(true)
        })

        it('应该允许访问公开文章', async () => {
            const publicPost = createPost({ visibility: PostVisibility.PUBLIC })

            const result = await checkPostAccess(publicPost, null)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该拒绝未登录用户访问登录可见文章', async () => {
            const registeredPost = createPost({ visibility: PostVisibility.REGISTERED })

            const result = await checkPostAccess(registeredPost, null)

            expect(result.allowed).toBe(false)
            expect(result.shouldNotFound).toBe(false)
            expect(result.reason).toBe('AUTH_REQUIRED')
            expect(result.data).toBeDefined()
            expect(result.data?.content).toBeUndefined()
        })

        it('应该允许已登录用户访问登录可见文章', async () => {
            const registeredPost = createPost({ visibility: PostVisibility.REGISTERED })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            const result = await checkPostAccess(registeredPost, userSession)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该拒绝未解锁的密码保护文章', async () => {
            const passwordPost = createPost({
                visibility: PostVisibility.PASSWORD,
                password: 'secret',
            })

            const result = await checkPostAccess(passwordPost, null, [])

            expect(result.allowed).toBe(false)
            expect(result.shouldNotFound).toBe(false)
            expect(result.reason).toBe('PASSWORD_REQUIRED')
            expect(result.data).toBeDefined()
            expect(result.data?.content).toBeUndefined()
            expect(result.data?.password).toBeUndefined()
        })

        it('应该允许访问已解锁的密码保护文章', async () => {
            const passwordPost = createPost({
                visibility: PostVisibility.PASSWORD,
                password: 'secret',
            })

            const result = await checkPostAccess(passwordPost, null, ['1'])

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该拒绝非订阅者访问订阅可见文章', async () => {
            const subscriberPost = createPost({ visibility: PostVisibility.SUBSCRIBER })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            // Mock subscriber check to return false
            vi.mocked(mockRepo.findOne).mockResolvedValue(null)

            const result = await checkPostAccess(subscriberPost, userSession)

            expect(result.allowed).toBe(false)
            expect(result.shouldNotFound).toBe(false)
            expect(result.reason).toBe('SUBSCRIPTION_REQUIRED')
        })

        it('应该允许订阅者访问订阅可见文章', async () => {
            const subscriberPost = createPost({ visibility: PostVisibility.SUBSCRIBER })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            // Mock subscriber check to return true
            vi.mocked(mockRepo.findOne).mockResolvedValue({
                userId: 'user-1',
                isActive: true,
            })

            const result = await checkPostAccess(subscriberPost, userSession)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
        })

        it('应该在订阅状态查询失败时抛出显式错误而不是伪装为未订阅', async () => {
            const subscriberPost = createPost({ visibility: PostVisibility.SUBSCRIBER })
            const userSession = {
                user: { id: 'user-1', role: UserRole.USER },
            }

            mockRepo.findOne.mockRejectedValue(new Error('db unavailable'))

            await expect(checkPostAccess(subscriberPost, userSession)).rejects.toThrow('Failed to resolve subscriber status')
        })

        it('应该过滤敏感数据当访问被拒绝时', async () => {
            const passwordPost = createPost({
                visibility: PostVisibility.PASSWORD,
                password: 'secret',
                content: 'Secret Content',
                html: '<p>Secret Content</p>',
            })

            const result = await checkPostAccess(passwordPost, null, [])

            expect(result.data).toBeDefined()
            expect(result.data?.content).toBeUndefined()
            expect((result.data as any)?.html).toBeUndefined()
            expect(result.data?.password).toBeUndefined()
            expect((result.data as any)?.locked).toBe(true)
            expect(result.data?.title).toBe('Test Post')
        })
    })
})

