import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const fetchedSession = {
    session: { id: 'session-1' },
    user: { id: 'user-1', role: 'admin' },
}

const refreshedSession = {
    session: { id: 'session-2' },
    user: { id: 'user-1', role: 'author' },
}

const liveSession = ref({
    data: null as typeof fetchedSession | null,
    error: null,
    isPending: true,
    isRefetching: false,
    refetch: vi.fn(() => {
        liveSession.value = {
            ...liveSession.value,
            data: refreshedSession,
            isPending: false,
            isRefetching: false,
        }
    }),
})

const { mockUseSession, mockInvalidateRequestCache, mockPrimeRequestCache, mockSessionAtomSet } = vi.hoisted(() => ({
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
}))

let cacheBustVersion = 0

mockNuxtImport('useFetch', () => vi.fn())
mockNuxtImport('useRequestHeaders', () => () => ({}))

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

import { invalidateAuthSessionState, refreshAuthSession, resolveRouteAuthSession } from './use-auth-session'

describe('useAuthSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        cacheBustVersion = 0
        liveSession.value = {
            data: null,
            error: null,
            isPending: true,
            isRefetching: false,
            refetch: liveSession.value.refetch,
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
})
