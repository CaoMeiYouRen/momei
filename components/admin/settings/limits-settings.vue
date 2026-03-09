<template>
    <div class="settings-form">
        <SettingFormField
            field-key="posts_per_page"
            input-id="posts_per_page"
            :metadata="metadata.posts_per_page"
        >
            <InputNumber
                id="posts_per_page"
                v-model="settings.posts_per_page"
                :disabled="metadata.posts_per_page?.isLocked"
                fluid
                :min="1"
                :max="100"
            />
        </SettingFormField>

        <SettingFormField
            field-key="max_upload_size"
            input-id="max_upload_size"
            :metadata="metadata.max_upload_size"
            :description="$t('pages.admin.settings.system.hints.upload_size_value')"
        >
            <InputText
                id="max_upload_size"
                v-model="settings.max_upload_size"
                :disabled="metadata.max_upload_size?.isLocked"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.upload_size_placeholder')"
            />
        </SettingFormField>

        <SettingFormField
            field-key="max_audio_upload_size"
            input-id="max_audio_upload_size"
            :metadata="metadata.max_audio_upload_size"
            :description="$t('pages.admin.settings.system.hints.audio_upload_size_value')"
        >
            <InputText
                id="max_audio_upload_size"
                v-model="settings.max_audio_upload_size"
                :disabled="metadata.max_audio_upload_size?.isLocked"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.audio_upload_size_placeholder')"
            />
        </SettingFormField>

        <SettingFormField
            field-key="allowed_file_types"
            input-id="allowed_file_types"
            :metadata="metadata.allowed_file_types"
        >
            <InputText
                id="allowed_file_types"
                v-model="settings.allowed_file_types"
                :disabled="metadata.allowed_file_types?.isLocked"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.file_types_placeholder')"
            />
        </SettingFormField>

        <SettingFormField
            field-key="comment_interval"
            input-id="comment_interval"
            :metadata="metadata.comment_interval"
        >
            <InputNumber
                id="comment_interval"
                v-model="settings.comment_interval"
                :disabled="metadata.comment_interval?.isLocked"
                fluid
                :min="0"
                suffix=" s"
            />
        </SettingFormField>

        <SettingFormField
            field-key="upload_daily_limit"
            input-id="upload_daily_limit"
            :metadata="metadata.upload_daily_limit"
            :description="$t('pages.admin.settings.system.hints.upload_daily_limit')"
        >
            <InputNumber
                id="upload_daily_limit"
                v-model="settings.upload_daily_limit"
                :disabled="metadata.upload_daily_limit?.isLocked"
                fluid
                :min="1"
            />
        </SettingFormField>

        <SettingFormField
            field-key="upload_single_user_daily_limit"
            input-id="upload_single_user_daily_limit"
            :metadata="metadata.upload_single_user_daily_limit"
            :description="$t('pages.admin.settings.system.hints.upload_single_user_daily_limit')"
        >
            <InputNumber
                id="upload_single_user_daily_limit"
                v-model="settings.upload_single_user_daily_limit"
                :disabled="metadata.upload_single_user_daily_limit?.isLocked"
                fluid
                :min="1"
            />
        </SettingFormField>

        <SettingFormField
            field-key="upload_limit_window"
            input-id="upload_limit_window"
            :metadata="metadata.upload_limit_window"
            :description="$t('pages.admin.settings.system.hints.upload_limit_window')"
        >
            <InputNumber
                id="upload_limit_window"
                v-model="settings.upload_limit_window"
                :disabled="metadata.upload_limit_window?.isLocked"
                fluid
                :min="1"
                suffix=" s"
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

interface LimitSettingsModel {
    posts_per_page?: number | null
    max_upload_size?: string | null
    max_audio_upload_size?: string | null
    allowed_file_types?: string | null
    comment_interval?: number | null
    upload_daily_limit?: number | null
    upload_single_user_daily_limit?: number | null
    upload_limit_window?: number | null
}

interface LimitSettingMetadata {
    isLocked?: boolean
}

const settings = defineModel<LimitSettingsModel>('settings', { required: true })
defineProps<{ metadata: Record<string, LimitSettingMetadata | undefined> }>()
</script>
