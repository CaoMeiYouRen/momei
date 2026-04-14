import type { AppLocaleCode } from '@/i18n/config/locale-registry'

export interface MomeiPublicConfigI18nMeta {
    locale: AppLocaleCode
    fallbackChain: AppLocaleCode[]
    resolvedLocales: Record<string, AppLocaleCode | 'legacy' | null>
}

export interface MomeiPublicConfig {
    siteName: string
    siteTitle: string
    siteDescription: string
    siteKeywords: string
    postCopyright: string
    siteCopyrightOwner: string
    siteCopyrightStartYear: string
    defaultLanguage: string
    baiduAnalytics: string
    googleAnalytics: string
    clarityAnalytics: string
    googleAdsenseAccount: string
    siteLogo: string
    siteFavicon: string
    siteOperator: string
    contactEmail: string
    feedbackUrl: string
    showComplianceInfo: boolean
    icpLicenseNumber: string
    publicSecurityNumber: string
    footerCode: string
    travellingsEnabled: boolean
    travellingsHeaderEnabled: boolean
    travellingsFooterEnabled: boolean
    travellingsSidebarEnabled: boolean
    live2dEnabled: boolean
    live2dScriptUrl: string
    live2dModelUrl: string
    live2dOptionsJson: string
    live2dMobileEnabled: boolean
    live2dMinWidth: number
    live2dDataSaverBlock: boolean
    canvasNestEnabled: boolean
    canvasNestOptionsJson: string
    canvasNestMobileEnabled: boolean
    canvasNestMinWidth: number
    canvasNestDataSaverBlock: boolean
    effectsMobileEnabled: boolean | null
    effectsMinWidth: number | null
    effectsDataSaverBlock: boolean | null
    externalFeedEnabled: boolean
    externalFeedHomeEnabled: boolean
    externalFeedHomeLimit: number
    webPushEnabled: boolean
    webPushPublicKey: string
    i18n?: MomeiPublicConfigI18nMeta
}

const createDefaultSiteConfig = (): MomeiPublicConfig => ({
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    postCopyright: '',
    siteCopyrightOwner: '',
    siteCopyrightStartYear: '',
    defaultLanguage: 'zh-CN',
    baiduAnalytics: '',
    googleAnalytics: '',
    clarityAnalytics: '',
    googleAdsenseAccount: '',
    siteLogo: '',
    siteFavicon: '',
    siteOperator: '',
    contactEmail: '',
    feedbackUrl: '',
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
    externalFeedEnabled: false,
    externalFeedHomeEnabled: false,
    externalFeedHomeLimit: 6,
    webPushEnabled: false,
    webPushPublicKey: '',
    i18n: undefined,
})

export const useMomeiConfig = () => {
    const siteConfig = useState<MomeiPublicConfig>('siteConfig', createDefaultSiteConfig)
    const loadedLocale = useState<string | null>('site-config-loaded-locale', () => null)

    const { t, locale } = useI18n()

    const fetchSiteConfig = async (options?: { force?: boolean, locale?: string }) => {
        const targetLocale = options?.locale || locale.value

        if (!options?.force && loadedLocale.value === targetLocale) {
            return
        }

        try {
            const { data } = await $fetch<{ data: Partial<MomeiPublicConfig> }>('/api/settings/public', {
                query: {
                    locale: targetLocale,
                },
            })
            if (data) {
                siteConfig.value = {
                    ...createDefaultSiteConfig(),
                    ...data,
                }
                loadedLocale.value = targetLocale
            }
        } catch (error) {
            console.error('Failed to fetch site config:', error)
        }
    }

    const currentTitle = computed(() => siteConfig.value.siteTitle || siteConfig.value.siteName || t('app.name'))
    const currentDescription = computed(() => siteConfig.value.siteDescription || t('app.description'))
    const currentKeywords = computed(() => siteConfig.value.siteKeywords || t('app.keywords'))
    const currentPostCopyright = computed(() => siteConfig.value.postCopyright || '')
    const googleAdsenseAccount = computed(() => siteConfig.value.googleAdsenseAccount || '')
    const siteLogo = computed(() => siteConfig.value.siteLogo || '')
    const siteFavicon = computed(() => siteConfig.value.siteFavicon || '')

    return {
        siteConfig,
        loadedLocale,
        fetchSiteConfig,
        currentTitle,
        currentDescription,
        currentKeywords,
        currentPostCopyright,
        currentCopyright: currentPostCopyright,
        googleAdsenseAccount,
        siteLogo,
        siteFavicon,
    }
}
