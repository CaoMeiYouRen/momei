import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { checkPostAccess } from './post-access'
import { PostStatus, PostVisibility } from '@/types/post'
import type { Post } from '@/server/entities/post'
import { UserRole } from '@/utils/shared/roles'
import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'

// Mock dataSource
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
        isInitialized: false,
        initialize: vi.fn(),
    },
}))

describe('post-access utils', () => {
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

    beforeAll(() => {
        // Setup mock repository
        const mockRepo = {
            findOne: vi.fn(),
        }
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
    })

    afterAll(() => {
        vi.clearAllMocks()
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
            const mockRepo = dataSource.getRepository(Subscriber)
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
            const mockRepo = dataSource.getRepository(Subscriber)
            vi.mocked(mockRepo.findOne).mockResolvedValue({
                userId: 'user-1',
                isActive: true,
            } as Subscriber)

            const result = await checkPostAccess(subscriberPost, userSession)

            expect(result.allowed).toBe(true)
            expect(result.shouldNotFound).toBe(false)
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

