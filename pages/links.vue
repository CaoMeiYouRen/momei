<template>
    <div class="links-page">
        <div class="links-page__container">
            <header class="links-page__hero">
                <p class="links-page__eyebrow">
                    {{ tt('common.friend_links') }}
                </p>
                <h1 class="links-page__title">
                    {{ tt('pages.links.title') }}
                </h1>
                <p class="links-page__subtitle">
                    {{ tt('pages.links.subtitle') }}
                </p>
            </header>

            <Card v-if="meta.applicationGuidelines" class="links-page__notice">
                <template #content>
                    <h2 class="links-page__section-title">
                        {{ tt('pages.links.guidelines_title') }}
                    </h2>
                    <p class="links-page__guidelines">
                        {{ meta.applicationGuidelines }}
                    </p>
                </template>
            </Card>

            <Card v-if="!meta.enabled" class="links-page__empty-card">
                <template #content>
                    <div class="links-page__empty">
                        {{ tt('pages.links.disabled') }}
                    </div>
                </template>
            </Card>

            <template v-else>
                <section v-if="groups.length > 0" class="links-page__groups">
                    <article
                        v-for="group in groups"
                        :key="group.category?.id || 'uncategorized'"
                        class="links-page__group"
                    >
                        <div class="links-page__group-header">
                            <h2 class="links-page__group-title">
                                {{ group.category?.name || tt('pages.links.uncategorized') }}
                            </h2>
                            <p v-if="group.category?.description" class="links-page__group-description">
                                {{ group.category.description }}
                            </p>
                        </div>

                        <div class="links-page__grid">
                            <article
                                v-for="item in group.items"
                                :key="item.id"
                                class="links-page__card"
                            >
                                <div class="links-page__card-top">
                                    <img
                                        v-if="item.logo"
                                        :src="item.logo"
                                        :alt="item.name"
                                        class="links-page__logo"
                                        loading="lazy"
                                    >
                                    <div v-else class="links-page__logo links-page__logo--fallback">
                                        {{ item.name?.slice(0, 1) }}
                                    </div>

                                    <div class="links-page__card-meta">
                                        <h3 class="links-page__card-title">
                                            {{ item.name }}
                                        </h3>
                                        <p class="links-page__card-url">
                                            {{ item.url }}
                                        </p>
                                    </div>
                                </div>

                                <p class="links-page__card-description">
                                    {{ item.description || $t('common.no_description') }}
                                </p>

                                <div class="links-page__card-actions">
                                    <a
                                        :href="item.url"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="links-page__card-link"
                                    >
                                        {{ tt('common.visit_site') }}
                                    </a>
                                </div>
                            </article>
                        </div>
                    </article>
                </section>

                <Card v-else class="links-page__empty-card">
                    <template #content>
                        <div class="links-page__empty">
                            {{ tt('pages.links.empty') }}
                        </div>
                    </template>
                </Card>

                <Card v-if="meta.applicationEnabled" class="links-page__apply-card">
                    <template #content>
                        <div class="links-page__apply-header">
                            <h2 class="links-page__section-title">
                                {{ tt('pages.links.application_title') }}
                            </h2>
                            <p class="links-page__apply-subtitle">
                                {{ tt('pages.links.application_subtitle') }}
                            </p>
                        </div>

                        <form class="links-page__form" @submit.prevent="handleSubmit">
                            <div class="links-page__form-grid">
                                <div class="links-page__field">
                                    <label for="name">{{ $t('common.name') }} *</label>
                                    <InputText
                                        id="name"
                                        v-model="form.name"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="url">{{ tt('pages.links.form.url') }} *</label>
                                    <InputText
                                        id="url"
                                        v-model="form.url"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="logo">{{ tt('pages.links.form.logo') }}</label>
                                    <InputText
                                        id="logo"
                                        v-model="form.logo"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="rssUrl">{{ tt('pages.links.form.rss_url') }}</label>
                                    <InputText
                                        id="rssUrl"
                                        v-model="form.rssUrl"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="contactName">{{ tt('pages.links.form.contact_name') }}</label>
                                    <InputText
                                        id="contactName"
                                        v-model="form.contactName"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="contactEmail">{{ tt('pages.links.form.contact_email') }} *</label>
                                    <InputText
                                        id="contactEmail"
                                        v-model="form.contactEmail"
                                        type="email"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="categoryId">{{ $t('common.category') }}</label>
                                    <Select
                                        id="categoryId"
                                        v-model="form.categoryId"
                                        :options="meta.categories"
                                        option-label="name"
                                        option-value="id"
                                        :placeholder="tt('pages.links.form.category_placeholder')"
                                        fluid
                                    />
                                </div>
                                <div class="links-page__field">
                                    <label for="categorySuggestion">{{ tt('pages.links.form.category_suggestion') }}</label>
                                    <InputText
                                        id="categorySuggestion"
                                        v-model="form.categorySuggestion"
                                        fluid
                                    />
                                </div>
                            </div>

                            <div class="links-page__field">
                                <label for="reciprocalUrl">{{ tt('pages.links.form.reciprocal_url') }}</label>
                                <InputText
                                    id="reciprocalUrl"
                                    v-model="form.reciprocalUrl"
                                    fluid
                                />
                            </div>

                            <div class="links-page__field">
                                <label for="description">{{ $t('common.description') }}</label>
                                <Textarea
                                    id="description"
                                    v-model="form.description"
                                    rows="4"
                                    fluid
                                />
                            </div>

                            <div class="links-page__field">
                                <label for="message">{{ tt('pages.links.form.message') }}</label>
                                <Textarea
                                    id="message"
                                    v-model="form.message"
                                    rows="4"
                                    fluid
                                />
                            </div>

                            <div v-if="isCaptchaEnabled" class="links-page__captcha">
                                <app-captcha ref="captchaRef" v-model="form.captchaToken" />
                            </div>

                            <div class="links-page__actions">
                                <Button
                                    type="submit"
                                    :label="submitting ? tt('pages.links.form.submitting') : tt('pages.links.form.submit')"
                                    :loading="submitting"
                                />
                            </div>
                        </form>
                    </template>
                </Card>
            </template>
        </div>

        <Toast />
    </div>
