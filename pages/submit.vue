<template>
    <div class="submit-page">
        <useHead :title="$t('pages.submit.title')" />

        <div class="submit-container">
            <header class="submit-header">
                <h1 class="submit-header__title">
                    {{ $t('pages.submit.title') }}
                </h1>
                <p class="submit-header__subtitle">
                    {{ $t('pages.submit.subtitle') }}
                </p>
            </header>

            <Card class="submit-card">
                <template #content>
                    <form class="submit-form" @submit.prevent="handleSubmit">
                        <div class="submit-form__field">
                            <label for="title">{{ $t('pages.submit.form.title') }} *</label>
                            <InputText
                                id="title"
                                v-model="form.title"
                                :placeholder="$t('pages.submit.form.title_placeholder')"
                                fluid
                                required
                            />
                        </div>

                        <div class="submit-form__field">
                            <label for="content">{{ $t('pages.submit.form.content') }} *</label>
                            <Textarea
                                id="content"
                                v-model="form.content"
                                :placeholder="$t('pages.submit.form.content_placeholder')"
                                rows="12"
                                fluid
                                required
                            />
                            <small class="submit-form__help">支持 Markdown 语法</small>
                        </div>

                        <div class="submit-form__row">
                            <div class="submit-form__field">
                                <label for="name">{{ $t('pages.submit.form.name') }} *</label>
                                <InputText
                                    id="name"
                                    v-model="form.contributorName"
                                    :placeholder="$t('pages.submit.form.name_placeholder')"
                                    fluid
                                    required
                                />
                            </div>
                            <div class="submit-form__field">
                                <label for="email">{{ $t('pages.submit.form.email') }} *</label>
                                <InputText
                                    id="email"
                                    v-model="form.contributorEmail"
                                    type="email"
                                    :placeholder="$t('pages.submit.form.email_placeholder')"
                                    fluid
                                    required
                                />
                            </div>
                        </div>

                        <div class="submit-form__field">
                            <label for="url">{{ $t('pages.submit.form.url') }}</label>
                            <InputText
                                id="url"
                                v-model="form.contributorUrl"
                                :placeholder="$t('pages.submit.form.url_placeholder')"
                                fluid
                            />
                        </div>

                        <div class="submit-form__captcha">
                            <app-captcha ref="captchaRef" v-model="form.captchaToken" />
                        </div>

                        <div class="submit-form__actions">
                            <Button
                                type="submit"
                                :label="loading ? $t('pages.submit.form.submitting') : $t('pages.submit.form.submit')"
                                :loading="loading"
                                :disabled="!isFormValid"
                                class="submit-btn"
                            />
                        </div>
                    </form>
                </template>
            </Card>
        </div>
        <Toast />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()

const form = ref({
    title: '',
    content: '',
    contributorName: '',
    contributorEmail: '',
    contributorUrl: '',
    captchaToken: '',
})

const loading = ref(false)
const captchaRef = ref<any>(null)

const isFormValid = computed(() => {
    return (
        form.value.title.trim()
        && form.value.content.trim().length >= 10
        && form.value.contributorName.trim()
        && form.value.contributorEmail.trim()
        && form.value.captchaToken
    )
})

const handleSubmit = async () => {
    if (!isFormValid.value) return

    loading.value = true
    try {
        const response = await $fetch('/api/submissions', {
            method: 'POST',
            body: form.value,
        })

        if (response.code === 200) {
            toast.add({
                severity: 'success',
                summary: t('pages.submit.form.success'),
                life: 5000,
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
        toast.add({
            severity: 'error',
            summary: t('pages.submit.form.error'),
            detail: error.data?.message || error.message,
            life: 3000,
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
        background: linear-gradient(135deg, var(--p-primary-600), var(--p-primary-400));
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    &__subtitle {
        color: var(--p-text-muted-color);
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
        color: var(--p-text-muted-color);
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
