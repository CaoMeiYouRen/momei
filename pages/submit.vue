<template>
    <div class="submit-page">
        <div class="submit-container">
            <header class="submit-header">
                <h1 class="submit-header__title">
                    {{ $t('pages.submit.title') }}
                </h1>
                <p class="submit-header__subtitle">
                    {{ $t('pages.submit.subtitle') }}
                </p>
            </header>

            <CaomeiCard class="submit-card">
                <form class="submit-form" @submit.prevent="handleSubmit">
                    <div class="submit-form__field">
                        <label for="title">{{ $t('pages.submit.form.title') }} *</label>
                        <CaomeiInput
                            id="title"
                            v-model="form.title"
                            :placeholder="$t('pages.submit.form.title_placeholder')"
                            :invalid="!!errors.title"
                        />
                        <CaomeiMessage
                            v-if="errors.title"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.title }}
                        </CaomeiMessage>
                    </div>

                    <div class="submit-form__field">
                        <label for="content">{{ $t('pages.submit.form.content') }} *</label>
                        <CaomeiTextarea
                            id="content"
                            v-model="form.content"
                            :placeholder="$t('pages.submit.form.content_placeholder')"
                            :invalid="!!errors.content"
                            :rows="12"
                        />
                        <div class="submit-form__field-footer">
                            <small class="submit-form__help">{{ $t('pages.submit.form.markdown_help') }}</small>
                            <CaomeiMessage
                                v-if="errors.content"
                                tone="danger"
                                size="sm"
                                variant="simple"
                            >
                                {{ errors.content }}
                            </CaomeiMessage>
                        </div>
                    </div>

                    <div class="submit-form__row">
                        <div class="submit-form__field">
                            <label for="name">{{ $t('pages.submit.form.name') }} *</label>
                            <CaomeiInput
                                id="name"
                                v-model="form.contributorName"
                                :placeholder="$t('pages.submit.form.name_placeholder')"
                                :invalid="!!errors.contributorName"
                            />
                            <CaomeiMessage
                                v-if="errors.contributorName"
                                tone="danger"
                                size="sm"
                                variant="simple"
                            >
                                {{ errors.contributorName }}
                            </CaomeiMessage>
                        </div>
                        <div class="submit-form__field">
                            <label for="email">{{ $t('pages.submit.form.email') }} *</label>
                            <CaomeiInput
                                id="email"
                                v-model="form.contributorEmail"
                                type="email"
                                :placeholder="$t('pages.submit.form.email_placeholder')"
                                :invalid="!!errors.contributorEmail"
                            />
                            <CaomeiMessage
                                v-if="errors.contributorEmail"
                                tone="danger"
                                size="sm"
                                variant="simple"
                            >
                                {{ errors.contributorEmail }}
                            </CaomeiMessage>
                        </div>
                    </div>

                    <div class="submit-form__field">
                        <label for="url">{{ $t('pages.submit.form.url') }}</label>
                        <CaomeiInput
                            id="url"
                            v-model="form.contributorUrl"
                            :placeholder="$t('pages.submit.form.url_placeholder')"
                            :invalid="!!errors.contributorUrl"
                        />
                        <CaomeiMessage
                            v-if="errors.contributorUrl"
                            tone="danger"
                            size="sm"
                            variant="simple"
                        >
                            {{ errors.contributorUrl }}
                        </CaomeiMessage>
                    </div>

                    <div v-if="isCaptchaEnabled" class="submit-form__captcha">
                        <div class="align-items-center flex flex-column gap-2">
                            <app-captcha ref="captchaRef" v-model="form.captchaToken" />
                            <CaomeiMessage
                                v-if="errors.captchaToken"
                                tone="danger"
                                size="sm"
                                variant="simple"
                            >
                                {{ errors.captchaToken }}
                            </CaomeiMessage>
                        </div>
                    </div>

                    <div class="submit-form__actions">
                        <CaomeiButton
                            type="submit"
                            :label="loading ? $t('pages.submit.form.submitting') : $t('pages.submit.form.submit')"
                            :loading="loading"
                            class="submit-btn"
                        >
                            {{ loading ? $t('pages.submit.form.submitting') : $t('pages.submit.form.submit') }}
                        </CaomeiButton>
                    </div>
                </form>
            </CaomeiCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { submissionSchema } from '@/utils/schemas/submission'

const { t } = useI18n()
const toast = useToast()
const config = useRuntimeConfig()

usePageSeo({
    type: 'website',
    title: () => t('pages.submit.title'),
    description: () => t('pages.submit.meta.description'),
})

const isCaptchaEnabled = computed(() => !!(config.public.authCaptcha?.provider && config.public.authCaptcha?.siteKey))

const form = ref({
    title: '',
    content: '',
    contributorName: '',
    contributorEmail: '',
    contributorUrl: '',
    captchaToken: '',
})

const errors = ref({
    title: '',
    content: '',
    contributorName: '',
    contributorEmail: '',
    contributorUrl: '',
    captchaToken: '',
})

const loading = ref(false)
const captchaRef = ref<any>(null)

const handleSubmit = async () => {
    // Clear previous errors
    Object.keys(errors.value).forEach((key) => (errors.value[key as keyof typeof errors.value] = ''))

    const result = submissionSchema.safeParse(form.value)
    if (!result.success) {
        result.error.issues.forEach((issue) => {
            const key = issue.path[0] as keyof typeof errors.value
            if (key in errors.value) {
                errors.value[key] = issue.message
            }
        })
        return
    }

    // 验证验证码（如果启用）
    if (isCaptchaEnabled.value && !form.value.captchaToken) {
        errors.value.captchaToken = t('pages.submit.form.captcha_required')
        return
    }

    loading.value = true
    try {
        const response = await $fetch('/api/posts/submissions', {
            method: 'POST',
            body: form.value,
        })

        if (response.code === 200) {
            toast.show({
                tone: 'success',
                title: t('pages.submit.form.success'),
                duration: 5000,
            })
            // 重置表单
            form.value = {
                title: '',
                content: '',
                contributorName: '',
                contributorEmail: '',
                contributorUrl: '',
                captchaToken: '',
            }
            captchaRef.value?.reset()
        }
    } catch (error: any) {
        captchaRef.value?.reset()
        toast.show({
            tone: 'danger',
            title: t('pages.submit.form.error'),
            description: error.data?.message || error.message,
            duration: 3000,
        })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.submit-page {
    padding: 2rem 1rem;
    min-height: calc(100vh - 200px);
}

.submit-container {
    max-width: 800px;
    margin: 0 auto;
}

.submit-header {
    text-align: center;
    margin-bottom: 2rem;

    &__title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, var(--m-primary-600), var(--m-primary-400));
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    &__subtitle {
        color: var(--caomei-color-text-muted);
        font-size: 1.1rem;
    }
}

.submit-card {
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgb(0 0 0 / 0.05);
}

.submit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
            font-weight: 600;
            font-size: 0.95rem;
        }
    }

    &__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;

        @media (width <= 640px) {
            grid-template-columns: 1fr;
        }
    }

    &__help {
        color: var(--caomei-color-text-muted);
        font-size: 0.85rem;
    }

    &__captcha {
        margin: 1rem 0;
        display: flex;
        justify-content: center;
    }

    &__actions {
        display: flex;
        justify-content: center;
    }
}

.submit-btn {
    padding: 0.75rem 3rem;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 2rem;
}
</style>
