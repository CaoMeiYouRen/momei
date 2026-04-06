import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('~/utils/shared/env')>()
    return {
        ...actual,
        AUTH_SECRET: 'test-secret-for-post-unlock-boundary',
    }
})

vi.mock('@/server/utils/rate-limit', () => ({
    rateLimit: vi.fn().mockResolvedValue(undefined),
}))

import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { User } from '@/server/entities/user'
import { PostStatus, PostVisibility } from '@/types/post'
import { generateRandomString } from '@/utils/shared/random'
import { hashPassword } from '@/server/utils/password'
import { signCookieValue, verifyCookieValue } from '@/server/utils/security'
import { POST_UNLOCK_COOKIE_NAME, POST_UNLOCK_TTL_SECONDS } from '@/server/utils/post-unlock'
import postDetailHandler from '@/server/api/posts/[id].get'
import postSlugDetailHandler from '@/server/api/posts/slug/[slug].get'
import verifyPasswordHandler from '@/server/api/posts/[id]/verify-password.post'

describe('password unlock credential boundaries', () => {
    let passwordPostId = ''
    let passwordPostSlug = ''

    beforeAll(async () => {
        const { initializeDB } = await import('@/server/database')
        await initializeDB()

        vi.stubGlobal('getRouterParam', vi.fn((event: { context?: { params?: Record<string, string> } }, key: string) => event.context?.params?.[key]))
        vi.stubGlobal('getQuery', vi.fn((event: { query?: Record<string, unknown> }) => event.query || {}))

        const userRepo = dataSource.getRepository(User)
        const author = new User()
        author.name = 'Password Unlock Author'
        author.email = `password_unlock_${generateRandomString(6)}@example.com`
        author.role = 'author'
        await userRepo.save(author)

        const postRepo = dataSource.getRepository(Post)
        const post = new Post()
        post.title = 'Password Protected Post'
        post.slug = `password-post-${generateRandomString(6)}`
        post.content = 'Protected content'
        post.summary = 'Protected summary'
        post.status = PostStatus.PUBLISHED
        post.visibility = PostVisibility.PASSWORD
        post.password = hashPassword('secret-123')
        post.author = author
        post.publishedAt = new Date('2026-04-06T00:00:00.000Z')
        await postRepo.save(post)

        passwordPostId = post.id
        passwordPostSlug = post.slug
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    function createEvent(overrides: Record<string, any> = {}) {
        return {
            context: {
                params: {},
                ...overrides.context,
            },
            node: {
                req: { headers: {} },
                res: { setHeader: vi.fn() },
            },
            req: { headers: {} },
            ...overrides,
        } as any
    }

    it('应该在解锁凭据过期时继续返回 PASSWORD_REQUIRED', async () => {
        vi.stubGlobal('getCookie', vi.fn(() => signCookieValue(JSON.stringify([
            { id: passwordPostId, expiresAt: Date.now() - 1_000 },
        ]))))

        const result = await postDetailHandler(createEvent({
            context: { params: { id: passwordPostId } },
        }))

        expect(result.code).toBe(200)
        expect(result.data?.locked).toBe(true)
        expect(result.data?.reason).toBe('PASSWORD_REQUIRED')
        expect(result.data?.content).toBeUndefined()
    })

    it('应该在解锁凭据被伪造时继续返回 PASSWORD_REQUIRED', async () => {
        const signed = signCookieValue(JSON.stringify([
            { id: passwordPostId, expiresAt: Date.now() + 60_000 },
        ]))

        vi.stubGlobal('getCookie', vi.fn(() => `${signed}tampered`))

        const result = await postSlugDetailHandler(createEvent({
            context: { params: { slug: passwordPostSlug } },
        }))

        expect(result.code).toBe(200)
        expect(result.data?.locked).toBe(true)
        expect(result.data?.reason).toBe('PASSWORD_REQUIRED')
        expect(result.data?.content).toBeUndefined()
    })

    it('应该在密码验证成功后写入带签名和过期时间的解锁凭据', async () => {
        const setCookieSpy = vi.fn()
        vi.stubGlobal('setCookie', setCookieSpy)
        vi.stubGlobal('getCookie', vi.fn(() => ''))
        vi.stubGlobal('readValidatedBody', vi.fn(() => Promise.resolve({ password: 'secret-123' })))

        const before = Date.now()
        const result = await verifyPasswordHandler(createEvent({
            context: { params: { id: passwordPostId } },
        }))
        const after = Date.now()

        expect(result).toMatchObject({ code: 200, message: 'Password verified' })
        expect(setCookieSpy).toHaveBeenCalledTimes(1)

        const [, cookieName, cookieValue, options] = setCookieSpy.mock.calls[0]!
        expect(cookieName).toBe(POST_UNLOCK_COOKIE_NAME)
        expect(options).toMatchObject({
            maxAge: POST_UNLOCK_TTL_SECONDS,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })

        const parsed = JSON.parse(verifyCookieValue(cookieValue as string)!) as { id: string, expiresAt: number }[]
        expect(parsed).toHaveLength(1)
        expect(parsed[0]?.id).toBe(passwordPostId)
        expect(parsed[0]?.expiresAt).toBeGreaterThanOrEqual(before + POST_UNLOCK_TTL_SECONDS * 1000)
        expect(parsed[0]?.expiresAt).toBeLessThanOrEqual(after + POST_UNLOCK_TTL_SECONDS * 1000)
    })
})
