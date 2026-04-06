import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('~/utils/shared/env')>()
    return {
        ...actual,
        AUTH_SECRET: 'test-secret-key-for-post-unlock',
    }
})

import {
    getUnlockedPostIds,
    POST_UNLOCK_COOKIE_NAME,
    POST_UNLOCK_MAX_ENTRIES,
    POST_UNLOCK_TTL_SECONDS,
    rememberUnlockedPost,
} from './post-unlock'
import { signCookieValue, verifyCookieValue } from '@/server/utils/security'

describe('post-unlock utils', () => {
    const now = new Date('2026-04-06T00:00:00.000Z').getTime()
    const postId = 'abcdef1234567890'
    const existingPostId = 'bcdef1234567890a'

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('getCookie', vi.fn())
        vi.stubGlobal('setCookie', vi.fn())
    })

    it('应该只返回签名正确且未过期的解锁文章 ID', () => {
        vi.mocked(getCookie).mockReturnValue(signCookieValue(JSON.stringify([
            { id: postId, expiresAt: now + 60_000 },
            { id: existingPostId, expiresAt: now - 1 },
        ])))

        const unlockedIds = getUnlockedPostIds({} as any, now)

        expect(unlockedIds).toEqual([postId])
        expect(getCookie).toHaveBeenCalledWith({}, POST_UNLOCK_COOKIE_NAME)
    })

    it('应该在 cookie 被伪造时返回空列表', () => {
        const signed = signCookieValue(JSON.stringify([{ id: postId, expiresAt: now + 60_000 }]))
        vi.mocked(getCookie).mockReturnValue(`${signed}tampered`)

        expect(getUnlockedPostIds({} as any, now)).toEqual([])
    })

    it('应该在 payload 非法时返回空列表', () => {
        vi.mocked(getCookie).mockReturnValue(signCookieValue('{"broken":true}'))

        expect(getUnlockedPostIds({} as any, now)).toEqual([])
    })

    it('应该写入带签名和过期时间的解锁凭据', () => {
        vi.mocked(getCookie).mockReturnValue(signCookieValue(JSON.stringify([
            { id: existingPostId, expiresAt: now + 10_000 },
        ])))

        rememberUnlockedPost({} as any, postId, now)

        expect(setCookie).toHaveBeenCalledTimes(1)

        const [event, cookieName, cookieValue, options] = vi.mocked(setCookie).mock.calls[0]!
        expect(event).toEqual({})
        expect(cookieName).toBe(POST_UNLOCK_COOKIE_NAME)
        expect(options).toMatchObject({
            maxAge: POST_UNLOCK_TTL_SECONDS,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })

        const verifiedValue = verifyCookieValue(cookieValue as string)
        expect(verifiedValue).not.toBeNull()

        const parsed = JSON.parse(verifiedValue!) as { id: string, expiresAt: number }[]
        expect(parsed).toEqual([
            { id: existingPostId, expiresAt: now + 10_000 },
            { id: postId, expiresAt: now + POST_UNLOCK_TTL_SECONDS * 1000 },
        ])
    })

    it('应该在超过最大条目数时裁剪为最近解锁的凭据', () => {
        const credentials = Array.from({ length: POST_UNLOCK_MAX_ENTRIES }, (_, index) => ({
            id: (index + 1).toString(16).padStart(16, 'a').slice(-16),
            expiresAt: now + index + 1,
        }))

        vi.mocked(getCookie).mockReturnValue(signCookieValue(JSON.stringify(credentials)))

        rememberUnlockedPost({} as any, postId, now)

        const [, , cookieValue] = vi.mocked(setCookie).mock.calls[0]!
        const parsed = JSON.parse(verifyCookieValue(cookieValue as string)!) as { id: string, expiresAt: number }[]

        expect(parsed).toHaveLength(POST_UNLOCK_MAX_ENTRIES)
        expect(parsed[0]?.id).toBe(credentials[1]?.id)
        expect(parsed.at(-1)?.id).toBe(postId)
    })

    it('应该在重新解锁已存在文章时刷新它并保持总数不超上限', () => {
        const credentials = Array.from({ length: POST_UNLOCK_MAX_ENTRIES }, (_, index) => ({
            id: `${index.toString(16).padStart(2, 'a')}bcdef123456789`.slice(0, 16),
            expiresAt: now + index + 1,
        }))

        const refreshedId = credentials[5]!.id
        vi.mocked(getCookie).mockReturnValue(signCookieValue(JSON.stringify(credentials)))

        rememberUnlockedPost({} as any, refreshedId, now)

        const [, , cookieValue] = vi.mocked(setCookie).mock.calls[0]!
        const parsed = JSON.parse(verifyCookieValue(cookieValue as string)!) as { id: string, expiresAt: number }[]

        expect(parsed).toHaveLength(POST_UNLOCK_MAX_ENTRIES)
        expect(parsed.filter((entry) => entry.id === refreshedId)).toHaveLength(1)
        expect(parsed.at(-1)).toEqual({
            id: refreshedId,
            expiresAt: now + POST_UNLOCK_TTL_SECONDS * 1000,
        })
    })
})
