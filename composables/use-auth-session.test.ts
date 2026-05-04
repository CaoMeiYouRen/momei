import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const fetchedSession = {
    session: { id: 'session-1' },
    user: { id: 'user-1', role: 'admin' },
}

const refreshedSession = {
    session: { id: 'session-2' },
    user: { id: 'user-1', role: 'author' },
}

function createRefetchMock() {
    return vi.fn(() => {
        liveSession.value = {
            ...liveSession.value,
            data: refreshedSession,
            isPending: false,
            isRefetching: false,
        }
    })
}

const liveSession = ref({
    data: null as typeof fetchedSession | null,
    error: null,
    isPending: true,
    isRefetching: false,
    refetch: createRefetchMock(),
})

const { mockUseSession, mockInvalidateRequestCache, mockPrimeRequestCache, mockSessionAtomSet, mountedCallbacks, beforeUnmountCallbacks } = vi.hoisted(() => ({
    mockUseSession: vi.fn((fetcher?: unknown) => {
        if (fetcher) {
            return Promise.resolve({
                data: ref(fetchedSession),
                error: ref(null),
                isPending: false,
            })
        }

        return liveSession
    }),
    mockInvalidateRequestCache: vi.fn(() => {
        liveSession.value = {
            ...liveSession.value,
            data: null,
            isPending: true,
            isRefetching: false,
        }
    }),
    mockPrimeRequestCache: vi.fn(),
    mockSessionAtomSet: vi.fn(),
    mountedCallbacks: [] as (() => void)[],
    beforeUnmountCallbacks: [] as (() => void)[],
}))

let cacheBustVersion = 0

mockNuxtImport('useFetch', () => vi.fn())
mockNuxtImport('useRequestHeaders', () => () => ({}))
mockNuxtImport('onMounted', () => (callback: () => void) => {
    mountedCallbacks.push(callback)
})
mockNuxtImport('onBeforeUnmount', () => (callback: () => void) => {
    beforeUnmountCallbacks.push(callback)
})

function getWindowListenerCalls(spy: ReturnType<typeof vi.spyOn>) {
    return spy.mock.calls as [string, EventListenerOrEventListenerObject][]
}

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: mockUseSession,
        $store: {
            atoms: {
                session: {
                    get: () => liveSession.value,
                    set: mockSessionAtomSet,
                },
            },
        },
    },
    getAuthSessionCacheBustVersion: () => cacheBustVersion,
    invalidateAuthSessionRequestCache: mockInvalidateRequestCache,
    primeAuthSessionRequestCache: mockPrimeRequestCache,
}))

import {
    invalidateAuthSessionState,
    primeHydratedAuthSession,
    refreshAuthSession,
    resolveRouteAuthSession,
    setupAuthSessionLifecycle,
} from './use-auth-session'

