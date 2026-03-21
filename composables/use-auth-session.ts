import { authClient, getAuthSessionCacheBustVersion, invalidateAuthSessionRequestCache, primeAuthSessionRequestCache } from '@/lib/auth-client'

const ROUTE_SESSION_CACHE_WINDOW_MS = 15_000
const SESSION_VISIBILITY_REFRESH_WINDOW_MS = 60_000
const ROUTE_SESSION_FETCH_KEY = 'auth-route-session'

type AuthSession = typeof authClient.$Infer.Session | null
type RouteSessionState = ReturnType<typeof createRouteSessionState>
type AuthSessionValidationState = ReturnType<typeof createAuthSessionValidationState>

let clientRouteSessionPromise: Promise<AuthSession> | null = null
let clientRouteSessionState: RouteSessionState | null = null
let clientAuthSessionValidationState: AuthSessionValidationState | null = null

function createRouteSessionState() {
    const data = useState<AuthSession>('auth:route-session:data', () => null)
    const resolved = useState<boolean>('auth:route-session:resolved', () => false)
    const timestamp = useState<number>('auth:route-session:timestamp', () => 0)
    const version = useState<number>('auth:route-session:version', () => 0)

    return {
        data,
        resolved,
        timestamp,
        version,
    }
}

function createAuthSessionValidationState() {
    return useState<number>('auth:session:last-validated-at', () => 0)
}

function useRouteSessionState() {
    if (import.meta.client && clientRouteSessionState) {
        return clientRouteSessionState
    }

    const state = createRouteSessionState()

    if (import.meta.client) {
        clientRouteSessionState = state
    }

    return state
}

function useAuthSessionValidationState() {
    if (import.meta.client && clientAuthSessionValidationState) {
        return clientAuthSessionValidationState
    }

    const state = createAuthSessionValidationState()

    if (import.meta.client) {
        clientAuthSessionValidationState = state
    }

    return state
}

function setRouteSessionState(session: AuthSession, state = useRouteSessionState(), lastValidatedAt = useAuthSessionValidationState()) {
    const nextTimestamp = Date.now()

    state.data.value = session
    state.resolved.value = true
    state.timestamp.value = nextTimestamp
    state.version.value = getAuthSessionCacheBustVersion()
    lastValidatedAt.value = nextTimestamp
    primeAuthSessionRequestCache(session)

    return session
}

function hasFreshRouteSession(maxAgeMs: number) {
    const state = useRouteSessionState()

    return state.resolved.value
        && state.version.value === getAuthSessionCacheBustVersion()
        && (Date.now() - state.timestamp.value) < maxAgeMs
}

function seedSessionAtom(session: AuthSession) {
    if (!import.meta.client) {
        return
    }

    const atom = authClient.$store.atoms.session

    if (!atom) {
        return
    }

    const current = atom.get()

    atom.set({
        ...current,
        data: session,
        error: null,
        isPending: false,
        isRefetching: false,
        refetch: current.refetch,
    })
}

async function fetchRouteSession() {
    const routeSessionState = useRouteSessionState()
    const authSessionValidationState = useAuthSessionValidationState()

    if (import.meta.server) {
        try {
            const requestFetch = useRequestFetch()
            const session = await requestFetch<AuthSession>('/api/auth/get-session', {
                headers: {
                    ...useRequestHeaders(['cookie']),
                },
            })

            return setRouteSessionState(session ?? null, routeSessionState, authSessionValidationState)
        } catch {
            return setRouteSessionState(null, routeSessionState, authSessionValidationState)
        }
    }

    const { data, error } = await authClient.useSession((url, options) => useFetch(url, {
        ...options,
        key: ROUTE_SESSION_FETCH_KEY,
        dedupe: 'defer',
        headers: {
            ...options?.headers,
            ...useRequestHeaders(['cookie']),
        },
    }))

    if (error.value) {
        return setRouteSessionState(null, routeSessionState, authSessionValidationState)
    }

    return setRouteSessionState(data.value ?? null, routeSessionState, authSessionValidationState)
}

export function useAuthSession() {
    return authClient.useSession()
}

export function primeHydratedAuthSession() {
    if (!import.meta.client) {
        return
    }

    const state = useRouteSessionState()

    if (!state.resolved.value) {
        return
    }

    primeAuthSessionRequestCache(state.data.value)
    seedSessionAtom(state.data.value)
}

export function invalidateAuthSessionState(options?: { broadcast?: boolean }) {
    const state = useRouteSessionState()
    const lastValidatedAt = useAuthSessionValidationState()

    state.data.value = null
    state.resolved.value = false
    state.timestamp.value = 0
    state.version.value = 0
    lastValidatedAt.value = 0
    invalidateAuthSessionRequestCache(options)
}

export async function refreshAuthSession() {
    const session = useAuthSession()

    invalidateAuthSessionRequestCache({ broadcast: false })
    await session.value.refetch()

    return setRouteSessionState(session.value.data ?? null)
}

export async function resolveRouteAuthSession(options?: { force?: boolean, maxAgeMs?: number }) {
    const maxAgeMs = options?.maxAgeMs ?? ROUTE_SESSION_CACHE_WINDOW_MS

    if (!options?.force && hasFreshRouteSession(maxAgeMs)) {
        return useRouteSessionState().data.value
    }

    if (!import.meta.client) {
        return await fetchRouteSession()
    }

    if (!clientRouteSessionPromise) {
        clientRouteSessionPromise = fetchRouteSession()
            .finally(() => {
                clientRouteSessionPromise = null
            })
    }

    return await clientRouteSessionPromise
}

export function setupAuthSessionLifecycle(session = useAuthSession()) {
    watch(() => [session.value.data, session.value.isPending] as const, ([data, isPending]) => {
        if (isPending) {
            return
        }

        setRouteSessionState(data ?? null)
    }, { immediate: true })

    const refreshIfStale = () => {
        const lastValidatedAt = useAuthSessionValidationState()

        if (document.visibilityState !== 'visible') {
            return
        }

        if ((Date.now() - lastValidatedAt.value) < SESSION_VISIBILITY_REFRESH_WINDOW_MS) {
            return
        }

        void refreshAuthSession().catch((error) => {
            console.warn('Failed to refresh auth session on visibility change', error)
        })
    }

    onMounted(() => {
        window.addEventListener('focus', refreshIfStale)
        document.addEventListener('visibilitychange', refreshIfStale)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('focus', refreshIfStale)
        document.removeEventListener('visibilitychange', refreshIfStale)
    })
}
