<template>
    <AuthCard
        title-key="pages.reset_password.title"
        subtitle-key="pages.reset_password.subtitle"
        submit-label="pages.reset_password.submit"
        :loading="loading"
        :error="error"
        @submit="handleResetPassword"
    >
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
    </AuthCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const localePath = useLocalePath()
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
            router.push(localePath('/login'))
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
</style>
