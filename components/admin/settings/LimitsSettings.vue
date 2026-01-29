<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="posts_per_page" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.posts_per_page') }}
                <i
                    v-if="metadata.posts_per_page?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputNumber
                id="posts_per_page"
                v-model="settings.posts_per_page"
                :disabled="metadata.posts_per_page?.isLocked"
                fluid
                :min="1"
                :max="100"
            />
        </div>
        <div class="form-field">
            <label for="max_upload_size" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.max_upload_size') }}
                <i
                    v-if="metadata.max_upload_size?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputNumber
                id="max_upload_size"
                v-model="settings.max_upload_size"
                :disabled="metadata.max_upload_size?.isLocked"
                fluid
                :min="1"
                suffix=" MB"
            />
        </div>
        <div class="form-field">
            <label for="allowed_file_types" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.allowed_file_types') }}
                <i
                    v-if="metadata.allowed_file_types?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="allowed_file_types"
                v-model="settings.allowed_file_types"
                :disabled="metadata.allowed_file_types?.isLocked"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.file_types_placeholder')"
            />
        </div>
        <div class="form-field">
            <label for="comment_interval" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.comment_interval') }}
                <i
                    v-if="metadata.comment_interval?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputNumber
                id="comment_interval"
                v-model="settings.comment_interval"
                :disabled="metadata.comment_interval?.isLocked"
                fluid
                :min="0"
                suffix=" s"
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
