<template>
    <div class="posts-page">
        <h1 class="posts-page__title">
            {{ $t('pages.posts.title') }}
        </h1>

        <div class="posts-page__list">
            <CaomeiSkeleton
                v-for="i in 6"
                :key="i"
                height="12rem"
                class="posts-page__skeleton"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 移动视觉层的「列表骨架屏」测试挂载页。
 *
 * 真实 `/posts` 在客户端导航时由 Nuxt suspense 等待数据，pending 态不稳定可捕获；
 * 本页只挂载同一 skeleton 结构与样式，供视觉基线冻结 pending 外观。
 * 仅在 TEST_MODE 下可访问，其它运行态直接 404；不参与 sitemap / SEO。
 */
definePageMeta({
    layout: 'default',
})

const runtimeConfig = useRuntimeConfig()

if (!runtimeConfig.public.testMode) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

useSeoMeta({
    robots: 'noindex, nofollow',
})
</script>

<style lang="scss" scoped>
.posts-page {
    max-width: 56rem;
    margin: 0 auto;
    padding: 2rem 1rem;

    &__title {
        font-size: var(--m-font-size-3xl);
        font-weight: 700;
        margin-bottom: 2rem;
        color: var(--caomei-color-text);
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__skeleton {
        border-radius: 0.5rem;
    }
}
</style>
