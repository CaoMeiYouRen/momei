<template>
    <div class="perspective-panel" :class="{'perspective-panel--visible': visible}">
        <div class="perspective-panel__header">
            <span class="perspective-panel__title">
                {{ mode === 'editor'
                    ? $t('pages.admin.posts.ai.perspective_editor_title')
                    : $t('pages.admin.posts.ai.perspective_reader_title')
                }}
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
        <div class="perspective-panel__mode-tabs">
            <Button
                :label="$t('pages.admin.posts.ai.perspective_editor')"
                icon="pi pi-pen-to-square"
                :severity="mode === 'editor' ? 'contrast' : 'secondary'"
                size="small"
                outlined
                @click="emit('switch-mode', 'editor')"
            />
            <Button
                :label="$t('pages.admin.posts.ai.perspective_reader')"
                icon="pi pi-users"
                :severity="mode === 'reader' ? 'contrast' : 'secondary'"
                size="small"
                outlined
                @click="emit('switch-mode', 'reader')"
            />
        </div>
        <div class="perspective-panel__body">
            <div
                v-if="results.length === 0"
                class="perspective-panel__empty"
            >
                <i class="perspective-panel__empty-icon pi pi-check-circle" />
                <p>{{ $t('pages.admin.posts.ai.perspective_no_issues') }}</p>
            </div>
            <div
                v-for="(item, index) in results"
                :key="index"
                :class="['perspective-item', `perspective-item--${item.severity}`]"
            >
                <div class="perspective-item__header">
                    <Tag
                        :value="severityLabel(item.severity)"
                        :severity="severityTag(item.severity)"
                        size="small"
                    />
                    <Tag
                        :value="typeLabel(item.type)"
                        severity="info"
                        size="small"
                        class="perspective-item__type"
                    />
                </div>
                <div
                    v-if="item.original"
                    class="perspective-item__original"
                >
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
        </div>
    </div>
</template>

<script setup lang="ts">
import type { PerspectiveMode, PerspectiveCheckItem } from '@/types/ai'

defineProps<{
    visible: boolean
    results: PerspectiveCheckItem[]
    mode: PerspectiveMode
}>()

const emit = defineEmits<{
    close: []
    'switch-mode': [mode: PerspectiveMode]
}>()

const { t } = useI18n()

const severityLabel = (severity: PerspectiveCheckItem['severity']) => {
    const map: Record<PerspectiveCheckItem['severity'], string> = {
        info: t('pages.admin.posts.ai.perspective_info'),
        minor: t('pages.admin.posts.ai.perspective_minor'),
        major: t('pages.admin.posts.ai.perspective_major'),
    }
    return map[severity]
}

const severityTag = (severity: PerspectiveCheckItem['severity']) => {
    const map: Record<PerspectiveCheckItem['severity'], 'info' | 'warn' | 'danger'> = {
        info: 'info',
        minor: 'warn',
        major: 'danger',
    }
    return map[severity]
}

const typeLabel = (type: PerspectiveCheckItem['type']) => {
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

.perspective-panel {
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

    &__mode-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--p-surface-border);
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
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--p-text-color);
        margin-bottom: 0.5rem;
    }

    &__reason {
        font-size: 0.8125rem;
        line-height: 1.4;
        color: var(--p-text-muted-color);
        padding: 0.5rem;
        background: var(--p-surface-100);
        border-radius: var(--p-border-radius-sm);
    }

    &__type {
        @extend %editor-panel-item__type;
    }
}

:global(.dark) {
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

    .perspective-panel__empty-icon {
        @extend %editor-panel-dark__empty-icon;
    }
}
</style>
