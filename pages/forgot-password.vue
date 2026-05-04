<template>
    <AuthCard
        title-key="pages.forgot_password.title"
        subtitle-key="pages.forgot_password.subtitle"
        submit-label="pages.forgot_password.submit"
        :loading="loading"
        :error="error"
        @submit="handleForgotPassword"
    >
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

        <div v-if="success" class="success-message">
            <i class="pi pi-check-circle" />
            <span>{{ $t('pages.forgot_password.success_message') }}</span>
        </div>

        <app-captcha ref="captchaRef" v-model="captchaToken" />

        <template #footer>
            <NuxtLink :to="localePath('/login')" class="link">
                {{ $t('pages.forgot_password.back_to_login') }}
            </NuxtLink>
        </template>
    </AuthCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const localePath = useLocalePath()
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const captchaToken = ref('')
const captchaRef = ref<any>(null)

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
            fetchOptions: {
                headers: {
                    'x-captcha-response': captchaToken.value,
                },
            },
        })

        if (err) {
            error.value = err.message || t('common.error_occurred')
            captchaRef.value?.reset()
        } else {
            success.value = true
            navigateTo(
                localePath(
                    `/reset-password?email=${encodeURIComponent(email.value)}`,
                ),
            )
        }
    } catch (e: any) {
        error.value = e.message || t('common.error_occurred')
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
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
        background-color: rgb(34 197 94 / 0.1);
    }
}

.link {
    color: var(--p-primary-color);
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
}
</style>
