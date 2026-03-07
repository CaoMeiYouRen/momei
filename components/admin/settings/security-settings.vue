<template>
    <div class="settings-form">
        <SettingFormField
            field-key="allow_registration"
            input-id="allow_registration"
            :metadata="metadata.allow_registration"
            inline
        >
            <ToggleSwitch
                id="allow_registration"
                v-model="settings.allow_registration"
                :disabled="metadata.allow_registration?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="enable_captcha"
            input-id="enable_captcha"
            :metadata="metadata.enable_captcha"
            inline
        >
            <ToggleSwitch
                id="enable_captcha"
                v-model="settings.enable_captcha"
                :disabled="metadata.enable_captcha?.isLocked"
            />
        </SettingFormField>

        <template v-if="settings.enable_captcha">
            <SettingFormField
                field-key="captcha_provider"
                input-id="captcha_provider"
                :metadata="metadata.captcha_provider"
            >
                <Select
                    id="captcha_provider"
                    v-model="settings.captcha_provider"
                    :options="captchaTypes"
                    :disabled="metadata.captcha_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="captcha_site_key"
                input-id="captcha_site_key"
                :metadata="metadata.captcha_site_key"
            >
                <InputText
                    id="captcha_site_key"
                    v-model="settings.captcha_site_key"
                    :disabled="metadata.captcha_site_key?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="captcha_secret_key"
                input-id="captcha_secret_key"
                :metadata="metadata.captcha_secret_key"
            >
                <Password
                    id="captcha_secret_key"
                    v-model="settings.captcha_secret_key"
                    :disabled="metadata.captcha_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>
        </template>

        <Divider />

        <SettingFormField
            field-key="enable_comment_review"
            input-id="enable_comment_review"
            :metadata="metadata.enable_comment_review"
            inline
        >
            <ToggleSwitch
                id="enable_comment_review"
                v-model="settings.enable_comment_review"
                :disabled="metadata.enable_comment_review?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="blacklisted_keywords"
            input-id="blacklisted_keywords"
            :metadata="metadata.blacklisted_keywords"
        >
            <Textarea
                id="blacklisted_keywords"
                v-model="settings.blacklisted_keywords"
                :disabled="metadata.blacklisted_keywords?.isLocked"
                rows="4"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.keywords_placeholder')"
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const captchaTypes = ['turnstile', 'recaptcha', 'hcaptcha']
</script>
