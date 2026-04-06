import type { H3Event } from 'h3'
import { signCookieValue, verifyCookieValue } from '@/server/utils/security'
import { isSnowflakeId } from '@/utils/shared/validate'

export const POST_UNLOCK_COOKIE_NAME = 'momei_unlocked_posts'
export const POST_UNLOCK_TTL_SECONDS = 60 * 60 * 24 * 7

interface PostUnlockCredential {
    id: string
    expiresAt: number
}

function isPostUnlockCredential(value: unknown): value is PostUnlockCredential {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<PostUnlockCredential>

    return typeof candidate.id === 'string'
        && isSnowflakeId(candidate.id)
        && typeof candidate.expiresAt === 'number'
        && Number.isFinite(candidate.expiresAt)
}

function parseUnlockedPostCredentials(rawCookie: string | undefined, now = Date.now()): PostUnlockCredential[] {
    const verifiedValue = verifyCookieValue(rawCookie)
    if (!verifiedValue) {
        return []
    }

    try {
        const parsed = JSON.parse(verifiedValue) as unknown
        if (!Array.isArray(parsed)) {
            return []
        }

        const seenIds = new Set<string>()

        return parsed.filter(isPostUnlockCredential).filter((entry) => {
            if (entry.expiresAt <= now || seenIds.has(entry.id)) {
                return false
            }
            seenIds.add(entry.id)
            return true
        })
    } catch {
        return []
    }
}

export function getUnlockedPostIds(event: H3Event, now = Date.now()): string[] {
    return parseUnlockedPostCredentials(getCookie(event, POST_UNLOCK_COOKIE_NAME), now).map((entry) => entry.id)
}

export function rememberUnlockedPost(event: H3Event, postId: string, now = Date.now()) {
    const nextCredentials = parseUnlockedPostCredentials(getCookie(event, POST_UNLOCK_COOKIE_NAME), now)
        .filter((entry) => entry.id !== postId)

    nextCredentials.push({
        id: postId,
        expiresAt: now + POST_UNLOCK_TTL_SECONDS * 1000,
    })

    setCookie(event, POST_UNLOCK_COOKIE_NAME, signCookieValue(JSON.stringify(nextCredentials)), {
        maxAge: POST_UNLOCK_TTL_SECONDS,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
    })
}
