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
        >
            <InputNumber
                id="max_upload_size"
                v-model="settings.max_upload_size"
                :disabled="metadata.max_upload_size?.isLocked"
                fluid
                :min="1"
                suffix=" MB"
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
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
</script>
