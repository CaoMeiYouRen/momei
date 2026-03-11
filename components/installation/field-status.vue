<template>
    <span v-if="envSetting?.isLocked" class="installation-field-status">
        <span
            v-tooltip="resolvedMessage || undefined"
            :title="resolvedMessage || undefined"
            class="installation-field-status__item"
        >
            <Tag
                severity="warn"
                :value="$t('pages.admin.settings.system.source_badges.env')"
            />
        </span>
        <i
            v-tooltip="resolvedMessage || undefined"
            :title="resolvedMessage || undefined"
            class="installation-field-status__item installation-field-status__lock pi pi-lock"
        />
    </span>
</template>

<script setup lang="ts">
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
        font-size: 0.85rem;
        color: var(--p-orange-500);
    }
}
</style>
