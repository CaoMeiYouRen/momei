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
.perspective-panel {
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

    &__mode-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--p-surface-border);
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

.perspective-item {
    padding: 0.75rem;
    border-radius: var(--p-border-radius-md);
    border: 1px solid var(--p-surface-border);
    margin-bottom: 0.75rem;
    background: var(--p-surface-50);

    &--major {
        border-color: var(--p-red-300);
        background: var(--p-red-50);
    }

    &--minor {
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
        margin-left: auto;
    }
}

:global(.dark) {
    .perspective-item {
        background: var(--p-surface-800);

        &--major {
            background: color-mix(in srgb, var(--p-red-900) 40%, transparent);
            border-color: var(--p-red-700);
        }

        &--minor {
            background: color-mix(in srgb, var(--p-orange-900) 40%, transparent);
            border-color: var(--p-orange-700);
        }

        &__text,
        &__reason {
            background: var(--p-surface-700);
        }
    }

    .perspective-panel__empty-icon {
        color: var(--p-green-400);
    }
}
</style>
