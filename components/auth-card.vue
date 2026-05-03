<template>
    <div class="auth-page">
        <div class="auth-card">
            <div class="auth-header">
                <NuxtLink :to="localePath('/')" class="logo-link">
                    <img
                        src="/logo.png"
                        alt="Momei Logo"
                        class="logo"
                    >
                </NuxtLink>
                <h1 class="title">
                    {{ $t(titleKey) }}
                </h1>
                <p class="subtitle">
                    {{ $t(subtitleKey) }}
                </p>
            </div>

            <form class="auth-form" @submit.prevent="$emit('submit')">
                <slot />

                <div v-if="error" class="error-message">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ error }}</span>
                </div>

                <Button
                    type="submit"
                    :label="submitLabel"
                    :loading="loading"
                    class="submit-btn"
                />

                <div v-if="$slots.footer" class="auth-footer">
                    <slot name="footer" />
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    titleKey: string
    subtitleKey: string
    submitLabel: string
    loading: boolean
    error: string
}>()

defineEmits<{
    submit: []
}>()

const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
.auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 200px);
    padding: 2rem 1rem;
}

.auth-card {
    width: 100%;
    max-width: 400px;
    background-color: var(--p-surface-card);
    border-radius: 1rem;
    padding: 2.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
    border: 1px solid var(--p-surface-border);
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;

    .logo-link {
        display: inline-block;
        margin-bottom: 1.5rem;
    }

    .logo {
        height: 48px;
        width: auto;
    }

    .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--p-text-color);
        margin-bottom: 0.5rem;
    }

    .subtitle {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-red-500);
    font-size: 0.875rem;
    background-color: var(--p-red-50);
    padding: 0.75rem;
    border-radius: 0.5rem;

    :global(.dark) & {
        background-color: rgb(239 68 68 / 0.1);
    }
}

.submit-btn {
    width: 100%;
}

.auth-footer {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.875rem;
}
</style>
