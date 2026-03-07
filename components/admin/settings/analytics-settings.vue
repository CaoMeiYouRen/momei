<template>
    <div class="settings-form">
        <SettingFormField
            field-key="baidu_analytics"
            input-id="baidu_analytics"
            :metadata="metadata.baidu_analytics"
        >
            <InputText
                id="baidu_analytics"
                v-model="settings.baidu_analytics"
                :disabled="metadata.baidu_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="google_analytics"
            input-id="google_analytics"
            :metadata="metadata.google_analytics"
        >
            <InputText
                id="google_analytics"
                v-model="settings.google_analytics"
                :disabled="metadata.google_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="clarity_analytics"
            input-id="clarity_analytics"
            :metadata="metadata.clarity_analytics"
        >
            <InputText
                id="clarity_analytics"
                v-model="settings.clarity_analytics"
                :disabled="metadata.clarity_analytics?.isLocked"
                fluid
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
</script>
