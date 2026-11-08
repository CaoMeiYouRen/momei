<template>
    <div class="register-page">
        <CaomeiCard class="register-card">
            <template #title>
                <div class="register-card__header">
                    <img
                        src="/logo.png"
                        alt="Momei Logo"
                        class="register-card__logo"
                        width="56"
                        height="56"
                    >
                    <h1 class="register-card__title">
                        {{ $t("pages.register.title") }}
                    </h1>
                </div>
            </template>
            <div class="register-form">
                <div
                    v-if="hasSocialLogin"
                    class="register-form__social"
                >
                    <CaomeiButton
                        v-if="socialProviders.github"
                        variant="secondary"
                        :label="$t('pages.login.github_login')"
                        class="github-btn social-btn"
                        @click="handleGithubLogin"
                    >
                        <template #icon>
                            <i class="mdi mdi-github" aria-hidden="true" />
                        </template>
                        {{ $t('pages.login.github_login') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="socialProviders.google"
                        variant="secondary"
                        :label="$t('pages.login.google_login')"
                        class="google-btn social-btn"
                        @click="handleGoogleLogin"
                    >
                        <template #icon>
                            <i class="mdi mdi-google" aria-hidden="true" />
                        </template>
                        {{ $t('pages.login.google_login') }}
                    </CaomeiButton>
                </div>

                <CaomeiDivider
                    v-if="hasSocialLogin"
                    align="center"
                >
                    {{ $t("pages.login.or_continue_with_email") }}
                </CaomeiDivider>

                <form
                    class="register-form__fields"
                    @submit.prevent="handleRegister"
                >
                    <div class="register-form__field">
                        <label for="name">{{
                            $t("pages.register.name")
                        }}</label>
                        <CaomeiInput
                            id="name"
                            v-model="form.name"
                            type="text"
                            :invalid="!!errors.name"
                            class="register-form__input"
                        />
                        <CaomeiMessage
                            v-if="errors.name"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.name }}
                        </CaomeiMessage>
                    </div>

                    <div class="register-form__field">
                        <label for="email">{{
                            $t("pages.register.email")
                        }}</label>
                        <CaomeiInput
                            id="email"
                            v-model="form.email"
                            type="email"
                            :invalid="!!errors.email"
                            class="register-form__input"
                        />
                        <CaomeiMessage
                            v-if="errors.email"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.email }}
                        </CaomeiMessage>
                    </div>

                    <div class="register-form__field">
                        <label for="password">{{
                            $t("pages.register.password")
                        }}</label>
                        <CaomeiPassword
                            id="password"
                            v-model="form.password"
                            :feedback="true"
                            :invalid="!!errors.password"
                        />
                        <CaomeiMessage
                            v-if="errors.password"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.password }}
                        </CaomeiMessage>
                    </div>

                    <div class="register-form__field">
                        <label for="confirmPassword">{{
                            $t("pages.register.confirm_password")
                        }}</label>
                        <CaomeiPassword
                            id="confirmPassword"
                            v-model="form.confirmPassword"
                            :feedback="false"
                            :invalid="!!errors.confirmPassword"
                        />
                        <CaomeiMessage
                            v-if="errors.confirmPassword"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.confirmPassword }}
                        </CaomeiMessage>
                    </div>

                    <div class="register-form__agreement">
                        <CaomeiCheckbox
                            id="agreed"
                            v-model="form.agreed"
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
                    <CaomeiMessage
                        v-if="errors.agreed"
                        tone="danger"
                        size="sm"
                        variant="simple"
                    >
                        {{ errors.agreed }}
                    </CaomeiMessage>

                    <app-captcha ref="captchaRef" v-model="captchaToken" />

                    <CaomeiButton
                        type="submit"
                        :label="$t('pages.register.submit')"
                        :loading="loading"
                        class="register-form__submit-btn"
                    >
                        {{ $t('pages.register.submit') }}
                    </CaomeiButton>
                </form>
            </div>
            <template #footer>
                <div class="register-card__footer">
                    <NuxtLink
                        :to="localePath('/login')"
                        class="register-card__login-link"
                        @click.prevent="handleLoginNavigation"
                    >
                        {{ $t("pages.register.have_account") }}
                    </NuxtLink>
                </div>
            </template>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { z } from 'zod'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'
import { registerSchema } from '@/utils/schemas/auth'
import { DEFAULT_SOCIAL_PROVIDER_AVAILABILITY, type SocialProviderAvailability } from '@/utils/shared/social-providers'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
/* 可用性由服务端在请求期判定（`plugins/social-providers.server.ts`），随 payload 传到客户端；
 * 不能用构建期固化的 public 配置。与 `lib/auth.ts` 共用同一解析函数（详见 pages/login.vue 的说明）。 */
const socialProviders = useState<SocialProviderAvailability>('auth-social-providers', () => ({ ...DEFAULT_SOCIAL_PROVIDER_AVAILABILITY }))
const loading = ref(false)
const captchaToken = ref('')
const captchaRef = ref<any>(null)
const hasSocialLogin = computed(() => socialProviders.value.github || socialProviders.value.google)
const form = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false,
})
const errors = ref({
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

const handleLoginNavigation = () => {
    return navigateTo(localePath('/login'))
}

const handleRegister = async () => {
    // Reset errors
    Object.keys(errors.value).forEach(
        (key) => (errors.value[key as keyof typeof errors.value] = ''),
    )

    const result = registerSchema.safeParse(form.value)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const key = issue.path[0] as keyof typeof errors.value
            if (key in errors.value) {
                errors.value[key] = t(issue.message)
            }
        })
        return
    }

    loading.value = true
    try {
        invalidateAuthSessionState()

        const { error } = await authClient.signUp.email({
            email: form.value.email,
            password: form.value.password,
            name: form.value.name,
            language: locale.value,
            callbackURL: localePath('/'),
            fetchOptions: {
                headers: {
                    'x-captcha-response': captchaToken.value,
                },
            },
        })

        if (error) {
            await refreshAuthSession()
            toast.show({
                tone: 'danger',
                title: t('common.error'),
                description: error.message || error.statusText,
                duration: 3000,
            })
            captchaRef.value?.reset()
        } else {
            toast.show({
                tone: 'success',
                title: t('common.success'),
                description: t('common.save_success'),
                duration: 3000,
            })
            navigateTo(localePath('/'))
        }
    } catch (e) {
        await refreshAuthSession()
        console.error(e)
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: t('common.unexpected_error'),
            duration: 3000,
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
@use "@/styles/pages/auth-pages" as *;

.register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 1rem;
}

.register-card {
    @extend %auth-card;

    &__header {
        @extend %auth-card-header;
    }

    &__logo {
        @extend %auth-card-logo;
    }

    &__title {
        @extend %auth-card-title;
    }

    &__footer {
        @extend %auth-card-footer;
    }

    &__login-link {
        @extend %auth-card-link;
    }
}

.register-form {
    @extend %auth-form;

    &__social {
        @extend %auth-form-social;
    }

    &__fields {
        @extend %auth-form-fields;
    }

    &__field {
        @extend %auth-form-field;
    }

    &__input {
        @extend %auth-form-input;
    }

    &__submit-btn {
        @extend %auth-form-submit;
    }

    &__agreement {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;

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