</template>

<script setup lang="ts">
import { friendLinkApplicationSchema } from '@/utils/schemas/friend-link'

const { t } = useI18n()
const toast = useToast()
const config = useRuntimeConfig()
const tt = (key: string) => t(key as never)

usePageSeo({
    type: 'website',
    title: () => tt('pages.links.title'),
    description: () => tt('pages.links.meta.description'),
})

const isCaptchaEnabled = computed(() => !!(config.public.authCaptcha?.provider && config.public.authCaptcha?.siteKey))

const { data: metaData, refresh: refreshMeta } = await useAsyncData('friend-links-meta', async () => {
    try {
        const response = await $fetch<any>('/api/friend-links/meta')
        return response.data
    } catch {
        return {
            enabled: false,
            applicationEnabled: false,
            applicationGuidelines: '',
            categories: [],
        }
    }
})

const { data: linksData, refresh: refreshLinks } = await useAsyncData('friend-links-page', async () => {
    try {
        const response = await $fetch<any>('/api/friend-links')
        return response.data
    } catch {
        return {
            items: [],
            groups: [],
        }
    }
})

const meta = computed(() => metaData.value || {
    enabled: false,
    applicationEnabled: false,
    applicationGuidelines: '',
    categories: [],
})
const groups = computed(() => linksData.value?.groups || [])

const form = ref({
    name: '',
    url: '',
    logo: '',
    description: '',
    categoryId: '',
    categorySuggestion: '',
    contactName: '',
    contactEmail: '',
    rssUrl: '',
    reciprocalUrl: '',
    message: '',
    captchaToken: '',
})
const submitting = ref(false)
const captchaRef = ref<any>(null)

const resetForm = () => {
    form.value = {
        name: '',
        url: '',
        logo: '',
        description: '',
        categoryId: '',
        categorySuggestion: '',
        contactName: '',
        contactEmail: '',
        rssUrl: '',
        reciprocalUrl: '',
        message: '',
        captchaToken: '',
    }
}

