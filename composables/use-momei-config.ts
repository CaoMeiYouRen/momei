export interface MomeiPublicConfig {
    siteName: string
    siteTitle: string
    siteDescription: string
    siteKeywords: string
    siteCopyright: string
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
    webPushEnabled: boolean
    webPushPublicKey: string
}

const createDefaultSiteConfig = (): MomeiPublicConfig => ({
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
    webPushEnabled: false,
    webPushPublicKey: '',
})

export const useMomeiConfig = () => {
    const siteConfig = useState<MomeiPublicConfig>('siteConfig', createDefaultSiteConfig)

    const { t } = useI18n()

    const fetchSiteConfig = async () => {
        try {
            const { data } = await $fetch<{ data: Partial<MomeiPublicConfig> }>('/api/settings/public')
            if (data) {
                siteConfig.value = {
                    ...createDefaultSiteConfig(),
                    ...data,
                }
            }
        } catch (error) {
            console.error('Failed to fetch site config:', error)
        }
    }

    const currentTitle = computed(() => siteConfig.value.siteTitle || siteConfig.value.siteName || t('app.name'))
    const currentDescription = computed(() => siteConfig.value.siteDescription || t('app.description'))
    const currentKeywords = computed(() => siteConfig.value.siteKeywords || t('app.keywords'))
    const currentCopyright = computed(() => siteConfig.value.siteCopyright || '')
    const googleAdsenseAccount = computed(() => siteConfig.value.googleAdsenseAccount || '')
    const siteLogo = computed(() => siteConfig.value.siteLogo || '')
    const siteFavicon = computed(() => siteConfig.value.siteFavicon || '')

    return {
        siteConfig,
        fetchSiteConfig,
        currentTitle,
        currentDescription,
        currentKeywords,
        currentCopyright,
        googleAdsenseAccount,
        siteLogo,
        siteFavicon,
    }
}
