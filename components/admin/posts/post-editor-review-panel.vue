<template>
    <div class="review-panel" :class="{'review-panel--visible': visible}">
        <div class="review-panel__header">
            <span class="review-panel__title">
                {{ $t('pages.admin.posts.ai.review_panel_title') }}
            </span>
            <Button
                icon="pi pi-times"
                text
                rounded
                severity="secondary"
                size="small"
                @click="emit('close')"
            />
        </div>
        <div class="review-panel__body">
            <div
                v-if="suggestions.length === 0"
                class="review-panel__empty"
            >
                <i class="pi pi-check-circle review-panel__empty-icon" />
                <p>{{ $t('pages.admin.posts.ai.review_no_issues') }}</p>
            </div>
            <div
                v-for="(suggestion, index) in suggestions"
                :key="index"
                class="review-suggestion"
                :class="`review-suggestion--${suggestion.severity}`"
            >
                <div class="review-suggestion__header">
                    <Tag
                        :value="severityLabel(suggestion.severity)"
                        :severity="severityTag(suggestion.severity)"
                        size="small"
                    />
                    <Tag
                        :value="typeLabel(suggestion.type)"
                        severity="info"
                        size="small"
                        class="review-suggestion__type"
                    />
                </div>
                <div class="review-suggestion__original">
                    <span class="review-suggestion__label">
                        {{ $t('pages.admin.posts.ai.review_original') }}:
                    </span>
                    <code class="review-suggestion__text">{{ suggestion.original }}</code>
                </div>
                <div class="review-suggestion__message">
                    {{ suggestion.suggestion }}
                </div>
                <div
                    v-if="suggestion.replacement"
                    class="review-suggestion__replacement"
                >
                    <span class="review-suggestion__label">
                        {{ $t('pages.admin.posts.ai.review_suggestion') }}:
                    </span>
                    <code class="review-suggestion__text">{{ suggestion.replacement }}</code>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AIReviewSuggestion } from '@/types/ai'

defineProps<{
    visible: boolean
    suggestions: AIReviewSuggestion[]
}>()

const emit = defineEmits<{
    close: []
}>()

const { t } = useI18n()

const severityLabel = (severity: AIReviewSuggestion['severity']) => {
    const map: Record<AIReviewSuggestion['severity'], string> = {
        minor: t('pages.admin.posts.ai.review_minor'),
        major: t('pages.admin.posts.ai.review_major'),
        critical: t('pages.admin.posts.ai.review_critical'),
    }
    return map[severity]
}

const severityTag = (severity: AIReviewSuggestion['severity']) => {
    const map: Record<AIReviewSuggestion['severity'], 'info' | 'warn' | 'danger'> = {
        minor: 'info',
        major: 'warn',
        critical: 'danger',
    }
    return map[severity]
}

const typeLabel = (type: AIReviewSuggestion['type']) => {
    const map: Record<AIReviewSuggestion['type'], string> = {
        grammar: t('pages.admin.posts.ai.review_type_grammar'),
        spelling: t('pages.admin.posts.ai.review_type_spelling'),
        logic: t('pages.admin.posts.ai.review_type_logic'),
        style: t('pages.admin.posts.ai.review_type_style'),
        fact: t('pages.admin.posts.ai.review_type_fact'),
    }
    return map[type]
}
</script>

<style lang="scss" scoped>
.review-panel {
    position: fixed;
    top: 4rem;
    right: 0;
    width: 24rem;
    height: calc(100vh - 4rem);
    background: var(--p-surface-card);
    border-left: 1px solid var(--p-surface-border);
    box-shadow: -2px 0 8px rgb(0 0 0 / 0.08);
    z-index: 300;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease;

    &--visible {
        transform: translateX(0);
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__title {
        font-size: 1rem;
        font-weight: 600;
    }

    &__body {
        flex: 1;
        overflow-y: auto;
        padding: 0.75rem;
    }

    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--p-text-muted-color);
        text-align: center;
        gap: 0.75rem;

        &-icon {
            font-size: 2.5rem;
            color: var(--p-green-500);
        }
    }
}

.review-suggestion {
    padding: 0.75rem;
    border-radius: var(--p-border-radius-md);
    border: 1px solid var(--p-surface-border);
    margin-bottom: 0.75rem;
    background: var(--p-surface-50);

    &--critical {
        border-color: var(--p-red-300);
        background: var(--p-red-50);
    }

    &--major {
        border-color: var(--p-orange-300);
        background: var(--p-orange-50);
    }

    &__header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    &__original {
        margin-bottom: 0.5rem;
    }

    &__label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--p-text-muted-color);
        display: block;
        margin-bottom: 0.25rem;
    }

    &__text {
        display: block;
        padding: 0.375rem 0.5rem;
        background: var(--p-surface-100);
        border-radius: var(--p-border-radius-sm);
        font-size: 0.8125rem;
        line-height: 1.4;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    &__message {
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--p-text-color);
    }

    &__replacement {
        margin-top: 0.5rem;
    }

    &__type {
        margin-left: auto;
    }
}

:global(.dark) {
    .review-suggestion {
        background: var(--p-surface-800);

        &--critical {
            background: color-mix(in srgb, var(--p-red-900) 40%, transparent);
            border-color: var(--p-red-700);
        }

        &--major {
            background: color-mix(in srgb, var(--p-orange-900) 40%, transparent);
            border-color: var(--p-orange-700);
        }

        &__text {
            background: var(--p-surface-700);
        }
    }

    .review-panel__empty-icon {
        color: var(--p-green-400);
    }
}
</style>
