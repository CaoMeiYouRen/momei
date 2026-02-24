export const useMomeiConfig = () => {
    const siteConfig = useState<any>('siteConfig', () => ({
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
        live2dEnabled: false,
        live2dScriptUrl: '',
        live2dModelUrl: '',
        live2dOptionsJson: '',
        live2dMobileEnabled: false,
        live2dMinWidth: 1024,
        live2dDataSaverBlock: true,
    }))

    const { t } = useI18n()

    const fetchSiteConfig = async () => {
        try {
            const { data } = await $fetch<any>('/api/settings/public')
            if (data) {
                siteConfig.value = data
            }
        } catch (error) {
            console.error('Failed to fetch site config:', error)
        }
    }

    const currentTitle = computed(() => siteConfig.value.siteTitle || t('app.name'))
    const currentDescription = computed(() => siteConfig.value.siteDescription || t('app.description'))
    const currentKeywords = computed(() => siteConfig.value.siteKeywords || t('app.keywords'))
    const currentCopyright = computed(() => siteConfig.value.siteCopyright || '')
    const siteLogo = computed(() => siteConfig.value.siteLogo || '')
    const siteFavicon = computed(() => siteConfig.value.siteFavicon || '')

    return {
        siteConfig,
        fetchSiteConfig,
        currentTitle,
        currentDescription,
        currentKeywords,
        currentCopyright,
        siteLogo,
        siteFavicon,
    }
}
