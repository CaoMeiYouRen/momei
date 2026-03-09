<template>
    <div class="layout-default">
        <AppHeader />
        <main class="layout-default__main">
            <slot />
        </main>
        <AppFooter />
        <LazyAppSearch />
        <ClientOnly>
            <LazyCanvasNestEffect />
            <LazyLive2dWidget />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
const { fetchSiteConfig, siteConfig } = useMomeiConfig()

await useAsyncData('momei-public-settings', async () => {
    await fetchSiteConfig()
    return siteConfig.value
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.layout-default {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-ground);

    &__main {
        @include page-container(1440px);

        flex: 1;
        padding-top: $spacing-md;
        padding-bottom: $spacing-xl;
        display: flex;
        flex-direction: column;
    }
}
</style>
