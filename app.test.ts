import { computed, nextTick, reactive, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport, registerEndpoint } from '@nuxt/test-utils/runtime'
import App from './app.vue'

const createDefaultSiteConfig = () => ({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    siteOperator: '',
    feedbackUrl: '',
    contactEmail: '',
    googleAdsenseAccount: '',
    siteFavicon: '',
    siteLogo: '',
})

let appConfigPayload = createDefaultSiteConfig()

const mockSiteConfig = ref(createDefaultSiteConfig())
const mockFetchSiteConfig = vi.fn(() => {
    mockSiteConfig.value = {
        ...createDefaultSiteConfig(),
        ...appConfigPayload,
    }
})

const sessionState = ref<{ data: { user?: { language?: string } } | null, isPending: boolean }>({
    data: null,
    isPending: false,
})

const routeState = reactive({
    path: '/',
    fullPath: '/',
    query: {} as Record<string, unknown>,
    params: {} as Record<string, unknown>,
    matched: [] as unknown[],
    meta: {},
    hash: '',
    name: 'index___zh-CN___default',
    redirectedFrom: undefined as unknown,
})

const routerState = {
    push: vi.fn(),
    replace: vi.fn(() => Promise.resolve()),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
    currentRoute: { value: routeState },
}

const runtimeConfigState = {
    app: {
        baseURL: '/',
        buildAssetsDir: '/_nuxt/',
        cdnURL: '',
    },
    public: {
        demoMode: false,
    },
}

const localeState = ref('zh-CN')
const localesState = ref([
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en-US', name: 'English' },
])
const setLocaleMock = vi.fn((locale: string) => {
    localeState.value = locale
})
const headMock = vi.fn()
const initializeAuthSessionSyncMock = vi.fn()
const primeHydratedAuthSessionMock = vi.fn()
const setupAuthSessionLifecycleMock = vi.fn()
const startTourMock = vi.fn(async () => true)
const maybeAutoStartTourMock = vi.fn()
const fetchThemeMock = vi.fn(async () => undefined)
const applyThemeMock = vi.fn()

const headState = computed(() => ({
    htmlAttrs: {
        lang: localeState.value,
        dir: 'ltr',
    },
    meta: [{ name: 'og:locale', content: localeState.value }],
    link: [{ rel: 'canonical', href: `https://momei.app${routeState.path}` }],
}))

const createInstallStatusPayload = (overrides: Partial<Record<string, unknown>> = {}) => ({
    installed: true,
    databaseConnected: true,
    hasUsers: true,
    hasInstallationFlag: true,
    envInstallationFlag: false,
    nodeVersion: '20.0.0',
    os: 'linux',
    databaseType: 'sqlite',
    databaseVersion: '3.0.0',
    isServerless: false,
    isNodeVersionSafe: true,
    runtime: 'local-dev',
    envSettings: {},
    deploymentDiagnostics: {
        runtime: 'local-dev',
        platformSupported: true,
        blockerCount: 0,
        warningCount: 0,
        hasBlockingIssues: false,
        issues: [],
    },
    ...overrides,
})

const registerInstallStatusEndpoint = (overrides: Partial<Record<string, unknown>> = {}) => {
    registerEndpoint('/api/install/status', () => ({
        data: createInstallStatusPayload(overrides),
    }))
}

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRouter', () => () => routerState)
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfigState)
const localeCodes = ['zh-CN', 'en-US']

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    setLocale: (...args: Parameters<typeof setLocaleMock>) => setLocaleMock(...args),
    locale: localeState,
    locales: localesState,
    localeCodes,
    availableLocales: localeCodes,
}))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useLocaleHead', () => () => headState)
mockNuxtImport('useHead', () => (...args: Parameters<typeof headMock>) => headMock(...args))
mockNuxtImport('useOnboarding', () => () => ({
    startTour: (...args: Parameters<typeof startTourMock>) => startTourMock(...args),
    maybeAutoStartTour: (...args: Parameters<typeof maybeAutoStartTourMock>) => maybeAutoStartTourMock(...args),
}))
mockNuxtImport('useTheme', () => () => ({
    fetchTheme: (...args: Parameters<typeof fetchThemeMock>) => fetchThemeMock(...args),
    applyTheme: (...args: Parameters<typeof applyThemeMock>) => applyThemeMock(...args),
}))

