<template>
    <div class="settings-form">
        <SettingFormField
            field-key="storage_type"
            input-id="storage_type"
            :metadata="metadata.storage_type"
        >
            <Select
                id="storage_type"
                v-model="settings.storage_type"
                :options="storageTypes"
                :disabled="metadata.storage_type?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="asset_public_base_url"
            input-id="asset_public_base_url"
            :metadata="metadata.asset_public_base_url"
        >
            <InputText
                id="asset_public_base_url"
                v-model="settings.asset_public_base_url"
                :disabled="metadata.asset_public_base_url?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="asset_object_prefix"
            input-id="asset_object_prefix"
            :metadata="metadata.asset_object_prefix"
        >
            <InputText
                id="asset_object_prefix"
                v-model="settings.asset_object_prefix"
                :disabled="metadata.asset_object_prefix?.isLocked"
                fluid
            />
        </SettingFormField>

        <template v-if="settings.storage_type === 'local'">
            <SettingFormField
                field-key="local_storage_dir"
                input-id="local_storage_dir"
                :metadata="metadata.local_storage_dir"
            >
                <InputText
                    id="local_storage_dir"
                    v-model="settings.local_storage_dir"
                    :disabled="metadata.local_storage_dir?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="local_storage_base_url"
                input-id="local_storage_base_url"
                :metadata="metadata.local_storage_base_url"
            >
                <InputText
                    id="local_storage_base_url"
                    v-model="settings.local_storage_base_url"
                    :disabled="metadata.local_storage_base_url?.isLocked"
                    fluid
                />
            </SettingFormField>
        </template>

        <template v-if="settings.storage_type === 's3'">
            <SettingFormField
                field-key="s3_endpoint"
                input-id="s3_endpoint"
                :metadata="metadata.s3_endpoint"
            >
                <InputText
                    id="s3_endpoint"
                    v-model="settings.s3_endpoint"
                    :disabled="metadata.s3_endpoint?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_bucket"
                input-id="s3_bucket"
                :metadata="metadata.s3_bucket"
            >
                <InputText
                    id="s3_bucket"
                    v-model="settings.s3_bucket"
                    :disabled="metadata.s3_bucket?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_region"
                input-id="s3_region"
                :metadata="metadata.s3_region"
            >
                <InputText
                    id="s3_region"
                    v-model="settings.s3_region"
                    :disabled="metadata.s3_region?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_access_key"
                input-id="s3_access_key"
                :metadata="metadata.s3_access_key"
            >
                <Password
                    id="s3_access_key"
                    v-model="settings.s3_access_key"
                    :disabled="metadata.s3_access_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_secret_key"
                input-id="s3_secret_key"
                :metadata="metadata.s3_secret_key"
            >
                <Password
                    id="s3_secret_key"
                    v-model="settings.s3_secret_key"
                    :disabled="metadata.s3_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_base_url"
                input-id="s3_base_url"
                :metadata="metadata.s3_base_url"
            >
                <InputText
                    id="s3_base_url"
                    v-model="settings.s3_base_url"
                    :disabled="metadata.s3_base_url?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="s3_bucket_prefix"
                input-id="s3_bucket_prefix"
                :metadata="metadata.s3_bucket_prefix"
            >
                <InputText
                    id="s3_bucket_prefix"
                    v-model="settings.s3_bucket_prefix"
                    :disabled="metadata.s3_bucket_prefix?.isLocked"
                    fluid
                />
            </SettingFormField>
        </template>

        <template v-if="settings.storage_type === 'r2'">
            <SettingFormField
                field-key="cloudflare_r2_account_id"
                input-id="cloudflare_r2_account_id"
                :metadata="metadata.cloudflare_r2_account_id"
            >
                <InputText
                    id="cloudflare_r2_account_id"
                    v-model="settings.cloudflare_r2_account_id"
                    :disabled="metadata.cloudflare_r2_account_id?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="cloudflare_r2_bucket"
                input-id="cloudflare_r2_bucket"
                :metadata="metadata.cloudflare_r2_bucket"
            >
                <InputText
                    id="cloudflare_r2_bucket"
                    v-model="settings.cloudflare_r2_bucket"
                    :disabled="metadata.cloudflare_r2_bucket?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="cloudflare_r2_access_key"
                input-id="cloudflare_r2_access_key"
                :metadata="metadata.cloudflare_r2_access_key"
            >
                <Password
                    id="cloudflare_r2_access_key"
                    v-model="settings.cloudflare_r2_access_key"
                    :disabled="metadata.cloudflare_r2_access_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="cloudflare_r2_secret_key"
                input-id="cloudflare_r2_secret_key"
                :metadata="metadata.cloudflare_r2_secret_key"
            >
                <Password
                    id="cloudflare_r2_secret_key"
                    v-model="settings.cloudflare_r2_secret_key"
                    :disabled="metadata.cloudflare_r2_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="cloudflare_r2_base_url"
                input-id="cloudflare_r2_base_url"
                :metadata="metadata.cloudflare_r2_base_url"
            >
                <InputText
                    id="cloudflare_r2_base_url"
                    v-model="settings.cloudflare_r2_base_url"
                    :disabled="metadata.cloudflare_r2_base_url?.isLocked"
                    fluid
                />
            </SettingFormField>
        </template>

        <template v-if="settings.storage_type === 'vercel_blob'">
            <SettingFormField
                field-key="vercel_blob_token"
                input-id="vercel_blob_token"
                :metadata="metadata.vercel_blob_token"
            >
                <Password
                    id="vercel_blob_token"
                    v-model="settings.vercel_blob_token"
                    :disabled="metadata.vercel_blob_token?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>
        </template>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const storageTypes = ['local', 's3', 'r2', 'vercel_blob']
</script>
