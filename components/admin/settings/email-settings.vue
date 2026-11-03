<template>
    <div class="settings-form">
        <SettingFormField
            field-key="email_host"
            input-id="email_host"
            :metadata="metadata.email_host"
        >
            <SettingInput
                id="email_host"
                v-model="settings.email_host"
                :disabled="metadata.email_host?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_port"
            input-id="email_port"
            :metadata="metadata.email_port"
        >
            <CaomeiInputNumber
                id="email_port"
                v-model="settings.email_port"
                :disabled="metadata.email_port?.isLocked"
                :use-grouping="false"

                :controls="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_user"
            input-id="email_user"
            :metadata="metadata.email_user"
        >
            <SettingInput
                id="email_user"
                v-model="settings.email_user"
                :disabled="metadata.email_user?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_pass"
            input-id="email_pass"
            :metadata="metadata.email_pass"
        >
            <SettingPassword
                id="email_pass"
                v-model="settings.email_pass"
                :disabled="metadata.email_pass?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_from"
            input-id="email_from"
            :metadata="metadata.email_from"
        >
            <SettingInput
                id="email_from"
                v-model="settings.email_from"
                :disabled="metadata.email_from?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            input-id="email_secure"
            :label="$t('pages.admin.settings.system.keys.email_secure')"
            :description="$t('pages.admin.settings.system.hints.email_secure')"
            :metadata="metadata.email_secure"
            inline
        >
            <CaomeiSwitch
                id="email_secure"
                v-model="settings.email_secure"
                :disabled="metadata.email_secure?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_expires_in"
            input-id="email_expires_in"
            :metadata="metadata.email_expires_in"
            :description="$t('pages.admin.settings.system.hints.email_expires_in')"
        >
            <CaomeiInputNumber
                id="email_expires_in"
                v-model="settings.email_expires_in"
                :disabled="metadata.email_expires_in?.isLocked"
                :min="60"
                :max="86400"
                :use-grouping="false"

                :controls="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="temp_email_domain_name"
            input-id="temp_email_domain_name"
            :metadata="metadata.temp_email_domain_name"
            :description="$t('pages.admin.settings.system.hints.temp_email_domain_name')"
        >
            <SettingInput
                id="temp_email_domain_name"
                v-model="settings.temp_email_domain_name"
                :disabled="metadata.temp_email_domain_name?.isLocked"
            />
        </SettingFormField>

        <CaomeiDivider />

        <SettingFormField
            field-key="email_daily_limit"
            input-id="email_daily_limit"
            :metadata="metadata.email_daily_limit"
            :description="$t('pages.admin.settings.system.hints.email_daily_limit')"
        >
            <CaomeiInputNumber
                id="email_daily_limit"
                v-model="settings.email_daily_limit"
                :disabled="metadata.email_daily_limit?.isLocked"
                :use-grouping="false"
                :min="1"

                :controls="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_single_user_daily_limit"
            input-id="email_single_user_daily_limit"
            :metadata="metadata.email_single_user_daily_limit"
            :description="$t('pages.admin.settings.system.hints.email_single_user_daily_limit')"
        >
            <CaomeiInputNumber
                id="email_single_user_daily_limit"
                v-model="settings.email_single_user_daily_limit"
                :disabled="metadata.email_single_user_daily_limit?.isLocked"
                :use-grouping="false"
                :min="1"

                :controls="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="email_limit_window"
            input-id="email_limit_window"
            :metadata="metadata.email_limit_window"
            :description="$t('pages.admin.settings.system.hints.email_limit_window')"
        >
            <SettingInput
                id="email_limit_window"
                v-model="settings.email_limit_window"
                :disabled="metadata.email_limit_window?.isLocked"
            />
        </SettingFormField>

        <EmailTemplateSettingsPanel v-model="settings.email_template_configs" />
    </div>
</template>

<script setup lang="ts">
import SettingInput from '@/components/admin/settings/setting-input.vue'
import SettingPassword from '@/components/admin/settings/setting-password.vue'
import EmailTemplateSettingsPanel from '@/components/admin/settings/email-template-settings-panel.vue'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
</script>