vi.mock('@/lib/auth-client', () => ({
    initializeAuthSessionSync: (...args: Parameters<typeof initializeAuthSessionSyncMock>) => initializeAuthSessionSyncMock(...args),
    authClient: {
        useSession: () => sessionState,
    },
}))

vi.mock('@/composables/use-auth-session', () => ({
    primeHydratedAuthSession: (...args: Parameters<typeof primeHydratedAuthSessionMock>) => primeHydratedAuthSessionMock(...args),
    setupAuthSessionLifecycle: (...args: Parameters<typeof setupAuthSessionLifecycleMock>) => setupAuthSessionLifecycleMock(...args),
    useAuthSession: () => sessionState,
}))

mockNuxtImport('useMomeiConfig', () => () => ({
    siteConfig: mockSiteConfig,
    fetchSiteConfig: mockFetchSiteConfig,
    currentTitle: computed(() => mockSiteConfig.value.siteTitle || 'Momei Blog'),
    currentDescription: computed(() => mockSiteConfig.value.siteDescription || ''),
    currentKeywords: computed(() => mockSiteConfig.value.siteKeywords || ''),
    googleAdsenseAccount: computed(() => mockSiteConfig.value.googleAdsenseAccount || ''),
    siteFavicon: computed(() => mockSiteConfig.value.siteFavicon || ''),
    siteLogo: computed(() => mockSiteConfig.value.siteLogo || ''),
}))

