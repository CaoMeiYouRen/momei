import { createAuthClient } from 'better-auth/vue'
import { usernameClient, magicLinkClient, emailOTPClient, inferAdditionalFields, anonymousClient, phoneNumberClient, adminClient, genericOAuthClient, twoFactorClient } from 'better-auth/client/plugins'
import type { auth } from './auth'
import { AUTH_BASE_URL } from '@/utils/shared/env'

const baseURL = AUTH_BASE_URL || window?.__NUXT__?.publicRuntimeConfig?.authBaseUrl || window?.location.origin

const SESSION_REQUEST_CACHE_WINDOW_MS = 15_000
const AUTH_SESSION_CACHE_BUST_KEY = 'momei:auth-session-cache-bust'

interface SessionCacheSnapshot {
    body: string
    status: number
    statusText: string
    headers: [string, string][]
    expiresAt: number
}

export type AuthClientSession = typeof authClient.$Infer.Session | null

let pendingSessionRequest: Promise<SessionCacheSnapshot> | null = null
let cachedSessionSnapshot: SessionCacheSnapshot | null = null
let cacheBustListenerBound = false
let authSessionCacheBustVersion = 0

function bumpAuthSessionCacheBustVersion() {
    authSessionCacheBustVersion = Date.now()
    return authSessionCacheBustVersion
}

export function getAuthSessionCacheBustVersion() {
    return authSessionCacheBustVersion
}

function isSessionRequest(input: RequestInfo | URL) {
    let requestUrl = ''

    if (typeof input === 'string') {
        requestUrl = input
    } else if (input instanceof URL) {
        requestUrl = input.toString()
    } else {
        requestUrl = input.url
    }

    return requestUrl.includes('/get-session')
}

function createSessionCacheSnapshot(response: Response, body: string, ttlMs = SESSION_REQUEST_CACHE_WINDOW_MS): SessionCacheSnapshot {
    return {
        body,
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers.entries()),
        expiresAt: Date.now() + ttlMs,
    }
}

function createCachedResponse(snapshot: SessionCacheSnapshot) {
    return new Response(snapshot.body, {
        status: snapshot.status,
        statusText: snapshot.statusText,
        headers: snapshot.headers,
    })
}

function resetSessionAtom(options?: { notify?: boolean }) {
    if (!import.meta.client) {
        return
    }

    const sessionAtom = authClient.$store.atoms.session
    if (!sessionAtom) {
        return
    }

    const current = sessionAtom.get()
    sessionAtom.set({
        ...current,
        data: null,
        error: null,
        isPending: true,
        isRefetching: false,
        refetch: current.refetch,
    })

    if (options?.notify) {
        authClient.$store.notify('$sessionSignal')
    }
}

function ensureCacheBustListener() {
    if (!import.meta.client || cacheBustListenerBound) {
        return
    }

    window.addEventListener('storage', (event) => {
        if (event.key !== AUTH_SESSION_CACHE_BUST_KEY) {
            return
        }

        bumpAuthSessionCacheBustVersion()
        cachedSessionSnapshot = null
        pendingSessionRequest = null
        resetSessionAtom({ notify: true })
    })

    cacheBustListenerBound = true
}

export function initializeAuthSessionSync() {
    ensureCacheBustListener()
}

function broadcastSessionCacheBust() {
    if (!import.meta.client) {
        return
    }

    try {
        localStorage.setItem(AUTH_SESSION_CACHE_BUST_KEY, Date.now().toString())
    } catch (error) {
        console.warn('[auth-client] Failed to broadcast session cache invalidation.', error)
    }
}

export function invalidateAuthSessionRequestCache(options?: { broadcast?: boolean }) {
    bumpAuthSessionCacheBustVersion()
    cachedSessionSnapshot = null
    pendingSessionRequest = null
    resetSessionAtom()

    if (options?.broadcast !== false) {
        broadcastSessionCacheBust()
    }
}

export function primeAuthSessionRequestCache(session: AuthClientSession, ttlMs = SESSION_REQUEST_CACHE_WINDOW_MS) {
    cachedSessionSnapshot = {
        body: JSON.stringify(session),
        status: 200,
        statusText: 'OK',
        headers: [['content-type', 'application/json']],
        expiresAt: Date.now() + ttlMs,
    }
}

const cachedAuthFetch: typeof fetch = async (input, init) => {
    if (!import.meta.client || !isSessionRequest(input) || (init?.method && init.method.toUpperCase() !== 'GET')) {
        return fetch(input, init)
    }

    ensureCacheBustListener()

    if (cachedSessionSnapshot && cachedSessionSnapshot.expiresAt > Date.now()) {
        return createCachedResponse(cachedSessionSnapshot)
    }

    if (!pendingSessionRequest) {
        pendingSessionRequest = fetch(input, init)
            .then(async (response) => {
                const body = await response.clone().text()
                const snapshot = createSessionCacheSnapshot(response, body)
                if (response.ok) {
                    cachedSessionSnapshot = snapshot
                }
                return snapshot
            })
            .finally(() => {
                pendingSessionRequest = null
            })
    }

    return createCachedResponse(await pendingSessionRequest)
}

export const authClient = createAuthClient({
    /** 服务器的基础 URL（如果您使用相同域名，则可选） */
    baseURL,
    sessionOptions: {
        refetchOnWindowFocus: false,
    },
    fetchOptions: {
        customFetchImpl: cachedAuthFetch,
    },
    plugins: [
        inferAdditionalFields<typeof auth>(),
        usernameClient(),
        magicLinkClient(),
        emailOTPClient(),
        anonymousClient(),
        phoneNumberClient(),
        adminClient(),
        genericOAuthClient(),
        twoFactorClient({}),
    ],
})
