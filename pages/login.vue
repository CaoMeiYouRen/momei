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
                    <div class="login-form__social">
                        <Button
                            :label="$t('pages.login.github_login')"
                            icon="pi pi-github"
                            class="login-form__social-btn"
                            severity="secondary"
                            outlined
                            @click="handleGithubLogin"
                        />
                        <Button
                            :label="$t('pages.login.google_login')"
                            icon="pi pi-google"
                            class="login-form__social-btn"
                            severity="secondary"
                            outlined
                            @click="handleGoogleLogin"
                        />
                    </div>

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
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'
import { loginSchema } from '@/utils/schemas/auth'

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

const handleGoogleLogin = async () => {
    await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
    })
}

const handleEmailLogin = async () => {
    errors.email = ''
    errors.password = ''

    const result = loginSchema.safeParse(form)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const key = issue.path[0] as keyof typeof errors
            if (key in errors) {
                errors[key] = t(issue.message)
            }
        })
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
    flex: 1;
    padding: 1rem;
}

.login-card {
    width: 100%;
    max-width: 400px;
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    color: var(--p-text-color);

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
        line-height: 1.5;
    }

    &__footer {
        text-align: center;
        font-size: 0.875rem;
        margin-top: 1rem;
        line-height: 1.5;
    }

    &__register-link {
        color: var(--p-primary-color);
        text-decoration: none;
        transition: color 0.2s;
        line-height: 1.5;

        &:hover {
            color: var(--p-primary-700);
            text-decoration: underline;
        }
    }
}

.login-form {
    &__social {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__social-btn {
        width: 100%;
    }

    &__divider {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    &__divider-text {
        font-size: 0.875rem;
        color: var(--p-primary-700);
        line-height: 1.5;
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

        label {
            line-height: 1.5;
        }
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

        label {
            line-height: 1.5;
        }
    }

    &__forgot {
        font-size: 0.875rem;
        color: var(--p-primary-color);
        text-decoration: none;
        transition: color 0.2s;
        line-height: 1.5;

        &:hover {
            color: var(--p-primary-700);
            text-decoration: underline;
        }
    }

    &__submit-btn {
        width: 100%;
    }
}
</style>
