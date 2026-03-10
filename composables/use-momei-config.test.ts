import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
        'app.name': 'Momei Blog',
        'app.description': 'AI-powered developer blog',
        'app.keywords': 'blog, AI, developer',
    }
    return translations[key] || key
})

mockNuxtImport('useI18n', () => () => ({
    t: mockT,
}))

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

import { useMomeiConfig } from './use-momei-config'

describe('useMomeiConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset the shared state by getting a fresh instance
        const { siteConfig } = useMomeiConfig()
        siteConfig.value = {
            siteName: '',
            siteTitle: '',
            siteDescription: '',
            siteKeywords: '',
            siteCopyright: '',
            defaultLanguage: 'zh-CN',
            baiduAnalytics: '',
            googleAnalytics: '',
            clarityAnalytics: '',
            googleAdsenseAccount: '',
            siteLogo: '',
            siteFavicon: '',
            siteOperator: '',
            contactEmail: '',
            showComplianceInfo: false,
            icpLicenseNumber: '',
            publicSecurityNumber: '',
            footerCode: '',
            travellingsEnabled: true,
            travellingsHeaderEnabled: true,
            travellingsFooterEnabled: true,
            travellingsSidebarEnabled: true,
            live2dEnabled: false,
            live2dScriptUrl: '',
            live2dModelUrl: '',
            live2dOptionsJson: '',
            live2dMobileEnabled: false,
            live2dMinWidth: 1024,
            live2dDataSaverBlock: true,
            canvasNestEnabled: false,
            canvasNestOptionsJson: '',
            canvasNestMobileEnabled: false,
            canvasNestMinWidth: 1024,
            canvasNestDataSaverBlock: true,
            effectsMobileEnabled: null,
            effectsMinWidth: null,
            effectsDataSaverBlock: null,
            webPushEnabled: false,
            webPushPublicKey: '',
        }
    })

    it('should initialize with default config', () => {
        const { siteConfig } = useMomeiConfig()

        expect(siteConfig.value).toMatchObject({
            siteName: '',
            siteTitle: '',
            siteDescription: '',
            siteKeywords: '',
            siteCopyright: '',
            defaultLanguage: 'zh-CN',
        })
    })

    it('should fetch site config successfully', async () => {
        const mockData = {
            siteTitle: 'My Blog',
            siteDescription: 'My awesome blog',
            siteKeywords: 'blog, tech',
            siteCopyright: '© 2024',
            defaultLanguage: 'en-US',
            travellingsEnabled: false,
            webPushEnabled: true,
            webPushPublicKey: 'public-key',
        }

        mockFetch.mockResolvedValueOnce({ data: mockData })

        const { fetchSiteConfig, siteConfig } = useMomeiConfig()
        await fetchSiteConfig()

        expect(mockFetch).toHaveBeenCalledWith('/api/settings/public')
        expect(siteConfig.value).toMatchObject(mockData)
    })

    it('should keep travellings flags reactive', () => {
        const { siteConfig } = useMomeiConfig()

        expect(siteConfig.value.travellingsEnabled).toBe(true)
        expect(siteConfig.value.travellingsSidebarEnabled).toBe(true)

        siteConfig.value.travellingsEnabled = false
        siteConfig.value.travellingsSidebarEnabled = false

        expect(siteConfig.value.travellingsEnabled).toBe(false)
        expect(siteConfig.value.travellingsSidebarEnabled).toBe(false)
    })

    it('should handle fetch error gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Mute console error in tests
        })
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const { fetchSiteConfig, siteConfig } = useMomeiConfig()
        const originalConfig = { ...siteConfig.value }

        await fetchSiteConfig()

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to fetch site config:',
            expect.any(Error),
        )
        // Config should remain unchanged on error
        expect(siteConfig.value).toEqual(originalConfig)

        consoleErrorSpy.mockRestore()
    })

    it('should compute currentTitle with fallback', () => {
        const { currentTitle, siteConfig } = useMomeiConfig()

        // Should use fallback when empty
        expect(currentTitle.value).toBe('Momei Blog')

        siteConfig.value.siteName = 'Fallback Name'
        expect(currentTitle.value).toBe('Fallback Name')

        // Should use config value when set
        siteConfig.value.siteTitle = 'Custom Title'
        expect(currentTitle.value).toBe('Custom Title')
    })

    it('should compute currentDescription with fallback', () => {
        const { currentDescription, siteConfig } = useMomeiConfig()

        // Should use fallback when empty
        expect(currentDescription.value).toBe('AI-powered developer blog')

        // Should use config value when set
        siteConfig.value.siteDescription = 'Custom Description'
        expect(currentDescription.value).toBe('Custom Description')
    })

    it('should compute currentKeywords with fallback', () => {
        const { currentKeywords, siteConfig } = useMomeiConfig()

        // Should use fallback when empty
        expect(currentKeywords.value).toBe('blog, AI, developer')

        // Should use config value when set
        siteConfig.value.siteKeywords = 'custom, keywords'
        expect(currentKeywords.value).toBe('custom, keywords')
    })

    it('should compute currentCopyright', () => {
        const { currentCopyright, siteConfig } = useMomeiConfig()

        // Should be empty by default
        expect(currentCopyright.value).toBe('')

        // Should use config value when set
        siteConfig.value.siteCopyright = '© 2024 My Blog'
        expect(currentCopyright.value).toBe('© 2024 My Blog')
    })

    it('should compute googleAdsenseAccount', () => {
        const { googleAdsenseAccount, siteConfig } = useMomeiConfig()

        expect(googleAdsenseAccount.value).toBe('')

        siteConfig.value.googleAdsenseAccount = 'ca-pub-1234567890123456'
        expect(googleAdsenseAccount.value).toBe('ca-pub-1234567890123456')
    })

    it('should compute siteLogo', () => {
        const { siteLogo, siteConfig } = useMomeiConfig()

        // Should be empty by default
        expect(siteLogo.value).toBe('')

        // Should use config value when set
        siteConfig.value.siteLogo = '/logo.png'
        expect(siteLogo.value).toBe('/logo.png')
    })

    it('should compute siteFavicon', () => {
        const { siteFavicon, siteConfig } = useMomeiConfig()

        // Should be empty by default
        expect(siteFavicon.value).toBe('')

        // Should use config value when set
        siteConfig.value.siteFavicon = '/favicon.ico'
        expect(siteFavicon.value).toBe('/favicon.ico')
    })
})

