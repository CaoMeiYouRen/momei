<template>
    <div class="register-page">
        <Card class="register-card">
            <template #title>
                <div class="register-card__header">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        class="register-card__logo"
                    >
                    <h1 class="register-card__title">
                        {{ $t("pages.register.title") }}
                    </h1>
                </div>
            </template>
            <template #content>
                <div class="register-form">
                    <div
                        v-if="hasSocialLogin"
                        class="register-form__social"
                    >
                        <Button
                            v-if="socialProviders.github"
                            :label="$t('pages.login.github_login')"
                            icon="pi pi-github"
                            class="github-btn social-btn"
                            severity="secondary"
                            outlined
                            @click="handleGithubLogin"
                        />
                        <Button
                            v-if="socialProviders.google"
                            :label="$t('pages.login.google_login')"
                            icon="pi pi-google"
                            class="google-btn social-btn"
                            severity="secondary"
                            outlined
                            @click="handleGoogleLogin"
                        />
                    </div>

                    <Divider
                        v-if="hasSocialLogin"
                        align="center"
                    >
                        {{ $t("pages.login.or_continue_with_email") }}
                    </Divider>

                    <form
                        class="register-form__fields"
                        @submit.prevent="handleRegister"
                    >
                        <div class="register-form__field">
                            <label for="name">{{
                                $t("pages.register.name")
                            }}</label>
                            <InputText
                                id="name"
                                v-model="form.name"
                                type="text"
                                :invalid="!!errors.name"
                                class="register-form__input"
                            />
                            <Message
                                v-if="errors.name"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ errors.name }}
                            </Message>
                        </div>

                        <div class="register-form__field">
                            <label for="email">{{
                                $t("pages.register.email")
                            }}</label>
                            <InputText
                                id="email"
                                v-model="form.email"
                                type="email"
                                :invalid="!!errors.email"
                                class="register-form__input"
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

                        <div class="register-form__field">
                            <label for="password">{{
                                $t("pages.register.password")
                            }}</label>
                            <Password
                                id="password"
                                v-model="form.password"
                                :feedback="true"
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

                        <div class="register-form__field">
                            <label for="confirmPassword">{{
                                $t("pages.register.confirm_password")
                            }}</label>
                            <Password
                                id="confirmPassword"
                                v-model="form.confirmPassword"
                                :feedback="false"
                                toggle-mask
                                :invalid="!!errors.confirmPassword"
                                fluid
                            />
                            <Message
                                v-if="errors.confirmPassword"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ errors.confirmPassword }}
                            </Message>
                        </div>

                        <div class="register-form__agreement">
                            <Checkbox
                                v-model="form.agreed"
                                binary
                                input-id="agreed"
                                :invalid="!!errors.agreed"
                            />
                            <label
                                for="agreed"
                                class="register-form__agreement-label"
                            >
                                <i18n-t keypath="legal.agreement_checkbox">
                                    <template #agreement>
                                        <NuxtLink
                                            :to="localePath('/user-agreement')"
                                            target="_blank"
                                            class="legal-link"
                                        >
                                            {{ $t("legal.user_agreement") }}
                                        </NuxtLink>
                                    </template>
                                    <template #privacy>
                                        <NuxtLink
                                            :to="localePath('/privacy-policy')"
                                            target="_blank"
                                            class="legal-link"
                                        >
                                            {{ $t("legal.privacy_policy") }}
                                        </NuxtLink>
                                    </template>
                                </i18n-t>
                            </label>
                        </div>
                        <Message
                            v-if="errors.agreed"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ errors.agreed }}
                        </Message>

                        <app-captcha ref="captchaRef" v-model="captchaToken" />

                        <Button
                            type="submit"
                            :label="$t('pages.register.submit')"
                            :loading="loading"
                            class="register-form__submit-btn"
                        />
                    </form>
                </div>
            </template>
            <template #footer>
                <div class="register-card__footer">
                    <NuxtLink
                        :to="localePath('/login')"
                        class="register-card__login-link"
                    >
                        {{ $t("pages.register.have_account") }}
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
import { registerSchema } from '@/utils/schemas/auth'

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const { socialProviders } = useRuntimeConfig().public
const loading = ref(false)
const captchaToken = ref('')
const captchaRef = ref<any>(null)
const hasSocialLogin = computed(() => Object.values(socialProviders).some((v) => !!v))
const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
})
const errors = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: '',
})

const handleGithubLogin = async () => {
    await authClient.signIn.social({
        provider: 'github',
        callbackURL: localePath('/'),
    })
}

const handleGoogleLogin = async () => {
    await authClient.signIn.social({
        provider: 'google',
        callbackURL: localePath('/'),
    })
}

const handleRegister = async () => {
    // Reset errors
    Object.keys(errors).forEach(
        (key) => (errors[key as keyof typeof errors] = ''),
    )

    const result = registerSchema.safeParse(form)

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
        const { error } = await authClient.signUp.email({
            email: form.email,
            password: form.password,
            name: form.name,
            callbackURL: localePath('/'),
            fetchOptions: {
                headers: {
                    'x-captcha-response': captchaToken.value,
                },
            },
        })

        if (error) {
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: error.message || error.statusText,
                life: 3000,
            })
            captchaRef.value?.reset()
        } else {
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('common.save_success'),
                life: 3000,
            })
            navigateTo(localePath('/'))
        }
    } catch (e) {
        console.error(e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.unexpected_error'),
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

definePageMeta({
    layout: 'default',
})
</script>

<style lang="scss" scoped>
.register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 1rem;
}

.register-card {
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

    &__login-link {
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

.register-form {
    &__social {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
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

    &__submit-btn {
        width: 100%;
        margin-top: 1rem;
    }

    &__agreement {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 1.5rem;

        &-label {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
            line-height: normal;
            cursor: pointer;
        }

        .legal-link {
            color: var(--p-primary-color);
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}
</style>
