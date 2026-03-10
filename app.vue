<template>
    <div>
        <DemoBanner />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <Toast />
        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

const { t, setLocale } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const session = authClient.useSession()
const { startTour, maybeAutoStartTour } = useOnboarding()
const { fetchTheme, applyTheme } = useTheme()
const {
    fetchSiteConfig,
    currentTitle,
    currentDescription,
    currentKeywords,
    googleAdsenseAccount,
    siteFavicon,
    siteLogo,
} = useMomeiConfig()

// 初始化主题与站点配置
// 排除安装页面，避免在数据库未就绪时请求主题导致错误
const isInstallationPage = computed(() => {
    return route.path.includes('/installation')
})

const initializeAppSettings = async () => {
    if (isInstallationPage.value) {
        return
    }

    try {
        await Promise.all([
            fetchTheme(),
            fetchSiteConfig(),
        ])
    } catch (error) {
        console.error('Failed to fetch initial data:', error)
    }
}

applyTheme()

const handleStartTour = () => {
    void startTour()
}

if (import.meta.server) {
    await initializeAppSettings()
} else {
    void initializeAppSettings()
}

onMounted(() => {
    window.addEventListener('momei:start-tour', handleStartTour)

    if (config.public.demoMode) {
        maybeAutoStartTour()
    }
})

onBeforeUnmount(() => {
    if (import.meta.client) {
        window.removeEventListener('momei:start-tour', handleStartTour)
    }
})

watch(() => route.fullPath, async () => {
    if (!import.meta.client || !config.public.demoMode) {
        return
    }

    await nextTick()
    maybeAutoStartTour()
})

const head = useLocaleHead({
    seo: {
        canonicalQueries: ['page'],
    },
})

useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} - ${currentTitle.value}` : currentTitle.value
    },
    htmlAttrs: {
        lang: head.value.htmlAttrs?.lang,
        dir: head.value.htmlAttrs?.dir as 'auto' | 'ltr' | 'rtl' | undefined,
    },
    meta: [
        { name: 'description', content: currentDescription.value },
        { name: 'keywords', content: currentKeywords.value },
        ...(googleAdsenseAccount.value
            ? [{ name: 'google-adsense-account', content: googleAdsenseAccount.value }]
            : []),
        ...(head.value.meta || []),
    ],
    link: [
        ...(head.value.link || []),
        {
            rel: 'icon',
            type: 'image/x-icon',
            href: siteFavicon.value || '/favicon.ico',
        },
        {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: 'RSS Feed',
            href: '/feed.xml',
        },
        {
            rel: 'alternate',
            type: 'application/atom+xml',
            title: 'Atom Feed',
            href: '/feed.atom',
        },
        {
            rel: 'alternate',
            type: 'application/feed+json',
            title: 'JSON Feed',
            href: '/feed.json',
        },
        {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: 'Podcast RSS Feed',
            href: '/feed/podcast.xml',
        },
        {
            rel: 'alternate',
            type: 'application/atom+xml',
            title: 'Podcast Atom Feed',
            href: '/feed/podcast.atom',
        },
        {
            rel: 'alternate',
            type: 'application/feed+json',
            title: 'Podcast JSON Feed',
            href: '/feed/podcast.json',
        },
        {
            rel: 'preconnect',
            href: 'https://www.googletagmanager.com',
        },
        {
            rel: 'preconnect',
            href: 'https://hm.baidu.com',
        },
        {
            rel: 'preconnect',
            href: 'https://cdn.jsdelivr.net',
            crossorigin: '',
        },
        {
            rel: 'dns-prefetch',
            href: 'https://hm.baidu.com',
        },
        {
            rel: 'dns-prefetch',
            href: 'https://www.googletagmanager.com',
        },
    ],
})

// 监听用户语言偏好并自动切换
watch(() => (session.value?.data?.user as any)?.language, (lang) => {
    if (lang) {
        setLocale(lang)
    }
}, { immediate: true })
</script>
