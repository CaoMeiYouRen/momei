<template>
    <div
        class="consolidated-panel"
        :class="{'consolidated-panel--visible': visible}"
        :inert="!visible"
        :aria-hidden="!visible"
    >
        <div class="consolidated-panel__header">
            <span class="consolidated-panel__title">
                {{ $t('pages.admin.posts.ai.consolidated_panel_title') }}
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

        <CaomeiTabs
            :model-value="activeTab"
            class="consolidated-panel__tabs"
            @update:model-value="(value) => emit('update:activeTab', value as ConsolidatedReviewTab)"
        >
            <CaomeiTabList>
                <CaomeiTabTrigger value="review">
                    <Search :size="16" class="consolidated-panel__tab-icon" />
                    {{ $t('pages.admin.posts.ai.consolidated_tab_review') }} ({{ failedSections.includes('review') ? 0 : reviewSuggestions.length }})
                </CaomeiTabTrigger>
                <CaomeiTabTrigger value="perspective">
                    <Users :size="16" class="consolidated-panel__tab-icon" />
                    {{ $t('pages.admin.posts.ai.consolidated_tab_perspective') }} ({{ failedSections.includes('perspective') ? 0 : perspectiveResults.length }})
                </CaomeiTabTrigger>
            </CaomeiTabList>

            <CaomeiTabContent value="review" class="consolidated-panel__body">
                <p
                    v-if="failedSections.includes('review')"
                    class="consolidated-panel__error"
                >
                    {{ $t('pages.admin.posts.ai.consolidated_review_failed') }}
                </p>
                <p
                    v-else-if="loading.review && reviewSuggestions.length === 0"
                    class="consolidated-panel__loading"
                >
                    {{ $t('common.loading') }}
                </p>
                <div
                    v-else-if="reviewSuggestions.length === 0"
                    class="consolidated-panel__empty"
                >
                    <CircleCheck :size="40" class="consolidated-panel__empty-icon" />
                    <p>{{ $t('pages.admin.posts.ai.review_no_issues') }}</p>
                </div>
                <template v-else>
                    <div
                        v-for="(suggestion, index) in reviewSuggestions"
                        :key="`review-${index}`"
                        class="review-suggestion"
                        :class="`review-suggestion--${suggestion.severity}`"
                    >
                        <div class="review-suggestion__header">
                            <CaomeiTag :tone="severityTone(suggestion.severity)" size="sm">
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
                        <div v-if="suggestion.replacement" class="review-suggestion__replacement">
                            <span class="review-suggestion__label">
                                {{ $t('pages.admin.posts.ai.review_suggestion') }}:
                            </span>
                            <code class="review-suggestion__text">{{ suggestion.replacement }}</code>
                        </div>
                    </div>
                </template>
            </CaomeiTabContent>

            <CaomeiTabContent value="perspective" class="consolidated-panel__body">
                <div class="consolidated-panel__mode-tabs">
                    <CaomeiButton
                        :variant="mode === 'editor' ? 'primary' : 'secondary'"
                        :tone="mode === 'editor' ? 'primary' : 'neutral'"
                        size="sm"
                        :aria-pressed="mode === 'editor'"
                        @click="emit('switch-mode', 'editor')"
                    >
                        <template #icon>
                            <SquarePen :size="16" />
                        </template>
                        {{ $t('pages.admin.posts.ai.perspective_editor') }}
                    </CaomeiButton>
                    <CaomeiButton
                        :variant="mode === 'reader' ? 'primary' : 'secondary'"
                        :tone="mode === 'reader' ? 'primary' : 'neutral'"
                        size="sm"
                        :aria-pressed="mode === 'reader'"
                        @click="emit('switch-mode', 'reader')"
                    >
                        <template #icon>
                            <Users :size="16" />
                        </template>
                        {{ $t('pages.admin.posts.ai.perspective_reader') }}
                    </CaomeiButton>
                </div>
                <p
                    v-if="failedSections.includes('perspective')"
                    class="consolidated-panel__error"
                >
                    {{ $t('pages.admin.posts.ai.consolidated_perspective_failed') }}
                </p>
                <p
                    v-else-if="loading.perspective && perspectiveResults.length === 0"
                    class="consolidated-panel__loading"
                >
                    {{ $t('common.loading') }}
                </p>
                <div
                    v-else-if="perspectiveResults.length === 0"
                    class="consolidated-panel__empty"
                >
                    <CircleCheck :size="40" class="consolidated-panel__empty-icon" />
                    <p>{{ $t('pages.admin.posts.ai.perspective_no_issues') }}</p>
                </div>
                <template v-else>
                    <div
                        v-for="(item, index) in perspectiveResults"
                        :key="`perspective-${index}`"
                        :class="['perspective-item', `perspective-item--${item.severity}`]"
                    >
                        <div class="perspective-item__header">
                            <CaomeiTag :tone="perspectiveSeverityTone(item.severity)" size="sm">
                                {{ perspectiveSeverityLabel(item.severity) }}
                            </CaomeiTag>
                            <CaomeiTag
                                tone="primary"
                                size="sm"
                                class="perspective-item__type"
                            >
                                {{ perspectiveTypeLabel(item.type) }}
                            </CaomeiTag>
                        </div>
                        <div v-if="item.original" class="perspective-item__original">
                            <span class="perspective-item__label">
                                {{ $t('pages.admin.posts.ai.perspective_original') }}:
                            </span>
                            <code class="perspective-item__text">{{ item.original }}</code>
                        </div>
                        <div class="perspective-item__message">
                            {{ item.suggestion }}
                        </div>
                        <div class="perspective-item__reason">
                            <span class="perspective-item__label">
                                {{ $t('pages.admin.posts.ai.perspective_reason') }}:
                            </span>
                            {{ item.reason }}
                        </div>
                    </div>
                </template>
            </CaomeiTabContent>
        </CaomeiTabs>
    </div>
