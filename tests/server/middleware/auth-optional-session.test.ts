import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dataSourceState, getSession, initializeDB, loggerError } = vi.hoisted(() => ({
    getSession: vi.fn().mockResolvedValue({
        user: {
            id: 'user-1',
            role: 'author',
        },
    }),
    initializeDB: vi.fn().mockResolvedValue(undefined),
    loggerError: vi.fn(),
    dataSourceState: {
        isInitialized: false,
    },
}))

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
        get isInitialized() {
            return dataSourceState.isInitialized
        },
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
        error: loggerError,
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
        dataSourceState.isInitialized = false
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

    it('should skip targeted public routes when no session cookie is present', async () => {
        const event = createEvent('/api/posts?scope=public')

        await authMiddleware(event)

        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
    })

    it('should skip targeted public routes when cookies do not contain a session marker', async () => {
        const event = createEvent('/api/search?q=nuxt', 'theme=dark; locale=zh-CN')

        await authMiddleware(event)

        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
    })

    it('should hydrate context for targeted optional-session routes', async () => {
        const event = createEvent('/api/posts?scope=public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDB).toHaveBeenCalledTimes(1)
        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.context.user).toMatchObject({ id: 'user-1', role: 'author' })
    })

    it('should avoid redundant database initialization when the datasource is already ready', async () => {
        dataSourceState.isInitialized = true
        const event = createEvent('/api/search?q=nuxt', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.context.auth).toBeTruthy()
    })

    it('should log and swallow session lookup failures', async () => {
        getSession.mockRejectedValueOnce(new Error('session lookup failed'))
        const event = createEvent('/api/posts?scope=public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(loggerError).toHaveBeenCalledWith('Auth middleware error:', expect.any(Error))
        expect(event.context.auth).toBeUndefined()
        expect(event.context.user).toBeUndefined()
    })
})
