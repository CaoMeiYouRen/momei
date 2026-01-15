<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <Toast />
        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

const { setLocale } = useI18n()
const session = authClient.useSession()

const head = useLocaleHead({
    seo: true,
})

useHead({
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