</template>

<script setup lang="ts">
import { CircleCheck, Search, SquarePen, Users, X } from '@lucide/vue'
import type { AIReviewSuggestion, ConsolidatedReviewTab, PerspectiveCheckItem, PerspectiveMode } from '@/types/ai'

defineProps<{
    visible: boolean
    activeTab: ConsolidatedReviewTab
    reviewSuggestions: AIReviewSuggestion[]
    perspectiveResults: PerspectiveCheckItem[]
    mode: PerspectiveMode
    loading: { review: boolean, perspective: boolean }
    failedSections: ConsolidatedReviewTab[]
}>()

const emit = defineEmits<{
    close: []
    'update:activeTab': [tab: ConsolidatedReviewTab]
    'switch-mode': [mode: PerspectiveMode]
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

const perspectiveSeverityLabel = (severity: PerspectiveCheckItem['severity']) => {
    const map: Record<PerspectiveCheckItem['severity'], string> = {
        info: t('pages.admin.posts.ai.perspective_info'),
        minor: t('pages.admin.posts.ai.perspective_minor'),
        major: t('pages.admin.posts.ai.perspective_major'),
    }
    return map[severity]
}

const perspectiveSeverityTone = (severity: PerspectiveCheckItem['severity']) => {
    const map: Record<PerspectiveCheckItem['severity'], 'primary' | 'warning' | 'danger'> = {
        info: 'primary',
        minor: 'warning',
        major: 'danger',
    }
    return map[severity]
}

const perspectiveTypeLabel = (type: PerspectiveCheckItem['type']) => {
    const map: Record<PerspectiveCheckItem['type'], string> = {
        structure: t('pages.admin.posts.ai.perspective_type_structure'),
        clarity: t('pages.admin.posts.ai.perspective_type_clarity'),
        pacing: t('pages.admin.posts.ai.perspective_type_pacing'),
        argument: t('pages.admin.posts.ai.perspective_type_argument'),
        engagement: t('pages.admin.posts.ai.perspective_type_engagement'),
        transition: t('pages.admin.posts.ai.perspective_type_transition'),
        tone: t('pages.admin.posts.ai.perspective_type_tone'),
        confusion: t('pages.admin.posts.ai.perspective_type_confusion'),
        emotion: t('pages.admin.posts.ai.perspective_type_emotion'),
        completeness: t('pages.admin.posts.ai.perspective_type_completeness'),
    }
    return map[type]
}

</script>

<style lang="scss" scoped>
@use './editor-panel-shared' as panel;

.consolidated-panel {
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

    &__tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    &__tab-icon {
        margin-right: 0.375rem;
    }

    &__body {
        @extend %editor-panel__body;
    }

    &__mode-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 0 0.25rem;
    }

    &__loading {
        padding: 1rem;
        color: var(--caomei-color-text-muted);
        font-size: var(--m-font-size-sm);
    }

    &__error {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        font-size: var(--m-font-size-sm);
        color: var(--caomei-color-danger);
        background: var(--m-surface-100);
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
        font-size: var(--m-font-size-sm);
        line-height: 1.5;
        color: var(--caomei-color-text);
    }

    &__replacement {
        margin-top: 0.5rem;
    }

    &__type {
        @extend %editor-panel-item__type;
    }
}

.perspective-item {
    @extend %editor-panel-item;

    &--major {
        @extend %editor-panel-item--critical;
    }

    &--minor {
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
        font-size: var(--m-font-size-sm);
        line-height: 1.5;
        color: var(--caomei-color-text);
        margin-bottom: 0.5rem;
    }

    &__reason {
        font-size: 0.8125rem;
        line-height: 1.4;
        color: var(--caomei-color-text-muted);
        padding: 0.5rem;
        background: var(--m-surface-100);
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

    .perspective-item {
        @extend %editor-panel-dark-item;

        &--major {
            @extend %editor-panel-dark-item--critical;
        }

        &--minor {
            @extend %editor-panel-dark-item--major;
        }

        &__text,
        &__reason {
            @extend %editor-panel-dark-item__text;
        }
    }

    .consolidated-panel__empty-icon {
        @extend %editor-panel-dark__empty-icon;
    }
}
</style>
