<template>
    <div class="forgot-password-page">
        <div class="auth-card">
            <div class="auth-header">
                <NuxtLink to="/" class="logo-link">
                    <img
                        src="/logo.png"
                        alt="Momei Logo"
                        class="logo"
                    >
                </NuxtLink>
                <h1 class="title">
                    {{ $t('pages.forgot_password.title') }}
                </h1>
                <p class="subtitle">
                    {{ $t('pages.forgot_password.subtitle') }}
                </p>
            </div>

            <form class="auth-form" @submit.prevent="handleForgotPassword">
                <div class="form-group">
                    <label for="email">{{ $t('common.email') }}</label>
                    <InputText
                        id="email"
                        v-model="email"
                        type="email"
                        :placeholder="$t('pages.login.email_placeholder')"
                        required
                        :invalid="!!error"
                        fluid
                    />
                </div>

                <div v-if="error" class="error-message">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ error }}</span>
                </div>

                <div v-if="success" class="success-message">
                    <i class="pi pi-check-circle" />
                    <span>{{ $t('pages.forgot_password.success_message') }}</span>
                </div>

                <Button
                    type="submit"
                    :label="$t('pages.forgot_password.submit')"
                    :loading="loading"
                    class="submit-btn"
                />

                <div class="auth-footer">
                    <NuxtLink to="/login" class="link">
                        {{ $t('pages.forgot_password.back_to_login') }}
                    </NuxtLink>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

definePageMeta({
    layout: 'default',
})

useHead({
    title: t('pages.forgot_password.title'),
})

const handleForgotPassword = async () => {
    if (!email.value) return

    loading.value = true
    error.value = ''
    success.value = false

    try {
        const { error: err } = await authClient.forgetPassword.emailOtp({
            email: email.value,
        })

        if (err) {
            error.value = err.message || t('common.error_occurred')
        } else {
            success.value = true
            navigateTo(`/reset-password?email=${encodeURIComponent(email.value)}`)
        }
    } catch (e: any) {
        error.value = e.message || t('common.error_occurred')
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.forgot-password-page {
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

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--p-text-color);
    }
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
        background-color: rgba(239, 68, 68, 0.1);
    }
}

.success-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--p-green-500);
    font-size: 0.875rem;
    background-color: var(--p-green-50);
    padding: 0.75rem;
    border-radius: 0.5rem;

    :global(.dark) & {
        background-color: rgba(34, 197, 94, 0.1);
    }
}

.submit-btn {
    width: 100%;
}

.auth-footer {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.875rem;

    .link {
        color: var(--p-primary-color);
        text-decoration: none;
        font-weight: 500;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
