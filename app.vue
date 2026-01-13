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
const head = useLocaleHead({
    seo: true,
})

useHead({
    htmlAttrs: {
        lang: head.value.htmlAttrs?.lang,
        dir: head.value.htmlAttrs?.dir as 'auto' | 'ltr' | 'rtl' | undefined,
    },
    link: [...(head.value.link || [])],
    meta: [...(head.value.meta || [])],
})
</script>
