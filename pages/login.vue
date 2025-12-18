<template>
    <div class="login-page">
        <Card class="login-card">
            <template #title>
                <div class="login-card__header">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        class="login-card__logo"
                    >
                    <h1 class="login-card__title">
                        {{ $t('pages.login.title') }}
                    </h1>
                </div>
            </template>
            <template #content>
                <div class="login-form">
                    <Button
                        :label="$t('pages.login.github_login')"
                        icon="pi pi-github"
                        class="login-form__github-btn"
                        severity="secondary"
                        outlined
                        @click="handleGithubLogin"
                    />

                    <Divider align="center" class="login-form__divider">
                        <span class="login-form__divider-text">{{ $t('pages.login.or_continue_with_email') }}</span>
                    </Divider>

                    <form class="login-form__fields" @submit.prevent="handleEmailLogin">
                        <div class="login-form__field">
                            <label for="email">{{ $t('pages.login.email') }}</label>
                            <InputText
                                id="email"
                                v-model="form.email"
                                type="email"
                                :invalid="!!errors.email"
                                class="login-form__input"
                            />
                            <Message
                                v-if="errors.email"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ errors.email }}
                            </Message>
                        </div>

                        <div class="login-form__field">
                            <label for="password">{{ $t('pages.login.password') }}</label>
                            <Password
                                id="password"
                                v-model="form.password"
                                :feedback="false"
                                toggle-mask
                                :invalid="!!errors.password"
                                fluid
                            />
                            <Message
                                v-if="errors.password"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ errors.password }}
                            </Message>
                        </div>

                        <div class="login-form__actions">
                            <div class="login-form__remember">
                                <Checkbox
                                    v-model="form.rememberMe"
                                    binary
                                    input-id="rememberMe"
                                />
                                <label for="rememberMe">{{ $t('pages.login.remember_me') }}</label>
                            </div>
                            <NuxtLink to="/forgot-password" class="login-form__forgot">
                                {{ $t('pages.login.forgot_password') }}
                            </NuxtLink>
                        </div>

                        <Button
                            type="submit"
                            :label="$t('pages.login.submit')"
                            :loading="loading"
                            class="login-form__submit-btn"
                        />
                    </form>
                </div>
            </template>
            <template #footer>
                <div class="login-card__footer">
                    <NuxtLink to="/register" class="login-card__register-link">
                        {{ $t('pages.login.no_account') }}
                    </NuxtLink>
                </div>
            </template>
        </Card>
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const form = reactive({
    email: '',
    password: '',
    rememberMe: false,
})
const errors = reactive({
    email: '',
    password: '',
})

const handleGithubLogin = async () => {
    await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/',
    })
}

const handleEmailLogin = async () => {
    errors.email = ''
    errors.password = ''

    if (!form.email) {
        errors.email = t('pages.login.email_required')
        return
    }
    if (!form.password) {
        errors.password = t('pages.login.password_required')
        return
    }

    loading.value = true
    try {
        const { error } = await authClient.signIn.email({
            email: form.email,
            password: form.password,
            rememberMe: form.rememberMe,
            callbackURL: '/',
        })

        if (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message || error.statusText, life: 3000 })
        } else {
            navigateTo('/')
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred', life: 3000 })
    } finally {
        loading.value = false
    }
}

definePageMeta({
    layout: 'default',
})
</script>

<style lang="scss" scoped>
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--p-surface-50);
    padding: 1rem;
}

.login-card {
    width: 100%;
    max-width: 400px;

    &__header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    &__logo {
        height: 48px;
        width: auto;
    }

    &__title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__footer {
        text-align: center;
        font-size: 0.875rem;
        margin-top: 1rem;
    }

    &__register-link {
        color: var(--p-primary-color);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: #f43f5e; // Rose 500 (Accent)
            text-decoration: underline;
        }
    }
}

.login-form {
    &__github-btn {
        width: 100%;
    }

    &__divider {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    &__divider-text {
        font-size: 0.875rem;
        color: #6b7280;
    }

    &__fields {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__input {
        width: 100%;
    }

    &__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__remember {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    &__forgot {
        font-size: 0.875rem;
        color: var(--p-primary-color);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: #f43f5e; // Rose 500 (Accent)
            text-decoration: underline;
        }
    }

    &__submit-btn {
        width: 100%;
    }
}
</style>