describe('useAuthSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        cacheBustVersion = 0
        mountedCallbacks.length = 0
        beforeUnmountCallbacks.length = 0
        liveSession.value = {
            data: null,
            error: null,
            isPending: true,
            isRefetching: false,
            refetch: createRefetchMock(),
        }
        invalidateAuthSessionState({ broadcast: false })
    })

    it('should reuse the cached route session after the first fetch', async () => {
        const first = await resolveRouteAuthSession()
        const second = await resolveRouteAuthSession()

        expect(first).toEqual(fetchedSession)
        expect(second).toEqual(fetchedSession)
        expect(mockUseSession.mock.calls.filter(([fetcher]) => Boolean(fetcher))).toHaveLength(1)
        expect(mockPrimeRequestCache).toHaveBeenCalledWith(fetchedSession)
    })

    it('should refresh the live session and sync the cached state', async () => {
        const session = await refreshAuthSession()

        expect(liveSession.value.refetch).toHaveBeenCalledTimes(1)
        expect(mockInvalidateRequestCache).toHaveBeenCalledWith({ broadcast: false })
        expect(session).toEqual(refreshedSession)

        const resolved = await resolveRouteAuthSession()
        expect(resolved).toEqual(refreshedSession)
    })

    it('should fetch again after the route session cache is invalidated', async () => {
        await resolveRouteAuthSession()

        invalidateAuthSessionState({ broadcast: false })
        const resolved = await resolveRouteAuthSession()

        expect(resolved).toEqual(fetchedSession)
        expect(mockUseSession).toHaveBeenCalledTimes(2)
    })

    it('should ignore a stale route cache after a cache bust version change', async () => {
        await resolveRouteAuthSession()

        cacheBustVersion = 1
        const resolved = await resolveRouteAuthSession()

        expect(resolved).toEqual(fetchedSession)
        expect(mockUseSession.mock.calls.filter(([fetcher]) => Boolean(fetcher))).toHaveLength(2)
    })

    it('should not trust a stale live session after current tab invalidation', async () => {
        liveSession.value = {
            ...liveSession.value,
            data: fetchedSession,
            isPending: false,
        }

        await resolveRouteAuthSession()

        invalidateAuthSessionState({ broadcast: false })
        const resolved = await resolveRouteAuthSession()

        expect(resolved).toEqual(fetchedSession)
        expect(mockUseSession.mock.calls.filter(([fetcher]) => Boolean(fetcher))).toHaveLength(2)
    })

    it('should revalidate against the server when live session is stale', async () => {
        liveSession.value = {
            ...liveSession.value,
            data: {
                session: { id: 'stale-session' },
                user: { id: 'user-1', role: 'admin' },
            },
            isPending: false,
        }

        const resolved = await resolveRouteAuthSession()

        expect(resolved).toEqual(fetchedSession)
        expect(mockUseSession.mock.calls.filter(([fetcher]) => Boolean(fetcher))).toHaveLength(1)
    })

    it('should hydrate the client auth session atom from the resolved route state', async () => {
        await resolveRouteAuthSession()

        vi.clearAllMocks()
        primeHydratedAuthSession()

        expect(mockPrimeRequestCache).toHaveBeenCalledWith(fetchedSession)
        expect(mockSessionAtomSet).toHaveBeenCalledWith(expect.objectContaining({
            data: fetchedSession,
            error: null,
            isPending: false,
            isRefetching: false,
        }))
    })

    it('should refresh stale sessions on focus and cleanup lifecycle listeners', async () => {
        const addWindowListenerSpy = vi.spyOn(window, 'addEventListener')
        const removeWindowListenerSpy = vi.spyOn(window, 'removeEventListener')
        const addDocumentListenerSpy = vi.spyOn(document, 'addEventListener')
        const removeDocumentListenerSpy = vi.spyOn(document, 'removeEventListener')
        const nowSpy = vi.spyOn(Date, 'now')
        let currentTimestamp = 1_000
        let visibilityState = 'visible'

        nowSpy.mockImplementation(() => currentTimestamp)
        vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState as DocumentVisibilityState)

        liveSession.value = {
            ...liveSession.value,
            data: fetchedSession,
            isPending: false,
        }

        setupAuthSessionLifecycle(liveSession as never)
        expect(mountedCallbacks).toHaveLength(1)

        const mountedCallback = mountedCallbacks[0]
        expect(mountedCallback).toBeTypeOf('function')
        mountedCallback?.()

        const focusListener = getWindowListenerCalls(addWindowListenerSpy)
            .find(([eventName]) => eventName === 'focus')?.[1]

        expect(focusListener).toBeTypeOf('function')
        expect(addDocumentListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))

        currentTimestamp = 30_000
        ;(focusListener as EventListener)(new Event('focus'))
        await nextTick()
        expect(liveSession.value.refetch).not.toHaveBeenCalled()

        visibilityState = 'hidden'
        currentTimestamp = 62_000
        ;(focusListener as EventListener)(new Event('focus'))
        await nextTick()
        expect(liveSession.value.refetch).not.toHaveBeenCalled()

        visibilityState = 'visible'
        ;(focusListener as EventListener)(new Event('focus'))
        await Promise.resolve()
        expect(liveSession.value.refetch).toHaveBeenCalledTimes(1)

        expect(beforeUnmountCallbacks).toHaveLength(1)
        const beforeUnmountCallback = beforeUnmountCallbacks[0]
        expect(beforeUnmountCallback).toBeTypeOf('function')
        beforeUnmountCallback?.()

        expect(removeWindowListenerSpy).toHaveBeenCalledWith('focus', focusListener)
        expect(removeDocumentListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })

    it('should warn when lifecycle-driven session refresh fails', async () => {
        const addWindowListenerSpy = vi.spyOn(window, 'addEventListener')
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const nowSpy = vi.spyOn(Date, 'now')
        let currentTimestamp = 1_000

        nowSpy.mockImplementation(() => currentTimestamp)
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')

        liveSession.value = {
            ...liveSession.value,
            data: fetchedSession,
            isPending: false,
            refetch: vi.fn().mockRejectedValue(new Error('refresh failed')),
        }

        setupAuthSessionLifecycle(liveSession as never)
        const mountedCallback = mountedCallbacks[0]
        expect(mountedCallback).toBeTypeOf('function')
        mountedCallback?.()

        currentTimestamp = 62_000
        const focusListener = getWindowListenerCalls(addWindowListenerSpy)
            .find(([eventName]) => eventName === 'focus')?.[1] as EventListener | undefined

        expect(focusListener).toBeTypeOf('function')
        focusListener?.(new Event('focus'))
        await Promise.resolve()
        await Promise.resolve()

        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to refresh auth session on visibility change',
            expect.objectContaining({ message: 'refresh failed' }),
        )
    })
})
