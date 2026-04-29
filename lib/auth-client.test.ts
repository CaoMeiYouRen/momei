import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
