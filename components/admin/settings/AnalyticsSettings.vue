<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="baidu_analytics" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.baidu_analytics') }}
                <i
                    v-if="metadata.baidu_analytics?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="baidu_analytics"
                v-model="settings.baidu_analytics"
                :disabled="metadata.baidu_analytics?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="google_analytics" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.google_analytics') }}
                <i
                    v-if="metadata.google_analytics?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="google_analytics"
                v-model="settings.google_analytics"
                :disabled="metadata.google_analytics?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="clarity_analytics" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.clarity_analytics') }}
                <i
                    v-if="metadata.clarity_analytics?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="clarity_analytics"
                v-model="settings.clarity_analytics"
                :disabled="metadata.clarity_analytics?.isLocked"
                fluid
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
</script>

<style lang="scss" scoped>
.form-field {
    margin-bottom: 1.5rem;

    label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
}
</style>
