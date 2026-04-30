import { beforeEach, describe, expect, it, vi } from 'vitest'

const globalFetchMock = vi.fn<typeof fetch>()

vi.stubGlobal('fetch', globalFetchMock)

const {
    createAuthClientMock,
    authBaseUrlState,
    sessionAtomGetMock,
    sessionAtomSetMock,
    storeNotifyMock,
    pluginFactories,
} = vi.hoisted(() => {
    const createPluginFactory = (name: string) => vi.fn(() => name)

    return {
        createAuthClientMock: vi.fn((options: Record<string, unknown>) => ({
            options,
            $Infer: {
                Session: {},
            },
            $store: {
                atoms: {
                    session: {
                        get: sessionAtomGetMock,
                        set: sessionAtomSetMock,
                    },
                },
                notify: storeNotifyMock,
            },
        })),
        authBaseUrlState: {
            value: '',
        },
        sessionAtomGetMock: vi.fn(() => ({
            data: null,
            error: null,
            isPending: false,
            isRefetching: false,
            refetch: vi.fn(),
        })),
        sessionAtomSetMock: vi.fn(),
        storeNotifyMock: vi.fn(),
        pluginFactories: {
            inferAdditionalFields: createPluginFactory('inferAdditionalFields'),
            usernameClient: createPluginFactory('usernameClient'),
            magicLinkClient: createPluginFactory('magicLinkClient'),
            emailOTPClient: createPluginFactory('emailOTPClient'),
            anonymousClient: createPluginFactory('anonymousClient'),
            phoneNumberClient: createPluginFactory('phoneNumberClient'),
            adminClient: createPluginFactory('adminClient'),
            genericOAuthClient: createPluginFactory('genericOAuthClient'),
            twoFactorClient: vi.fn(() => 'twoFactorClient'),
        },
    }
})

vi.mock('better-auth/vue', () => ({
    createAuthClient: createAuthClientMock,
}))

vi.mock('better-auth/client/plugins', () => ({
    inferAdditionalFields: pluginFactories.inferAdditionalFields,
    usernameClient: pluginFactories.usernameClient,
    magicLinkClient: pluginFactories.magicLinkClient,
    emailOTPClient: pluginFactories.emailOTPClient,
    anonymousClient: pluginFactories.anonymousClient,
    phoneNumberClient: pluginFactories.phoneNumberClient,
    adminClient: pluginFactories.adminClient,
    genericOAuthClient: pluginFactories.genericOAuthClient,
    twoFactorClient: pluginFactories.twoFactorClient,
}))

vi.mock('@/utils/shared/env', () => ({
    get AUTH_BASE_URL() {
        return authBaseUrlState.value
    },
}))

async function importAuthClientModule() {
    vi.resetModules()
    const module = await import('./auth-client')
    const options = createAuthClientMock.mock.calls.at(-1)?.[0] as {
        baseURL: string
        sessionOptions: { refetchOnWindowFocus: boolean }
        fetchOptions: { customFetchImpl: typeof fetch }
        plugins: string[]
    }

    return {
        module,
        options,
    }
}

