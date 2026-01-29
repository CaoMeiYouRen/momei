<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="storage_type" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.storage_type') }}
                <i
                    v-if="metadata.storage_type?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Select
                id="storage_type"
                v-model="settings.storage_type"
                :options="storageTypes"
                :disabled="metadata.storage_type?.isLocked"
                fluid
            />
        </div>

        <template v-if="settings.storage_type === 'local'">
            <div class="form-field">
                <label for="local_storage_dir" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.local_storage_dir') }}
                    <i
                        v-if="metadata.local_storage_dir?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="local_storage_dir"
                    v-model="settings.local_storage_dir"
                    :disabled="metadata.local_storage_dir?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="local_storage_base_url" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.local_storage_base_url') }}
                    <i
                        v-if="metadata.local_storage_base_url?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="local_storage_base_url"
                    v-model="settings.local_storage_base_url"
                    :disabled="metadata.local_storage_base_url?.isLocked"
                    fluid
                />
            </div>
        </template>

        <template v-if="settings.storage_type === 's3'">
            <div class="form-field">
                <label for="s3_endpoint" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_endpoint') }}
                    <i
                        v-if="metadata.s3_endpoint?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="s3_endpoint"
                    v-model="settings.s3_endpoint"
                    :disabled="metadata.s3_endpoint?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="s3_bucket" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_bucket') }}
                    <i
                        v-if="metadata.s3_bucket?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="s3_bucket"
                    v-model="settings.s3_bucket"
                    :disabled="metadata.s3_bucket?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="s3_region" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_region') }}
                    <i
                        v-if="metadata.s3_region?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="s3_region"
                    v-model="settings.s3_region"
                    :disabled="metadata.s3_region?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="s3_access_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_access_key') }}
                    <i
                        v-if="metadata.s3_access_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Password
                    id="s3_access_key"
                    v-model="settings.s3_access_key"
                    :disabled="metadata.s3_access_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="s3_secret_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_secret_key') }}
                    <i
                        v-if="metadata.s3_secret_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Password
                    id="s3_secret_key"
                    v-model="settings.s3_secret_key"
                    :disabled="metadata.s3_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="s3_base_url" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.s3_base_url') }}
                    <i
                        v-if="metadata.s3_base_url?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="s3_base_url"
                    v-model="settings.s3_base_url"
                    :disabled="metadata.s3_base_url?.isLocked"
                    fluid
                />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const storageTypes = ['local', 's3', 'r2', 'cloudflare_r2']
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