const handleSubmit = async () => {
    const result = friendLinkApplicationSchema.safeParse(form.value)

    if (!result.success) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: result.error.issues[0]?.message || tt('pages.links.form.error'),
            life: 3000,
        })
        return
    }

    if (isCaptchaEnabled.value && !form.value.captchaToken) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: tt('pages.links.form.captcha_required'),
            life: 3000,
        })
        return
    }

    submitting.value = true
    const payload = {
        ...form.value,
        categoryId: form.value.categoryId || undefined,
    }

    try {
        await $fetch('/api/friend-links/applications', {
            method: 'POST',
            body: payload,
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: tt('pages.links.form.success'),
            life: 4000,
        })

        resetForm()
        captchaRef.value?.reset()
        await Promise.all([refreshMeta(), refreshLinks()])
    } catch (error: any) {
        captchaRef.value?.reset()
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.data?.message || error.message || tt('pages.links.form.error'),
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped lang="scss">
.links-page {
    padding: 2rem 1rem 3rem;

    &__container {
        max-width: 1120px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__hero {
        padding: 2rem;
        border-radius: 1.5rem;
        background:
            radial-gradient(circle at top left, rgb(244 63 94 / 0.14), transparent 32%),
            linear-gradient(135deg, rgb(15 23 42 / 0.98), rgb(51 65 85 / 0.96));
        color: #fff;
    }

    &__eyebrow {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 0.72;
    }

    &__title {
        margin: 0;
        font-size: clamp(2rem, 5vw, 3.25rem);
        line-height: 1.1;
    }

    &__subtitle {
        margin: 0.75rem 0 0;
        max-width: 42rem;
        color: rgb(255 255 255 / 0.82);
        line-height: 1.7;
    }

    &__section-title {
        margin: 0 0 0.75rem;
        font-size: 1.2rem;
    }

    &__guidelines {
        margin: 0;
        color: var(--p-text-muted-color);
        line-height: 1.8;
        white-space: pre-line;
    }

    &__group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__group-header {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    &__group-title {
        margin: 0;
        font-size: 1.35rem;
    }

    &__group-description {
        margin: 0;
        color: var(--p-text-muted-color);
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;

        @media (width <= 960px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (width <= 640px) {
            grid-template-columns: 1fr;
        }
    }

    &__card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
        min-height: 100%;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: var(--p-content-background);
        box-shadow: 0 18px 38px rgb(15 23 42 / 0.04);
    }

    &__card-top {
        display: flex;
        gap: 0.9rem;
        align-items: center;
    }

    &__logo {
        flex-shrink: 0;
        width: 3.25rem;
        height: 3.25rem;
        border-radius: 0.9rem;
        object-fit: cover;
        background: var(--p-surface-100);
        border: 1px solid var(--p-content-border-color);

        &--fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            font-weight: 700;
            color: var(--p-primary-color);
        }
    }

    &__card-meta {
        min-width: 0;
    }

    &__card-title {
        margin: 0;
        font-size: 1.1rem;
    }

    &__card-url {
        margin: 0.3rem 0 0;
        color: var(--p-text-muted-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__card-description {
        margin: 0;
        color: var(--p-text-color);
        line-height: 1.7;
    }

    &__card-actions {
        margin-top: auto;
    }

    &__card-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
        padding: 0 1rem;
        border-radius: 999px;
        background: var(--p-primary-color);
        color: var(--p-primary-contrast-color);
        text-decoration: none;
        font-weight: 600;
    }

    &__apply-header {
        margin-bottom: 1rem;
    }

    &__apply-subtitle {
        margin: 0;
        color: var(--p-text-muted-color);
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;

        @media (width <= 700px) {
            grid-template-columns: 1fr;
        }
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__captcha {
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
    }

    &__empty-card {
        text-align: center;
    }

    &__empty {
        color: var(--p-text-muted-color);
        line-height: 1.8;
    }
}
</style>
