<template>
    <div class="setting-explanation-card">
        <div class="setting-explanation-card__header">
            <div>
                <h3 class="setting-explanation-card__title">
                    {{ $t('pages.admin.settings.system.smart_mode.title') }}
                </h3>
                <p class="setting-explanation-card__description">
                    {{ $t('pages.admin.settings.system.smart_mode.description') }}
                </p>
            </div>

            <div class="setting-explanation-card__priority">
                <span class="setting-explanation-card__priority-label">
                    {{ $t('pages.admin.settings.system.smart_mode.priority_label') }}
                </span>
                <strong class="setting-explanation-card__priority-value">ENV -> DB -> Default</strong>
            </div>
        </div>

        <div class="setting-explanation-card__stats">
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.stat_locked') }}</span>
                <Tag severity="warn" :value="String(stats.locked)" />
            </div>
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.stat_default_used') }}</span>
                <Tag severity="info" :value="String(stats.defaultUsed)" />
            </div>
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.stat_requires_restart') }}</span>
                <Tag severity="secondary" :value="String(stats.requiresRestart)" />
            </div>
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.source_counts.env') }}</span>
                <Tag severity="warn" :value="String(stats.sources.env)" />
            </div>
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.source_counts.db') }}</span>
                <Tag severity="success" :value="String(stats.sources.db)" />
            </div>
            <div class="setting-explanation-card__stat">
                <span>{{ $t('pages.admin.settings.system.smart_mode.source_counts.default') }}</span>
                <Tag severity="info" :value="String(stats.sources.default)" />
            </div>
        </div>

        <div v-if="items.length" class="setting-explanation-card__list">
            <div
                v-for="item in items"
                :key="item.key"
                class="setting-explanation-card__item"
            >
                <div class="setting-explanation-card__item-header">
                    <span class="setting-explanation-card__item-title">{{ item.label }}</span>
                    <Tag :severity="sourceSeverity[item.source]" :value="$t(`pages.admin.settings.system.source_badges.${item.source}`)" />
                </div>
                <p class="setting-explanation-card__item-message">
                    {{ item.message }}
                </p>
            </div>
        </div>

        <p v-else class="setting-explanation-card__empty">
            {{ $t('pages.admin.settings.system.smart_mode.empty') }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { SettingSource } from '@/types/setting'

interface ExplanationCardStats {
    locked: number
    defaultUsed: number
    requiresRestart: number
    sources: Record<SettingSource, number>
}

interface ExplanationCardItem {
    key: string
    label: string
    source: SettingSource
    message: string
}

defineProps<{
    stats: ExplanationCardStats
    items: ExplanationCardItem[]
}>()

const sourceSeverity: Record<SettingSource, 'warn' | 'success' | 'info'> = {
    env: 'warn',
    db: 'success',
    default: 'info',
}
</script>

<style lang="scss" scoped>
.setting-explanation-card {
    padding: 1rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 1rem;
    background: linear-gradient(180deg, color-mix(in srgb, var(--p-primary-50) 55%, transparent) 0%, transparent 100%);

    &__header {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    &__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
    }

    &__description {
        margin: 0.35rem 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }

    &__priority {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 12rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--p-surface-100) 80%, transparent);
    }

    &__priority-label {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
    }

    &__priority-value {
        font-size: 0.95rem;
    }

    &__stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    &__stat {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--p-surface-0) 88%, transparent);
    }

    &__list {
        display: grid;
        gap: 0.75rem;
    }

    &__item {
        padding: 0.85rem 1rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--p-surface-0) 92%, transparent);
    }

    &__item-header {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
    }

    &__item-title {
        font-weight: 600;
    }

    &__item-message {
        margin: 0.5rem 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }

    &__empty {
        margin: 0;
        color: var(--p-text-muted-color);
    }
}

@media (width <= 768px) {
    .setting-explanation-card {
        &__header {
            flex-direction: column;
        }

        &__priority {
            min-width: 100%;
        }
    }
}
</style>
