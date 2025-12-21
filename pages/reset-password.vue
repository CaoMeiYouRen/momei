<template>
    <div class="reset-password-page">
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
                    {{ $t('pages.reset_password.title') }}
                </h1>
                <p class="subtitle">
                    {{ $t('pages.reset_password.subtitle') }}
                </p>
            </div>

            <form class="auth-form" @submit.prevent="handleResetPassword">
                <div class="form-group">
                    <label for="email">{{ $t('common.email') }}</label>
                    <InputText
                        id="email"
                        v-model="email"
                        type="email"
                        required
                        fluid
                        :disabled="!!route.query.email"
                    />
                </div>

                <div class="form-group">
                    <label for="otp">{{ $t('common.otp') }}</label>
                    <InputText
                        id="otp"
                        v-model="otp"
                        type="text"
                        :placeholder="$t('pages.reset_password.otp_placeholder')"
                        required
                        fluid
                    />
                </div>

                <div class="form-group">
                    <label for="password">{{ $t('pages.reset_password.new_password') }}</label>
                    <Password
                        id="password"
                        v-model="password"
                        :placeholder="$t('pages.reset_password.new_password_placeholder')"
                        toggle-mask
                        :feedback="true"
                        required
                        fluid
                    />
                </div>

                <div class="form-group">
                    <label for="confirmPassword">{{ $t('pages.reset_password.confirm_password') }}</label>
                    <Password
                        id="confirmPassword"
                        v-model="confirmPassword"
                        :placeholder="$t('pages.reset_password.confirm_password_placeholder')"
                        toggle-mask
                        :feedback="false"
                        required
                        fluid
                        :invalid="passwordMismatch"
                    />
                    <small v-if="passwordMismatch" class="p-error">{{ $t('pages.register.password_mismatch') }}</small>
                </div>

                <div v-if="error" class="error-message">
                    <i class="pi pi-exclamation-circle" />
                    <span>{{ error }}</span>
                </div>

                <Button
                    type="submit"
                    :label="$t('pages.reset_password.submit')"
                    :loading="loading"
                    class="submit-btn"
                />
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const email = ref((route.query.email as string) || '')
const otp = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

definePageMeta({
    layout: 'default',
})

useHead({
    title: t('pages.reset_password.title'),
})

const passwordMismatch = computed(() => {
    return !!(password.value && confirmPassword.value && password.value !== confirmPassword.value)
})

const handleResetPassword = async () => {
    if (passwordMismatch.value || !password.value || !email.value || !otp.value) return

    loading.value = true
    error.value = ''

    try {
        const { error: err } = await authClient.emailOtp.resetPassword({
            email: email.value,
            otp: otp.value,
            password: password.value,
        })

        if (err) {
            error.value = err.message || t('common.error_occurred')
        } else {
            // Success, redirect to login
            router.push('/login')
        }
    } catch (e: any) {
        error.value = e.message || t('common.error_occurred')
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.reset-password-page {
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

.submit-btn {
    width: 100%;
}
</style>
