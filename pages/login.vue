<template>
    <AuthEntryShell
        page-class="login-page"
        title-key="pages.login.title"
        submit-label="pages.login.submit"
        form-class="login-form"
        submit-class="login-form__submit-btn"
        :loading="loading"
        :callback-url="redirectTarget"
        @submit="handleEmailLogin"
    >
        <div class="login-form__field">
            <label for="email">{{ $t("common.email") }}</label>
            <CaomeiInput
                id="email"
                v-model="form.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                enterkeyhint="next"
                :invalid="!!errors.email"
                class="login-form__input"
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

        <div class="login-form__field">
            <label for="password">{{
                $t("common.password")
            }}</label>
            <CaomeiPassword
                id="password"
                v-model="form.password"
                autocomplete="current-password"
                enterkeyhint="submit"
                :feedback="false"
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

        <div class="login-form__actions">
            <div class="login-form__remember">
                <CaomeiCheckbox
                    id="rememberMe"
                    v-model="form.rememberMe"
                />
                <label for="rememberMe">{{
                    $t("pages.login.remember_me")
                }}</label>
            </div>
            <NuxtLink
                :to="localePath('/forgot-password')"
                class="login-form__forgot"
            >
                {{ $t("pages.login.forgot_password") }}
            </NuxtLink>
        </div>

        <p class="login-form__legal-notice">
            <i18n-t keypath="legal.login_notice">
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
        </p>

        <app-captcha ref="captchaRef" v-model="captchaToken" />

        <template #footer>
            <div class="login-card__footer">
                <NuxtLink
                    :to="localePath('/register')"
                    class="login-card__register-link"
                >
                    {{ $t("pages.login.no_account") }}
                </NuxtLink>
            </div>
        </template>
    </AuthEntryShell>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { ensureLocaleMessageModules } from '@/i18n/config/locale-runtime-loader'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'
import { loginSchema } from '@/utils/schemas/auth'

const i18n = useI18n()
const { t, locale } = i18n
const route = useRoute()
const localePath = useLocalePath()
const runtimeConfig = useRuntimeConfig()

await ensureLocaleMessageModules({
    i18n,
    locale: locale.value,
    modules: ['auth'],
})

const normalizeRedirectTarget = (value: unknown) => {
    if (typeof value !== 'string') {
        return localePath('/')
    }

    if (!value.startsWith('/') || value.startsWith('//')) {
        return localePath('/')
    }

    return value
}

const redirectTarget = computed(() => {
    return normalizeRedirectTarget(route.query.redirect)
})

const shouldPrefillDemoAccount = computed(() => {
    return runtimeConfig.public.demoMode
        && redirectTarget.value.includes('/admin/posts/')
})

useHead({
    title: t('pages.login.title'),
    meta: [
        { name: 'description', content: t('pages.login.description') || t('pages.login.title') },
    ],
})

const toast = useToast()
/* 可用性由服务端在请求期判定（`plugins/social-providers.server.ts`），随 payload 传到客户端；
 * 不能用构建期固化的 public 配置（生产环境非 NUXT_ 变量不参与运行期注入）。
 * 与 `lib/auth.ts` 共用同一解析函数，保证「按钮可见 = 服务端已启用」。 */
const loading = ref(false)
const captchaToken = ref('')
const captchaRef = ref<any>(null)
const form = ref({
    email: '',
    password: '',
    rememberMe: false,
})
const errors = ref({
    email: '',
    password: '',
})

onMounted(() => {
    if (!shouldPrefillDemoAccount.value) {
        return
    }

    if (!form.value.email) {
        form.value.email = runtimeConfig.public.demoUserEmail || ''
    }

    if (!form.value.password) {
        form.value.password = runtimeConfig.public.demoPassword || ''
    }
})

const refreshAuthSessionSafely = async () => {
    try {
        await refreshAuthSession()
    } catch (refreshError) {
        console.warn('Failed to refresh auth session after login attempt', refreshError)
    }
}

const handleEmailLogin = async () => {
    errors.value.email = ''
    errors.value.password = ''

    const result = loginSchema.safeParse(form.value)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const key = issue.path[0] as keyof typeof errors.value
            if (key in errors.value) {
                errors.value[key] = t(issue.message)
            }
        })
        await nextTick()
        document.getElementById(errors.value.email ? 'email' : 'password')?.focus()
        return
    }

    loading.value = true
    try {
        invalidateAuthSessionState()

        const { error } = await authClient.signIn.email({
            email: form.value.email,
            password: form.value.password,
            rememberMe: form.value.rememberMe,
            callbackURL: redirectTarget.value,
            fetchOptions: {
                headers: {
                    'x-captcha-response': captchaToken.value,
                },
            },
        })

        if (error) {
            await refreshAuthSessionSafely()
            toast.show({
                tone: 'danger',
                title: t('common.error'),
                description: error.message || error.statusText,
                duration: 3000,
            })
            captchaRef.value?.reset()
        } else {
            navigateTo(redirectTarget.value)
        }
    } catch (e) {
        await refreshAuthSessionSafely()
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

.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 1rem;
}

.login-card {
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

    &__register-link {
        @extend %auth-card-link;
    }
}

.login-form {
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

    &__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__remember {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--m-font-size-sm);

        label {
            display: flex;
            align-items: center;
            line-height: 1.5;
        }
    }

    @media (hover: none), (pointer: coarse) {
        &__remember {
            min-height: 44px;

            label {
                min-width: 44px;
                min-height: 44px;
            }
        }
    }

    &__forgot {
        font-size: var(--m-font-size-sm);
        color: var(--caomei-color-primary);
        text-decoration: none;
        transition: color 0.2s;
        line-height: 1.5;

        &:hover {
            color: var(--m-primary-700);
            text-decoration: underline;
        }
    }

    /* caomei-ui 1.4.0：Button 为 fragment root，父级 scoped 选择器需 `:deep()`。 */
    :deep(.login-form__submit-btn) {
        width: 100%;
        margin-top: 0.5rem;
    }

    &__legal-notice {
        font-size: var(--m-font-size-xs);
        color: var(--caomei-color-text-muted);
        margin: 0;
        text-align: center;
        line-height: 1.4;

        .legal-link {
            color: var(--caomei-color-primary);
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}
</style>
