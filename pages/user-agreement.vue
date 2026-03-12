<template>
    <div class="legal-page">
        <div class="legal-page__container">
            <h1 class="legal-page__title">
                {{ $t('pages.user_agreement.title') }}
            </h1>
            <div class="legal-page__meta-grid">
                <p class="legal-page__meta">
                    {{ $t('pages.user_agreement.version_label', {version: agreement.version || $t('pages.user_agreement.version_fallback')}) }}
                </p>
                <p class="legal-page__meta">
                    {{ $t('pages.user_agreement.effective_date_label', {date: formatDate(agreement.effectiveAt)}) }}
                </p>
                <p class="legal-page__meta">
                    {{ $t('pages.user_agreement.last_updated_label', {date: formatDate(agreement.updatedAt)}) }}
                </p>
            </div>

            <div class="legal-page__tags">
                <Tag
                    :value="agreement.isReferenceTranslation
                        ? $t('pages.user_agreement.reference_translation_tag')
                        : $t('pages.user_agreement.authoritative_version_tag')"
                    :severity="agreement.isReferenceTranslation ? 'info' : 'success'"
                />
                <Tag
                    v-if="!agreement.isDefault && agreement.history[0]?.isCurrentActive"
                    :value="$t('pages.user_agreement.current_active_tag')"
                    severity="secondary"
                />
            </div>

            <div v-if="agreement.isDefault" class="default-notice">
                <p class="default-notice__text">
                    ⚠️ {{ $t('legal.notice') }}
                </p>
            </div>

            <div v-else-if="agreement.isReferenceTranslation" class="legal-page__notice legal-page__notice--reference">
                {{ $t('pages.user_agreement.reference_translation_notice', {
                    language: agreement.authoritativeLanguage,
                    version: agreement.authoritativeVersion || $t('pages.user_agreement.version_fallback')
                }) }}
            </div>

            <div v-else-if="agreement.fallbackToAuthoritative" class="legal-page__notice legal-page__notice--reference">
                {{ $t('pages.user_agreement.fallback_notice', {language: agreement.authoritativeLanguage}) }}
            </div>

            <Divider />

            <ArticleContent v-if="agreement.content" :content="agreement.content" />

            <section v-if="agreement.history.length" class="legal-page__history">
                <h2 class="legal-page__history-title">
                    {{ $t('pages.user_agreement.history_title') }}
                </h2>
                <ul class="legal-page__history-list">
                    <li
                        v-for="item in agreement.history"
                        :key="item.id"
                        class="legal-page__history-item"
                    >
                        <strong>{{ item.version || $t('pages.user_agreement.version_fallback') }}</strong>
                        <span>{{ formatDate(item.effectiveAt) }}</span>
                        <span>{{ item.versionDescription || $t('pages.user_agreement.history_no_description') }}</span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ArticleContent from '@/components/article-content.vue'
import type { ApiResponse } from '@/types/api'
import type { AgreementPublicPayload } from '@/types/agreement'

const { t, locale } = useI18n()

usePageSeo({
    type: 'website',
    title: () => t('pages.user_agreement.title'),
    description: () => t('pages.user_agreement.meta.description'),
})

const fallbackAgreement = computed<AgreementPublicPayload>(() => ({
    id: 'default',
    type: 'user_agreement',
    language: locale.value,
    content: getDefaultContent(),
    version: null,
    versionDescription: null,
    effectiveAt: null,
    updatedAt: null,
    authoritativeLanguage: 'zh-CN',
    authoritativeVersion: null,
    isDefault: true,
    isReferenceTranslation: false,
    fallbackToAuthoritative: false,
    sourceAgreementId: null,
    sourceAgreementVersion: null,
    history: [],
}))

const { data } = await useAsyncData(
    () => `user-agreement:${locale.value}`,
    () => $fetch<ApiResponse<AgreementPublicPayload>>('/api/agreements/user-agreement', {
        query: {
            language: locale.value,
        },
    }),
    {
        watch: [locale],
    },
)

const agreement = computed(() => data.value?.data || fallbackAgreement.value)

function formatDate(value?: string | null) {
    if (!value) {
        return t('pages.user_agreement.date_fallback')
    }

    return new Intl.DateTimeFormat(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value))
}

function getDefaultContent(): string {
    return `## 1. 特别提示
本协议是您与本网站之间关于您访问和使用本站所订立的法律协议。`
}
</script>

<style lang="scss" scoped>
.legal-page {
    padding: 2rem 1rem;
    min-height: 100vh;
    background-color: var(--p-surface-0);

    &__container {
        max-width: 800px;
        margin: 0 auto;
    }

    &__title {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--p-text-color);
    }

    &__meta-grid {
        display: grid;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    &__meta {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        margin: 0;
    }

    &__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    &__notice {
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 0.5rem;
        border: 1px solid var(--p-content-border-color);
        background: color-mix(in srgb, var(--p-surface-100) 85%, transparent);
        color: var(--p-text-color);
    }

    &__history {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-content-border-color);
    }

    &__history-title {
        margin-bottom: 1rem;
        font-size: 1.125rem;
    }

    &__history-list {
        display: grid;
        gap: 0.75rem;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    &__history-item {
        display: grid;
        gap: 0.25rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        background: color-mix(in srgb, var(--p-surface-100) 90%, transparent);
        color: var(--p-text-muted-color);
    }

    &__content {
        line-height: 1.75;
        color: var(--p-text-color);

        section {
            margin-bottom: 2rem;
        }

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--p-content-border-color);
        }

        p {
            margin-bottom: 1rem;
        }

        ul {
            padding-left: 1.5rem;
            margin-bottom: 1rem;
        }

        .notice {
            background-color: var(--p-surface-100);
            padding: 1rem;
            border-left: 4px solid var(--p-primary-color);
            border-radius: 4px;
            font-style: italic;
        }
    }
}

.default-notice {
    background-color: var(--p-surface-100);
    border-left: 4px solid var(--p-warn-color);
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;

    &__text {
        color: var(--p-warn-600);
        font-weight: 600;
        margin: 0;
    }
}

:global(.dark) .legal-page {
    background-color: var(--p-surface-950);
}

:global(.dark) .default-notice {
    background-color: var(--p-surface-800);
}

@media (width <= 768px) {
    .legal-page {
        &__title {
            font-size: 1.75rem;
        }
    }
}
</style>