describe('app.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        appConfigPayload = createDefaultSiteConfig()
        mockSiteConfig.value = createDefaultSiteConfig()
        sessionState.value = {
            data: null,
            isPending: false,
        }
        routeState.path = '/'
        routeState.fullPath = '/'
        routeState.query = {}
        routeState.params = {}
        routeState.matched = []
        routeState.meta = {}
        routeState.hash = ''
        routeState.name = 'index___zh-CN___default'
        routeState.redirectedFrom = undefined
        routerState.currentRoute.value = routeState
        runtimeConfigState.public.demoMode = false
        localeState.value = 'zh-CN'
        fetchThemeMock.mockResolvedValue(undefined)
        mockFetchSiteConfig.mockImplementation(() => {
            mockSiteConfig.value = {
                ...createDefaultSiteConfig(),
                ...appConfigPayload,
            }
        })
        registerInstallStatusEndpoint()
    })

    it('skips initial settings fetches on installation routes but still wires auth and theme lifecycle', async () => {
        routeState.path = '/installation'
        routeState.fullPath = '/installation'

        const wrapper = await mountSuspended(App)

        expect(wrapper.exists()).toBe(true)
        expect(initializeAuthSessionSyncMock).toHaveBeenCalledTimes(1)
        expect(primeHydratedAuthSessionMock).toHaveBeenCalledTimes(1)
        expect(setupAuthSessionLifecycleMock).toHaveBeenCalledWith(sessionState)
        expect(applyThemeMock).toHaveBeenCalledTimes(1)
        expect(fetchThemeMock).not.toHaveBeenCalled()
        expect(mockFetchSiteConfig).not.toHaveBeenCalled()

        localeState.value = 'en-US'
        await nextTick()

        expect(mockFetchSiteConfig).not.toHaveBeenCalled()
    })

    it('logs initialization failures on regular pages and builds head metadata from site config', async () => {
        appConfigPayload = {
            ...createDefaultSiteConfig(),
            siteTitle: 'Momei Test',
            siteDescription: 'Runtime description',
            siteKeywords: 'momei,test',
            googleAdsenseAccount: 'ca-pub-123',
            siteFavicon: '/test.ico',
        }
        fetchThemeMock.mockRejectedValueOnce(new Error('theme failed'))
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountSuspended(App)

        await vi.waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch initial data:', expect.any(Error))
        })
        expect(fetchThemeMock).toHaveBeenCalledTimes(1)
        expect(mockFetchSiteConfig).toHaveBeenCalled()
        expect(applyThemeMock).toHaveBeenCalledTimes(1)

        const headConfig = headMock.mock.calls.find((call) => typeof call[0]?.titleTemplate === 'function')?.[0]
        expect(headConfig).toBeDefined()
        expect(headConfig.titleTemplate('Home')).toBe('Home - Momei Test')
        expect(headConfig.htmlAttrs).toMatchObject({ lang: 'zh-CN', dir: 'ltr' })
        expect(headConfig.meta).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'description', content: 'Runtime description' }),
            expect.objectContaining({ name: 'keywords', content: 'momei,test' }),
            expect.objectContaining({ name: 'google-adsense-account', content: 'ca-pub-123' }),
            expect.objectContaining({ name: 'og:locale', content: 'zh-CN' }),
        ]))
        expect(headConfig.link).toEqual(expect.arrayContaining([
            expect.objectContaining({ rel: 'icon', href: '/test.ico' }),
            expect.objectContaining({ rel: 'alternate', href: '/feed.xml' }),
            expect.objectContaining({ rel: 'preconnect', href: 'https://www.googletagmanager.com' }),
            expect.objectContaining({ rel: 'canonical', href: 'https://momei.app/' }),
        ]))

        consoleErrorSpy.mockRestore()
    })

    it('starts the demo tour on demand and auto-runs in demo mode', async () => {
        runtimeConfigState.public.demoMode = true

        await mountSuspended(App)

        expect(maybeAutoStartTourMock).toHaveBeenCalled()

        maybeAutoStartTourMock.mockClear()
        startTourMock.mockClear()

        window.dispatchEvent(new CustomEvent('momei:start-tour'))
        await nextTick()
        expect(startTourMock).toHaveBeenCalled()
    })

    it('reruns the demo onboarding check after client-side route changes in demo mode', async () => {
        runtimeConfigState.public.demoMode = true

        await mountSuspended(App)

        expect(maybeAutoStartTourMock).toHaveBeenCalled()

        maybeAutoStartTourMock.mockClear()

        routeState.fullPath = '/posts?page=2'
        await nextTick()
        await nextTick()

        expect(maybeAutoStartTourMock).toHaveBeenCalled()
    })

    it('applies session language preferences and refreshes site config when locale changes off installation routes', async () => {
        routeState.path = '/about'
        routeState.fullPath = '/about'

        await mountSuspended(App)

        await vi.waitFor(() => {
            expect(mockFetchSiteConfig).toHaveBeenCalled()
        })
        mockFetchSiteConfig.mockClear()

        sessionState.value = {
            data: {
                user: {
                    language: 'en-US',
                },
            },
            isPending: false,
        }

        await vi.waitFor(() => {
            expect(setLocaleMock).toHaveBeenCalledWith('en-US')
        })
        await vi.waitFor(() => {
            expect(mockFetchSiteConfig).toHaveBeenCalled()
        })

        mockFetchSiteConfig.mockClear()
        localeState.value = 'ja-JP'
        await vi.waitFor(() => {
            expect(mockFetchSiteConfig).toHaveBeenCalled()
        })
    })

    it('hydrates feedback page content from shared site config during app initialization', async () => {
        appConfigPayload = {
            siteTitle: 'Momei Blog Test',
            siteDescription: 'A test blog',
            siteKeywords: '',
            siteOperator: '墨梅运维',
            feedbackUrl: 'https://support.example.com',
            contactEmail: 'support@example.com',
            googleAdsenseAccount: '',
            siteFavicon: '',
            siteLogo: '',
        }
        routeState.path = '/feedback'
        routeState.fullPath = '/feedback'

        const wrapper = await mountSuspended(App)

        await vi.waitFor(() => {
            expect(mockFetchSiteConfig).toHaveBeenCalled()
        })
        expect(wrapper.text()).toContain('墨梅运维')
    })
})
