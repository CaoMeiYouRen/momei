import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn().mockResolvedValue({
    user: {
        id: 'user-1',
        role: 'author',
    },
})
const initializeDB = vi.fn().mockResolvedValue(undefined)

vi.mock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')

    return {
        ...actual,
        defineEventHandler: (handler: unknown) => handler,
        getHeader: (event: { headers?: Record<string, string> }, name: string) => event.headers?.[name],
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        isInitialized: false,
    },
    initializeDB,
}))

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession,
        },
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

import authMiddleware, { shouldResolveSession } from '@/server/middleware/1-auth'

function createEvent(path: string, cookieHeader?: string) {
    const headers = cookieHeader ? { cookie: cookieHeader } : {}

    return {
        path,
        headers,
        node: {
            req: { headers },
            res: {},
        },
        context: {},
    } as any
}

describe('auth optional session middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should only resolve optional sessions for targeted public routes', () => {
        expect(shouldResolveSession('/api/auth/session', undefined)).toBe(true)
        expect(shouldResolveSession('/api/posts', 'better-auth.session_token=test')).toBe(true)
        expect(shouldResolveSession('/api/search', 'session=abc')).toBe(true)
        expect(shouldResolveSession('/api/friend-links/applications', 'better-auth.session_token=test')).toBe(true)
        expect(shouldResolveSession('/api/settings/public', 'better-auth.session_token=test')).toBe(false)
        expect(shouldResolveSession('/', 'better-auth.session_token=test')).toBe(false)
        expect(shouldResolveSession('/posts', 'better-auth.session_token=test')).toBe(false)
    })

    it('should skip database and session lookup for non-target routes', async () => {
        const event = createEvent('/api/settings/public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
        expect(event.context.auth).toBeUndefined()
    })

    it('should hydrate context for targeted optional-session routes', async () => {
        const event = createEvent('/api/posts?scope=public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDB).toHaveBeenCalledTimes(1)
        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.context.user).toMatchObject({ id: 'user-1', role: 'author' })
    })
})
