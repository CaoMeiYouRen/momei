<template>
    <div class="settings-form">
        <SettingFormField
            field-key="github_client_id"
            input-id="github_client_id"
            :metadata="metadata.github_client_id"
        >
            <InputText
                id="github_client_id"
                v-model="settings.github_client_id"
                :disabled="metadata.github_client_id?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="github_client_secret"
            input-id="github_client_secret"
            :metadata="metadata.github_client_secret"
        >
            <Password
                id="github_client_secret"
                v-model="settings.github_client_secret"
                :disabled="metadata.github_client_secret?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </SettingFormField>

        <Divider />

        <SettingFormField
            field-key="google_client_id"
            input-id="google_client_id"
            :metadata="metadata.google_client_id"
        >
            <InputText
                id="google_client_id"
                v-model="settings.google_client_id"
                :disabled="metadata.google_client_id?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="google_client_secret"
            input-id="google_client_secret"
            :metadata="metadata.google_client_secret"
        >
            <Password
                id="google_client_secret"
                v-model="settings.google_client_secret"
                :disabled="metadata.google_client_secret?.isLocked"
                :toggle-mask="true"
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
