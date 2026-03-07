<template>
    <div class="settings-form">
        <SettingFormField
            field-key="email_host"
            input-id="email_host"
            :metadata="metadata.email_host"
        >
            <InputText
                id="email_host"
                v-model="settings.email_host"
                :disabled="metadata.email_host?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_port"
            input-id="email_port"
            :metadata="metadata.email_port"
        >
            <InputNumber
                id="email_port"
                v-model="settings.email_port"
                :disabled="metadata.email_port?.isLocked"
                fluid
                :use-grouping="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_user"
            input-id="email_user"
            :metadata="metadata.email_user"
        >
            <InputText
                id="email_user"
                v-model="settings.email_user"
                :disabled="metadata.email_user?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_pass"
            input-id="email_pass"
            :metadata="metadata.email_pass"
        >
            <Password
                id="email_pass"
                v-model="settings.email_pass"
                :disabled="metadata.email_pass?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_from"
            input-id="email_from"
            :metadata="metadata.email_from"
        >
            <InputText
                id="email_from"
                v-model="settings.email_from"
                :disabled="metadata.email_from?.isLocked"
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
