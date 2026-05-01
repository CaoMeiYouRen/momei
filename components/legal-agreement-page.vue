<template>
    <div class="legal-page">
        <div class="legal-page__container">
            <h1 class="legal-page__title">
                {{ copy.title }}
            </h1>
            <div class="legal-page__meta-grid">
                <p class="legal-page__meta">
                    {{ copy.formatVersionLabel(agreement.version || copy.versionFallback) }}
                </p>
                <p class="legal-page__meta">
                    {{ copy.formatEffectiveDateLabel(formatDate(agreement.effectiveAt)) }}
                </p>
                <p class="legal-page__meta">
                    {{ copy.formatLastUpdatedLabel(formatDate(agreement.updatedAt)) }}
                </p>
            </div>

            <div class="legal-page__tags">
                <Tag
                    :value="agreement.isReferenceTranslation
                        ? copy.referenceTranslationTag
                        : copy.authoritativeVersionTag"
                    :severity="agreement.isReferenceTranslation ? 'info' : 'success'"
                />
                <Tag
                    v-if="!agreement.isDefault && agreement.history[0]?.isCurrentActive"
                    :value="copy.currentActiveTag"
                    severity="secondary"
                />
            </div>

            <div v-if="agreement.isDefault" class="default-notice">
                <p class="default-notice__text">
                    ⚠️ {{ copy.legalNotice }}
                </p>
            </div>

            <div v-else-if="agreement.isReferenceTranslation" class="legal-page__notice legal-page__notice--reference">
                {{ copy.formatReferenceTranslationNotice(
                    agreement.authoritativeLanguage,
                    agreement.authoritativeVersion || copy.versionFallback
                ) }}
            </div>

            <div v-else-if="agreement.fallbackToAuthoritative" class="legal-page__notice legal-page__notice--reference">
                {{ copy.formatFallbackNotice(agreement.authoritativeLanguage) }}
            </div>

            <Divider />

            <ArticleContent v-if="agreement.content" :content="agreement.content" />

            <section v-if="agreement.history.length" class="legal-page__history">
                <h2 class="legal-page__history-title">
                    {{ copy.historyTitle }}
                </h2>
                <ul class="legal-page__history-list">
                    <li
                        v-for="item in agreement.history"
                        :key="item.id"
                        class="legal-page__history-item"
                    >
                        <strong>{{ item.version || copy.versionFallback }}</strong>
                        <span>{{ formatDate(item.effectiveAt) }}</span>
                        <span>{{ item.versionDescription || copy.historyNoDescription }}</span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AgreementPublicPayload } from '@/types/agreement'

interface LegalAgreementPageCopy {
    authoritativeVersionTag: string
    currentActiveTag: string
    formatEffectiveDateLabel: (date: string) => string
    formatFallbackNotice: (language: string) => string
    formatLastUpdatedLabel: (date: string) => string
    formatReferenceTranslationNotice: (language: string, version: string) => string
    formatVersionLabel: (version: string) => string
    historyNoDescription: string
    historyTitle: string
    legalNotice: string
    referenceTranslationTag: string
    title: string
    versionFallback: string
}

defineProps<{
    agreement: AgreementPublicPayload
    copy: LegalAgreementPageCopy
    formatDate: (value?: null | string) => string
}>()
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
