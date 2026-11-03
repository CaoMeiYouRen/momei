<template>
    <div class="settings-form">
        <SettingFormField
            field-key="github_client_id"
            input-id="github_client_id"
            :metadata="metadata.github_client_id"
        >
            <SettingInput
                id="github_client_id"
                v-model="settings.github_client_id"
                :disabled="metadata.github_client_id?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="github_client_secret"
            input-id="github_client_secret"
            :metadata="metadata.github_client_secret"
        >
            <SettingPassword
                id="github_client_secret"
                v-model="settings.github_client_secret"
                :disabled="metadata.github_client_secret?.isLocked"
            />
        </SettingFormField>

        <CaomeiDivider />

        <SettingFormField
            field-key="google_client_id"
            input-id="google_client_id"
            :metadata="metadata.google_client_id"
        >
            <SettingInput
                id="google_client_id"
                v-model="settings.google_client_id"
                :disabled="metadata.google_client_id?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="google_client_secret"
            input-id="google_client_secret"
            :metadata="metadata.google_client_secret"
        >
            <SettingPassword
                id="google_client_secret"
                v-model="settings.google_client_secret"
                :disabled="metadata.google_client_secret?.isLocked"
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingInput from '@/components/admin/settings/setting-input.vue'
import SettingPassword from '@/components/admin/settings/setting-password.vue'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import type { SettingFormValue, SettingMetadataMap } from '@/types/setting'

interface AuthSettingsFields {
    github_client_id: string | null
    github_client_secret: string | null
    google_client_id: string | null
    google_client_secret: string | null
}

type AuthSettingsModel = Record<string, SettingFormValue> & Partial<AuthSettingsFields>

const settings = defineModel<AuthSettingsModel>('settings', { required: true })
defineProps<{ metadata: SettingMetadataMap<keyof AuthSettingsFields> }>()
</script>
