<template>
    <AuthEntryShell
        page-class="register-page"
        title-key="pages.register.title"
        submit-label="pages.register.submit"
        submit-class="register-form__submit-btn"
        :loading="loading"
        :callback-url="localePath('/')"
        @submit="handleRegister"
    >
        <div class="register-form__field">
            <label for="name">{{
                $t("common.nickname")
            }}</label>
            <CaomeiInput
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="nickname"
                enterkeyhint="next"
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
                $t("common.email")
            }}</label>
            <CaomeiInput
                id="email"
                v-model="form.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                enterkeyhint="next"
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
                $t("common.password")
            }}</label>
            <CaomeiPassword
                id="password"
                v-model="form.password"
                autocomplete="new-password"
                enterkeyhint="next"
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
                autocomplete="new-password"
                enterkeyhint="submit"
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
    </AuthEntryShell>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { z } from 'zod'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'
import { registerSchema } from '@/utils/schemas/auth'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const loading = ref(false)
const captchaToken = ref('')
const captchaRef = ref<any>(null)
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

        /* 聚焦首个错误字段：字段名与表单控件 id 一一对应，captcha/agreed 映射到可聚焦控件。 */
        const fieldIds: Record<string, string> = {
            name: 'name',
            email: 'email',
            password: 'password',
            confirmPassword: 'confirmPassword',
            agreed: 'agreed',
        }
        const firstErrorKey = Object.keys(errors.value).find((key) => errors.value[key as keyof typeof errors.value])
        await nextTick()
        if (firstErrorKey) {
            document.getElementById(fieldIds[firstErrorKey] ?? firstErrorKey)?.focus()
        }
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
    &__footer {
        @extend %auth-card-footer;
    }

    &__login-link {
        @extend %auth-card-link;
    }
}

.register-form {
    &__field {
        @extend %auth-form-field;
    }

    &__input {
        @extend %auth-form-input;
    }

    &__agreement {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;

        &-label {
            font-size: var(--m-font-size-sm);
            color: var(--caomei-color-text-muted);
            line-height: normal;
            cursor: pointer;
        }

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
