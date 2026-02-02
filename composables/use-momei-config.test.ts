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
            siteTitle: '',
            siteDescription: '',
            siteKeywords: '',
            siteCopyright: '',
            defaultLanguage: 'zh-CN',
            baiduAnalytics: '',
            googleAnalytics: '',
            clarityAnalytics: '',
            siteLogo: '',
            siteFavicon: '',
            siteOperator: '',
            contactEmail: '',
            showComplianceInfo: false,
            icpLicenseNumber: '',
            publicSecurityNumber: '',
            footerCode: '',
        }
    })

    it('should initialize with default config', () => {
        const { siteConfig } = useMomeiConfig()

        expect(siteConfig.value).toMatchObject({
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
        }

        mockFetch.mockResolvedValueOnce({ data: mockData })

        const { fetchSiteConfig, siteConfig } = useMomeiConfig()
        await fetchSiteConfig()

        expect(mockFetch).toHaveBeenCalledWith('/api/settings/public')
        expect(siteConfig.value).toMatchObject(mockData)
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

