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
const session = authClient.useSession()
const { startTour } = useOnboarding()
const { fetchTheme, applyTheme } = useTheme()

// 初始化主题
// 排除安装页面，避免在数据库未就绪时请求主题导致错误
const isInstallationPage = computed(() => {
    return route.path.includes('/installation')
})

if (!isInstallationPage.value) {
    try {
        await fetchTheme()
    } catch (error) {
        console.error('Failed to fetch theme:', error)
    }
}
applyTheme()

onMounted(() => {
    window.addEventListener('momei:start-tour', startTour)

    // 如果是 Demo 模式且是第一次访问，自动开启引导
    const config = useRuntimeConfig()
    if (config.public.demoMode) {
        const hasToured = localStorage.getItem('momei_demo_toured')
        if (!hasToured) {
            setTimeout(startTour, 1500)
            localStorage.setItem('momei_demo_toured', 'true')
        }
    }
})

const head = useLocaleHead({
    seo: true,
})

useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} - ${t('app.name')}` : t('app.name')
    },
    htmlAttrs: {
        lang: head.value.htmlAttrs?.lang,
        dir: head.value.htmlAttrs?.dir as 'auto' | 'ltr' | 'rtl' | undefined,
    },
    link: [
        ...(head.value.link || []),
        {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: 'RSS Feed',
            href: '/feed.xml',
        },
        {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: 'Podcast Feed',
            href: '/feed/podcast.xml',
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
    meta: [...(head.value.meta || [])],
})

// 监听用户语言偏好并自动切换
watch(() => (session.value?.data?.user as any)?.language, (lang) => {
    if (lang) {
        setLocale(lang)
    }
}, { immediate: true })
</script>
