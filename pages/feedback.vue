<template>
    <div class="feedback-page">
        <section class="feedback-page__hero">
            <p class="feedback-page__eyebrow">
                {{ $t('common.feedback') }}
            </p>
            <h1 class="feedback-page__title">
                {{ $t('pages.feedback.title') }}
            </h1>
            <p class="feedback-page__subtitle">
                {{ $t('pages.feedback.subtitle') }}
            </p>
        </section>

        <div class="feedback-page__grid">
            <article class="feedback-page__card">
                <div class="feedback-page__card-header">
                    <i class="pi pi-github" aria-hidden="true" />
                    <div>
                        <h2>{{ $t('pages.feedback.project.title') }}</h2>
                        <p>{{ $t('pages.feedback.project.description') }}</p>
                    </div>
                </div>

                <ul class="feedback-page__list">
                    <li>{{ $t('pages.feedback.project.items.bug') }}</li>
                    <li>{{ $t('pages.feedback.project.items.feature') }}</li>
                    <li>{{ $t('pages.feedback.project.items.docs') }}</li>
                </ul>

                <a
                    class="feedback-page__action"
                    :href="projectIssuesUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span>{{ $t('pages.feedback.project.action') }}</span>
                    <i class="pi pi-external-link" aria-hidden="true" />
                </a>
            </article>

            <article class="feedback-page__card">
                <div class="feedback-page__card-header">
                    <i class="pi pi-life-ring" aria-hidden="true" />
                    <div>
                        <h2>{{ $t('pages.feedback.deployment.title', {site: siteOperatorName}) }}</h2>
                        <p>{{ $t('pages.feedback.deployment.description', {site: siteOperatorName}) }}</p>
                    </div>
                </div>

                <ul class="feedback-page__list">
                    <li>{{ $t('pages.feedback.deployment.items.login') }}</li>
                    <li>{{ $t('pages.feedback.deployment.items.content') }}</li>
                    <li>{{ $t('pages.feedback.deployment.items.policy') }}</li>
                </ul>

                <a
                    v-if="deploymentSupportHref"
                    class="feedback-page__action"
                    :href="deploymentSupportHref"
                    :target="feedbackUrl ? '_blank' : undefined"
                    :rel="feedbackUrl ? 'noopener noreferrer' : undefined"
                >
                    <span>{{ deploymentActionLabel }}</span>
                    <i :class="feedbackUrl ? 'pi pi-external-link' : 'pi pi-envelope'" aria-hidden="true" />
                </a>

                <p v-else class="feedback-page__fallback">
                    {{ $t('pages.feedback.deployment.no_contact', {site: siteOperatorName}) }}
                </p>
            </article>
        </div>
    </div>
</template>

<script setup lang="ts">
const projectIssuesUrl = 'https://github.com/CaoMeiYouRen/momei/issues/new/choose'

const { t } = useI18n()
const {
    siteConfig,
    fetchSiteConfig,
    currentTitle,
} = useMomeiConfig()

const siteOperatorName = computed(() => siteConfig.value.siteOperator || currentTitle.value)
const feedbackUrl = computed(() => siteConfig.value.feedbackUrl?.trim() || '')
const contactEmail = computed(() => siteConfig.value.contactEmail?.trim() || '')
const deploymentSupportHref = computed(() => feedbackUrl.value || (contactEmail.value ? `mailto:${contactEmail.value}` : ''))
const deploymentActionLabel = computed(() => {
    if (feedbackUrl.value) {
        return t('pages.feedback.deployment.action_link')
    }

    return t('pages.feedback.deployment.action_email', { email: contactEmail.value })
})

if (import.meta.server) {
    await fetchSiteConfig()
} else {
    onMounted(() => {
        void fetchSiteConfig()
    })
}

useHead({
    title: () => t('pages.feedback.title'),
    meta: [
        {
            name: 'description',
            content: () => t('pages.feedback.meta.description'),
        },
    ],
})
</script>

<style scoped lang="scss">
.feedback-page {
    max-width: 1080px;
    margin: 0 auto;
    padding: 2rem 1rem 3rem;
    display: grid;
    gap: 1.5rem;

    &__hero {
        display: grid;
        gap: 0.5rem;
    }

    &__eyebrow {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--p-primary-color);
    }

    &__title {
        margin: 0;
        font-size: clamp(2rem, 3vw, 2.75rem);
        line-height: 1.1;
    }

    &__subtitle {
        margin: 0;
        max-width: 50rem;
        color: var(--p-text-muted-color);
        line-height: 1.7;
        font-size: 1rem;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    &__card {
        display: grid;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1.25rem;
        background: linear-gradient(180deg, color-mix(in srgb, var(--p-surface-0) 80%, var(--p-primary-50) 20%), var(--p-surface-0));
        box-shadow: 0 14px 30px rgb(15 23 42 / 0.05);
    }

    &__card-header {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.85rem;

        i {
            width: 2.4rem;
            height: 2.4rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: color-mix(in srgb, var(--p-primary-color) 12%, white 88%);
            color: var(--p-primary-color);
        }

        h2 {
            margin: 0;
            font-size: 1.1rem;
        }

        p {
            margin: 0.35rem 0 0;
            color: var(--p-text-muted-color);
            line-height: 1.6;
        }
    }

    &__list {
        margin: 0;
        padding-left: 1.2rem;
        display: grid;
        gap: 0.45rem;
        color: var(--p-text-color);
    }

    &__action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.85rem 1rem;
        border-radius: 999px;
        background: var(--p-primary-color);
        color: var(--p-primary-contrast-color);
        text-decoration: none;
        font-weight: 600;
    }

    &__fallback {
        margin: 0;
        padding: 0.85rem 1rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-yellow-50) 70%, var(--p-surface-0) 30%);
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }
}

@media (width <= 768px) {
    .feedback-page {
        &__grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
