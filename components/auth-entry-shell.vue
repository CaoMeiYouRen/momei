<template>
    <div :class="['auth-entry', pageClass, 'public-form']">
        <CaomeiCard class="auth-entry__card">
            <template #title>
                <div class="auth-entry__header">
                    <img
                        src="/logo.png"
                        alt="Momei Logo"
                        class="auth-entry__logo"
                        width="56"
                        height="56"
                    >
                    <h1 class="auth-entry__title">
                        {{ $t(titleKey) }}
                    </h1>
                </div>
            </template>

            <div class="auth-entry__body">
                <div v-if="hasSocialLogin" class="auth-entry__social">
                    <CaomeiButton
                        v-if="socialProviders.github"
                        variant="secondary"
                        :label="$t('pages.login.github_login')"
                        class="github-btn social-btn"
                        @click="loginWith('github')"
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
                        @click="loginWith('google')"
                    >
                        <template #icon>
                            <i class="mdi mdi-google" aria-hidden="true" />
                        </template>
                        {{ $t('pages.login.google_login') }}
                    </CaomeiButton>
                </div>

                <CaomeiDivider v-if="hasSocialLogin" align="center">
                    {{ $t('pages.login.or_continue_with_email') }}
                </CaomeiDivider>

                <form
                    class="auth-entry__fields"
                    data-testid="auth-entry-form"
                    @submit.prevent="$emit('submit')"
                >
                    <slot />

                    <CaomeiButton
                        type="submit"
                        :label="$t(submitLabel)"
                        :loading="loading"
                        :class="['auth-entry__submit', submitClass]"
                    >
                        {{ $t(submitLabel) }}
                    </CaomeiButton>
                </form>
            </div>

            <template #footer>
                <slot name="footer" />
            </template>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { useAuthSocialLogin } from '@/composables/use-auth-social-login'

const props = defineProps<{
    pageClass: string
    titleKey: string
    submitLabel: string
    submitClass: string
    loading: boolean
    callbackUrl: string
}>()

defineEmits<{
    submit: []
}>()

const { socialProviders, hasSocialLogin, loginWith } = useAuthSocialLogin(() => props.callbackUrl)
</script>

<style lang="scss" scoped>
@use "@/styles/pages/auth-pages" as *;

.auth-entry {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 1rem;

    &__card {
        @extend %auth-card;
    }

    &__header {
        @extend %auth-card-header;
    }

    &__logo {
        @extend %auth-card-logo;
    }

    &__title {
        @extend %auth-card-title;
    }

    &__body {
        @extend %auth-form;
    }

    &__social {
        @extend %auth-form-social;
    }

    &__fields {
        @extend %auth-form-fields;
    }

    &__submit {
        @extend %auth-form-submit;
    }
}
</style>
