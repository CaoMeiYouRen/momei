<template>
    <div class="setting-form-field" :class="{'setting-form-field--inline': inline}">
        <div class="setting-form-field__main">
            <div class="setting-form-field__header">
                <label
                    v-if="resolvedLabel"
                    class="setting-form-field__label"
                    :for="inputId || undefined"
                >
                    {{ resolvedLabel }}
                </label>

                <div v-if="metadata" class="setting-form-field__status">
                    <AppTooltip v-if="metadata.source" :content="resolvedMessage || undefined">
                        <span
                            :title="resolvedMessage || undefined"
                            class="setting-form-field__status-item"
                        >
                            <CaomeiTag :tone="sourceTone[metadata.source]">
                                {{ $t(`pages.admin.settings.system.source_badges.${metadata.source}`) }}
                            </CaomeiTag>
                        </span>
                    </AppTooltip>
                    <AppTooltip v-if="metadata.isLocked" :content="resolvedMessage">
                        <Lock
                            :title="resolvedMessage || undefined"
                            :size="14"
                            class="setting-form-field__lock setting-form-field__status-item"
                            aria-hidden="true"
                        />
                    </AppTooltip>
                </div>
            </div>

            <p v-if="description" class="setting-form-field__description">
                {{ description }}
            </p>
        </div>

        <div class="setting-form-field__control">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Lock } from '@lucide/vue'
import type { SettingFieldMetadata, SettingLockReason, SettingSource } from '@/types/setting'

const props = withDefaults(defineProps<{
    fieldKey?: string
    label?: string
    description?: string
    inputId?: string
    metadata?: SettingFieldMetadata | null
    inline?: boolean
}>(), {
    fieldKey: '',
    label: '',
    description: '',
    inputId: '',
    metadata: null,
    inline: false,
})

const { t } = useI18n()

const sourceTone: Record<SettingSource, 'warning' | 'success' | 'primary'> = {
    env: 'warning',
    db: 'success',
    default: 'primary',
}

const resolvedLabel = computed(() => {
    if (props.label) {
        return props.label
    }

    if (props.fieldKey) {
        return t(`pages.admin.settings.system.keys.${props.fieldKey}`)
    }

    return ''
})

const resolvedMessage = computed(() => {
    const item = props.metadata

    if (!item) {
        return ''
    }

    if (item.lockReason === 'env_override') {
        return t('pages.admin.settings.system.smart_mode.messages.env_override', {
            envKey: item.envKey ?? props.fieldKey.toUpperCase(),
        })
    }

    if (item.lockReason === 'forced_env_lock') {
        return t('pages.admin.settings.system.smart_mode.messages.forced_env_lock')
    }

    if (item.defaultUsed || item.source === 'default') {
        return t('pages.admin.settings.system.smart_mode.messages.default_used')
    }

    if (item.requiresRestart) {
        return t('pages.admin.settings.system.smart_mode.messages.restart_required')
    }

    if (item.source === 'db') {
        return t('pages.admin.settings.system.smart_mode.messages.db_active')
    }

    return ''
})
</script>

<style lang="scss" scoped>
.setting-form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    &__header {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
    }

    &__label {
        font-weight: 600;
        line-height: 1.4;
    }

    &__status {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-shrink: 0;
    }

    &__status-item {
        display: inline-flex;
        align-items: center;
        cursor: help;
    }

    &__lock {
        font-size: 0.85rem;
        color: var(--m-orange-500);
    }

    &__description {
        margin: 0;
        color: var(--caomei-color-text-muted);
        line-height: 1.5;
    }

    &--inline {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.75rem 1rem;
        align-items: center;
    }

    &--inline &__main {
        min-width: 0;
    }

    &--inline &__control {
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }
}

@media (width <= 768px) {
    .setting-form-field {
        &--inline {
            grid-template-columns: 1fr;
        }

        &--inline &__control {
            justify-content: flex-start;
        }
    }
}
</style>
