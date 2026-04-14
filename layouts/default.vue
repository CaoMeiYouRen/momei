<template>
    <div class="layout-default">
        <AppHeader />
        <main class="layout-default__main">
            <slot />
        </main>
        <AppFooter />
        <FeedbackEntryButton />
        <LazyAppSearch v-if="isSearchReady" />
        <ClientOnly>
            <template v-if="shouldMountEffects">
                <LazyCanvasNestEffect />
                <LazyLive2dWidget />
            </template>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
const { isSearchReady } = useSearch()
const { runWhenIdle } = useClientEffectGuard()
const shouldMountEffects = ref(import.meta.test)

onMounted(() => {
    if (shouldMountEffects.value) {
        return
    }

    runWhenIdle(() => {
        shouldMountEffects.value = true
    }, {
        timeout: 6000,
        fallbackDelay: 1800,
    })
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
