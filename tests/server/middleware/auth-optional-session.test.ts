import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dataSourceState, getSession, initializeDatabaseConnection, initializeDB, loggerError } = vi.hoisted(() => ({
    getSession: vi.fn().mockResolvedValue({
        user: {
            id: 'user-1',
            role: 'author',
        },
    }),
    initializeDatabaseConnection: vi.fn().mockResolvedValue(undefined),
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
    initializeDatabaseConnection,
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

import authMiddleware, { createAuthSessionMiddleware, isCacheSharedRouteRules, isHtmlPageRequest, shouldResolveSession, shouldResolveSessionForRequest } from '@/server/middleware/1-auth'

function createEvent(path: string, cookieHeader?: string, extraHeaders?: Record<string, string>) {
    const headers = { ...(cookieHeader ? { cookie: cookieHeader } : {}), ...extraHeaders }
    const responseHeaders = new Map<string, string>()

    return {
        path,
        method: 'GET',
        headers,
        node: {
            req: { headers },
            res: {
                getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
                setHeader: (name: string, value: string) => responseHeaders.set(name.toLowerCase(), String(value)),
            },
        },
        context: {},
        responseHeaders,
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

    it('resolves page navigations that carry a session cookie', () => {
        expect(shouldResolveSession('/settings', 'better-auth.session_token=test', { isHtmlPageRequest: true })).toBe(true)
        expect(shouldResolveSession('/posts/hello', 'session=abc', { isHtmlPageRequest: true })).toBe(true)
        expect(shouldResolveSession('/settings', 'better-auth.session_token=test')).toBe(false)
        expect(shouldResolveSession('/settings', 'theme=dark', { isHtmlPageRequest: true })).toBe(false)
        expect(shouldResolveSession('/settings', undefined, { isHtmlPageRequest: true })).toBe(false)
        expect(shouldResolveSession('/api/settings/public', 'better-auth.session_token=test', { isHtmlPageRequest: true })).toBe(false)
    })

    it('only treats GET + text/html + non-api paths as page navigations', () => {
        expect(isHtmlPageRequest({ accept: 'text/html,application/xhtml+xml', method: 'GET', pathname: '/settings' })).toBe(true)
        expect(isHtmlPageRequest({ accept: 'text/html', method: 'POST', pathname: '/settings' })).toBe(false)
        expect(isHtmlPageRequest({ accept: 'text/html', method: 'GET', pathname: '/api/posts' })).toBe(false)
        expect(isHtmlPageRequest({ accept: 'text/html', method: 'GET', pathname: '/_nuxt/app.js' })).toBe(false)
        expect(isHtmlPageRequest({ accept: 'application/json', method: 'GET', pathname: '/settings' })).toBe(false)
        expect(isHtmlPageRequest({ method: 'GET', pathname: '/settings' })).toBe(false)
    })

    it('hydrates page navigations and marks the session as resolved', async () => {
        const event = createEvent('/settings', 'better-auth.session_token=test', { accept: 'text/html' })

        await authMiddleware(event)

        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.context.authSessionResolved).toBe(true)
        expect(event.context.user).toMatchObject({ id: 'user-1' })
    })

    it('skips session resolution on cache-shared pages', () => {
        const base = { cookieHeader: 'better-auth.session_token=test', isPageRequest: true, pathname: '/posts/hello' }

        expect(shouldResolveSessionForRequest({ ...base, routeRules: { swr: 3600 } })).toBe(false)
        expect(shouldResolveSessionForRequest({ ...base, routeRules: { isr: 600 } })).toBe(false)
        expect(shouldResolveSessionForRequest({ ...base, routeRules: {} })).toBe(true)
        expect(shouldResolveSessionForRequest({ ...base, pathname: '/settings', routeRules: {} })).toBe(true)
    })

    it('recognises cache-shared route rules', () => {
        expect(isCacheSharedRouteRules({ swr: 3600 })).toBe(true)
        expect(isCacheSharedRouteRules({ isr: 600 })).toBe(true)
        expect(isCacheSharedRouteRules({ cache: { maxAge: 60 } })).toBe(true)
        expect(isCacheSharedRouteRules({ prerender: true })).toBe(true)
        expect(isCacheSharedRouteRules({ headers: { 'x-foo': '1' } } as never)).toBe(false)
        expect(isCacheSharedRouteRules(null)).toBe(false)
    })

    it('skips session resolution for cache-shared page navigations at the handler level', async () => {
        const middleware = createAuthSessionMiddleware(() => ({ swr: 3600 }))
        const event = createEvent('/posts/hello', 'better-auth.session_token=test', { accept: 'text/html' })

        await middleware(event)

        expect(getSession).not.toHaveBeenCalled()
        expect(event.context.authSessionResolved).toBeUndefined()
        expect(event.context.auth).toBeUndefined()
    })

    it('still resolves sessions on non-cached pages when rules are empty', async () => {
        const middleware = createAuthSessionMiddleware(() => ({}))
        const event = createEvent('/settings', 'better-auth.session_token=test', { accept: 'text/html' })

        await middleware(event)

        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.responseHeaders.get('cache-control')).toBe('private, no-store')
        expect(event.responseHeaders.get('vary')).toContain('cookie')
    })

    it('does not mark api responses as private pages', async () => {
        const event = createEvent('/api/posts', 'better-auth.session_token=test', { accept: 'text/html' })

        await authMiddleware(event)

        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.responseHeaders.get('cache-control')).toBeUndefined()
        expect(event.responseHeaders.get('vary')).toBeUndefined()
    })

    it('treats bare /api as an api path, not a page', async () => {
        const event = createEvent('/api', 'better-auth.session_token=test', { accept: 'text/html' })

        await authMiddleware(event)

        expect(getSession).not.toHaveBeenCalled()
    })

    it('skips page navigations without an html accept header', async () => {
        const event = createEvent('/settings', 'better-auth.session_token=test', { accept: 'application/json' })

        await authMiddleware(event)

        expect(getSession).not.toHaveBeenCalled()
        expect(event.context.authSessionResolved).toBeUndefined()
    })

    it('should skip database and session lookup for non-target routes', async () => {
        const event = createEvent('/api/settings/public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDatabaseConnection).not.toHaveBeenCalled()
        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
        expect(event.context.auth).toBeUndefined()
    })

    it('should skip targeted public routes when no session cookie is present', async () => {
        const event = createEvent('/api/posts?scope=public')

        await authMiddleware(event)

        expect(initializeDatabaseConnection).not.toHaveBeenCalled()
        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
    })

    it('should skip targeted public routes when cookies do not contain a session marker', async () => {
        const event = createEvent('/api/search?q=nuxt', 'theme=dark; locale=zh-CN')

        await authMiddleware(event)

        expect(initializeDatabaseConnection).not.toHaveBeenCalled()
        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).not.toHaveBeenCalled()
    })

    it('should hydrate context for targeted optional-session routes', async () => {
        const event = createEvent('/api/posts?scope=public', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDatabaseConnection).toHaveBeenCalledTimes(1)
        expect(initializeDB).not.toHaveBeenCalled()
        expect(getSession).toHaveBeenCalledTimes(1)
        expect(event.context.user).toMatchObject({ id: 'user-1', role: 'author' })
    })

    it('should avoid redundant database initialization when the datasource is already ready', async () => {
        dataSourceState.isInitialized = true
        const event = createEvent('/api/search?q=nuxt', 'better-auth.session_token=test')

        await authMiddleware(event)

        expect(initializeDatabaseConnection).not.toHaveBeenCalled()
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
