<template>
    <div class="review-panel" :class="{'review-panel--visible': visible}">
        <div class="review-panel__header">
            <span class="review-panel__title">
                {{ $t('pages.admin.posts.ai.review_panel_title') }}
            </span>
            <CaomeiButton
                icon-only
                variant="ghost"
                tone="neutral"
                rounded
                size="sm"
                :label="$t('common.close')"
                @click="emit('close')"
            >
                <template #icon>
                    <X :size="16" />
                </template>
            </CaomeiButton>
        </div>
        <div class="review-panel__body">
            <div
                v-if="suggestions.length === 0"
                class="review-panel__empty"
            >
                <CircleCheck :size="40" class="review-panel__empty-icon" />
                <p>{{ $t('pages.admin.posts.ai.review_no_issues') }}</p>
            </div>
            <div
                v-for="(suggestion, index) in suggestions"
                :key="index"
                class="review-suggestion"
                :class="`review-suggestion--${suggestion.severity}`"
            >
                <div class="review-suggestion__header">
                    <CaomeiTag
                        :tone="severityTone(suggestion.severity)"
                        size="sm"
                    >
                        {{ severityLabel(suggestion.severity) }}
                    </CaomeiTag>
                    <CaomeiTag
                        tone="primary"
                        size="sm"
                        class="review-suggestion__type"
                    >
                        {{ typeLabel(suggestion.type) }}
                    </CaomeiTag>
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
import { CircleCheck, X } from '@lucide/vue'
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

const severityTone = (severity: AIReviewSuggestion['severity']) => {
    const map: Record<AIReviewSuggestion['severity'], 'primary' | 'warning' | 'danger'> = {
        minor: 'primary',
        major: 'warning',
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
@use './editor-panel-shared' as panel;

.review-panel {
    @extend %editor-panel;

    &--visible {
        @extend %editor-panel--visible;
    }

    &__header {
        @extend %editor-panel__header;
    }

    &__title {
        @extend %editor-panel__title;
    }

    &__body {
        @extend %editor-panel__body;
    }

    &__empty {
        @extend %editor-panel__empty;

        &-icon {
            @extend %editor-panel__empty-icon;
        }
    }
}

.review-suggestion {
    @extend %editor-panel-item;

    &--critical {
        @extend %editor-panel-item--critical;
    }

    &--major {
        @extend %editor-panel-item--major;
    }

    &__header {
        @extend %editor-panel-item__header;
    }

    &__original {
        @extend %editor-panel-item__original;
    }

    &__label {
        @extend %editor-panel-item__label;
    }

    &__text {
        @extend %editor-panel-item__text;
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
        @extend %editor-panel-item__type;
    }
}

:global(.dark) {
    .review-suggestion {
        @extend %editor-panel-dark-item;

        &--critical {
            @extend %editor-panel-dark-item--critical;
        }

        &--major {
            @extend %editor-panel-dark-item--major;
        }

        &__text {
            @extend %editor-panel-dark-item__text;
        }
    }

    .review-panel__empty-icon {
        @extend %editor-panel-dark__empty-icon;
    }
}
</style>
