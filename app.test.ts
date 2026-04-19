import { computed, ref } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

const mockSiteConfig = ref(createDefaultSiteConfig())
const mockFetchSiteConfig = vi.fn(() => {
    mockSiteConfig.value = {
        ...createDefaultSiteConfig(),
        ...appConfigPayload,
    }
})

let appConfigPayload = createDefaultSiteConfig()

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
        registerInstallStatusEndpoint()
    })

    it('should render the app layout with main components', async () => {
        const wrapper = await mountSuspended(App)

        // Check that the app renders
        expect(wrapper.exists()).toBe(true)

        // Check for key layout elements
        const html = wrapper.html()
        expect(html).toBeTruthy()
        expect(html.length).toBeGreaterThan(0)
    })

    it('should render on installation page', async () => {
        registerInstallStatusEndpoint({
            installed: false,
            databaseConnected: false,
            hasUsers: false,
            hasInstallationFlag: false,
        })

        const wrapper = await mountSuspended(App, {
            route: '/installation',
        })

        expect(wrapper.exists()).toBe(true)
    })

    it('should render on regular pages', async () => {
        const wrapper = await mountSuspended(App, {
            route: '/about',
        })

        expect(wrapper.exists()).toBe(true)
        expect(mockFetchSiteConfig).toHaveBeenCalled()
    })

    it('should hydrate shared site config for feedback page through app initialization', async () => {
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

        const wrapper = await mountSuspended(App, {
            route: '/feedback',
        })

        expect(mockFetchSiteConfig).toHaveBeenCalled()
        expect(wrapper.text()).toContain('联系 墨梅运维 的站点管理员')
        expect(wrapper.find('a[href="https://support.example.com"]').exists()).toBe(true)
    })
})
