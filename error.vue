<template>
    <div class="error-page">
        <AppHeader />

        <main class="error-content">
            <div class="error-card">
                <div class="error-badge">
                    {{ error.statusCode }}
                </div>
                <h1 class="error-title">
                    {{ is404 ? $t('pages.error.404_title') : $t('pages.error.title') }}
                </h1>
                <p class="error-desc">
                    {{ is404 ? $t('pages.error.404_desc') : (error.statusMessage || error.message) }}
                </p>

                <div class="error-actions">
                    <Button
                        id="back-home-btn-global"
                        :label="$t('pages.error.back_home')"
                        icon="pi pi-home"
                        @click="handleError"
                    />
                    <Button
                        v-if="!is404"
                        id="retry-btn-global"
                        :label="$t('pages.error.retry')"
                        icon="pi pi-refresh"
                        severity="secondary"
                        text
                        @click="clearError({redirect: route.path})"
                    />
                </div>
            </div>
        </main>

        <AppFooter />
        <AppSearch />
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    error: {
        type: Object,
        default: () => ({}),
    },
})

const route = useRoute()
const is404 = computed(() => props.error.statusCode === 404)

const handleError = () => clearError({ redirect: '/' })

useHead({
    title: is404.value ? '404 - Not Found' : 'Error',
})
</script>

<style lang="scss" scoped>
.error-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.error-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.error-card {
    max-width: 32rem;
    width: 100%;
    text-align: center;
    padding: 3rem;
    background-color: var(--p-surface-card);
    border-radius: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    border: 1px solid var(--p-surface-border);
}

.error-badge {
    display: inline-flex;
    padding: 0.5rem 1rem;
    background-color: var(--p-primary-50);
    color: var(--p-primary-600);
    font-weight: 700;
    font-size: 1.25rem;
    border-radius: 9999px;
    margin-bottom: 1.5rem;

    :global(.dark) & {
        background-color: var(--p-primary-900);
        color: var(--p-primary-300);
    }
}

.error-title {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--p-text-color);
}

.error-desc {
    color: var(--p-text-muted-color);
    margin-bottom: 2.5rem;
    line-height: 1.6;
    font-size: 1.125rem;
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}
</style>