describe('lib/auth-client configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authBaseUrlState.value = ''
        globalFetchMock.mockReset()
        Object.defineProperty(window, '__NUXT__', {
            value: {
                publicRuntimeConfig: {
                    authBaseUrl: 'https://runtime-auth.example.com',
                },
            },
            configurable: true,
            writable: true,
        })
    })

    it('registers generic OAuth client support in the auth client', async () => {
        authBaseUrlState.value = 'https://env-auth.example.com'
        const { options } = await importAuthClientModule()

        expect(options.baseURL).toBe('https://env-auth.example.com')
        expect(options.sessionOptions).toEqual({
            refetchOnWindowFocus: false,
        })
        expect(options.fetchOptions.customFetchImpl).toBeTypeOf('function')
        expect(options.plugins).toContain('genericOAuthClient')
    })

    it('falls back to runtime authBaseUrl when env lock is absent', async () => {
        const { options } = await importAuthClientModule()

        expect(options.baseURL).toBe('https://runtime-auth.example.com')
        expect(options.plugins).toEqual(expect.arrayContaining([
            'inferAdditionalFields',
            'usernameClient',
            'magicLinkClient',
            'emailOTPClient',
            'anonymousClient',
            'phoneNumberClient',
            'adminClient',
            'genericOAuthClient',
            'twoFactorClient',
        ]))
    })

    it('falls back to window origin when both env and runtime auth config are absent', async () => {
        Object.defineProperty(window, '__NUXT__', {
            value: {
                publicRuntimeConfig: {
                    authBaseUrl: '',
                },
            },
            configurable: true,
            writable: true,
        })

        const { options } = await importAuthClientModule()

        expect(options.baseURL).toBe(window.location.origin)
    })

    it('resets the session atom and broadcasts cache busts by default', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        const { module } = await importAuthClientModule()

        module.invalidateAuthSessionRequestCache()

        expect(sessionAtomSetMock).toHaveBeenCalledWith(expect.objectContaining({
            data: null,
            error: null,
            isPending: true,
            isRefetching: false,
            refetch: expect.any(Function),
        }))
        expect(setItemSpy).toHaveBeenCalledWith('momei:auth-session-cache-bust', expect.any(String))
        expect(module.getAuthSessionCacheBustVersion()).toBeGreaterThan(0)
    })

    it('serves primed session cache snapshots without hitting fetch', async () => {
        const { module, options } = await importAuthClientModule()

        module.primeAuthSessionRequestCache(null)

        const response = await options.fetchOptions.customFetchImpl('https://runtime-auth.example.com/api/auth/get-session')

        expect(globalFetchMock).not.toHaveBeenCalled()
        expect(response.status).toBe(200)
        expect(await response.text()).toBe('null')
    })

    it('deduplicates in-flight session requests and reuses successful cached responses', async () => {
        const body = JSON.stringify({
            data: {
                user: {
                    id: 'remote-user',
                },
            },
        })
        globalFetchMock.mockResolvedValue(new Response(body, {
            status: 200,
            headers: {
                'content-type': 'application/json',
            },
        }))

        const { options } = await importAuthClientModule()
        const requestUrl = 'https://runtime-auth.example.com/api/auth/get-session'
        const [firstResponse, secondResponse] = await Promise.all([
            options.fetchOptions.customFetchImpl(requestUrl),
            options.fetchOptions.customFetchImpl(requestUrl),
        ])
        const thirdResponse = await options.fetchOptions.customFetchImpl(requestUrl)

        expect(globalFetchMock).toHaveBeenCalledTimes(1)
        expect(await firstResponse.text()).toBe(body)
        expect(await secondResponse.text()).toBe(body)
        expect(await thirdResponse.text()).toBe(body)
    })

    it('binds the session sync listener once and reacts only to cache bust storage events', async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const { module } = await importAuthClientModule()

        module.initializeAuthSessionSync()
        module.initializeAuthSessionSync()

        expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
        expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))

        const storageListener = addEventListenerSpy.mock.calls[0]?.[1] as ((event: StorageEvent) => void) | undefined
        expect(storageListener).toBeDefined()

        sessionAtomSetMock.mockClear()
        storeNotifyMock.mockClear()
        storageListener?.({ key: 'other-key' } as StorageEvent)
        expect(sessionAtomSetMock).not.toHaveBeenCalled()
        expect(storeNotifyMock).not.toHaveBeenCalled()

        storageListener?.({ key: 'momei:auth-session-cache-bust' } as StorageEvent)
        expect(sessionAtomSetMock).toHaveBeenCalledWith(expect.objectContaining({
            data: null,
            error: null,
            isPending: true,
            isRefetching: false,
            refetch: expect.any(Function),
        }))
        expect(storeNotifyMock).toHaveBeenCalledWith('$sessionSignal')
        expect(module.getAuthSessionCacheBustVersion()).toBeGreaterThan(0)
    })
})
