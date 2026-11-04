<template>
    <span v-if="envSetting?.isLocked" class="installation-field-status">
        <AppTooltip :content="resolvedMessage || undefined">
            <span
                :title="resolvedMessage || undefined"
                class="installation-field-status__item"
            >
                <CaomeiTag tone="warning">
                    {{ $t('pages.admin.settings.system.source_badges.env') }}
                </CaomeiTag>
            </span>
        </AppTooltip>
        <AppTooltip :content="resolvedMessage || undefined">
            <Lock
                :size="14"
                :title="resolvedMessage || undefined"
                class="installation-field-status__item installation-field-status__lock"
                aria-hidden="true"
            />
        </AppTooltip>
    </span>
</template>

<script setup lang="ts">
import { Lock } from '@lucide/vue'
import { resolveInstallationEnvLockMessage, type InstallationEnvSetting } from '@/utils/shared/installation-env-setting'

const props = defineProps<{
    fieldKey: string
    envSetting?: InstallationEnvSetting | null
}>()

const { t } = useI18n()

const resolvedMessage = computed(() => resolveInstallationEnvLockMessage(t, props.fieldKey, props.envSetting))
</script>

<style lang="scss" scoped>
.installation-field-status {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;

    &__item {
        display: inline-flex;
        align-items: center;
        cursor: help;
    }

    &__lock {
        color: var(--p-orange-500);
    }
}
</style>
