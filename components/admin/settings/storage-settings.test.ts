import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StorageSettings from './storage-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata', 'description'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    Select: {
        props: ['id', 'modelValue', 'options', 'disabled'],
        emits: ['update:modelValue'],
        template: '<select :id="id" :value="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option" :value="option">{{ option }}</option></select>',
    },
    InputText: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    Password: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" type="password" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    InputNumber: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
    },
}

describe('StorageSettings', () => {
    it('switches between storage providers, updates provider-specific fields, and respects locked metadata', async () => {
        const settings = reactive({
            storage_type: 'local',
            asset_public_base_url: 'https://cdn.example.com',
            asset_object_prefix: 'assets/',
            local_storage_dir: '/data/assets',
            local_storage_base_url: '/uploads',
            local_storage_min_free_space: 512,
            s3_endpoint: '',
            s3_bucket: '',
            s3_region: '',
            s3_access_key: '',
            s3_secret_key: '',
            s3_base_url: '',
            s3_bucket_prefix: '',
            cloudflare_r2_account_id: '',
            cloudflare_r2_bucket: '',
            cloudflare_r2_access_key: '',
            cloudflare_r2_secret_key: '',
            cloudflare_r2_base_url: '',
            vercel_blob_token: '',
        })

        const wrapper = await mountSuspended(StorageSettings, {
            props: {
                settings,
                metadata: {
                    storage_type: { isLocked: false },
                    asset_public_base_url: { isLocked: false },
                    asset_object_prefix: { isLocked: false },
                    local_storage_dir: { isLocked: false },
                    local_storage_base_url: { isLocked: false },
                    local_storage_min_free_space: { isLocked: false },
                    s3_endpoint: { isLocked: false },
                    s3_bucket: { isLocked: false },
                    s3_region: { isLocked: false },
                    s3_access_key: { isLocked: false },
                    s3_secret_key: { isLocked: true },
                    s3_base_url: { isLocked: false },
                    s3_bucket_prefix: { isLocked: false },
                    cloudflare_r2_account_id: { isLocked: false },
                    cloudflare_r2_bucket: { isLocked: false },
                    cloudflare_r2_access_key: { isLocked: false },
                    cloudflare_r2_secret_key: { isLocked: false },
                    cloudflare_r2_base_url: { isLocked: false },
                    vercel_blob_token: { isLocked: false },
                },
            },
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.find('#local_storage_dir').exists()).toBe(true)
        expect(wrapper.find('#s3_endpoint').exists()).toBe(false)

        await wrapper.get('#asset_public_base_url').setValue('https://static.example.com')
        await wrapper.get('#storage_type').setValue('s3')
        await nextTick()

        expect(settings.asset_public_base_url).toBe('https://static.example.com')
        expect(settings.storage_type).toBe('s3')
        expect(wrapper.find('#local_storage_dir').exists()).toBe(false)
        expect(wrapper.find('#s3_endpoint').exists()).toBe(true)

        await wrapper.get('#s3_endpoint').setValue('https://s3.example.com')
        await wrapper.get('#s3_bucket').setValue('momei-assets')
        await wrapper.get('#s3_region').setValue('ap-east-1')
        await wrapper.get('#s3_access_key').setValue('access-key')
        await wrapper.get('#s3_base_url').setValue('https://cdn.s3.example.com')
        await wrapper.get('#s3_bucket_prefix').setValue('blog/')

        expect(settings.s3_endpoint).toBe('https://s3.example.com')
        expect(settings.s3_bucket).toBe('momei-assets')
        expect(settings.s3_region).toBe('ap-east-1')
        expect(settings.s3_access_key).toBe('access-key')
        expect(settings.s3_base_url).toBe('https://cdn.s3.example.com')
        expect(settings.s3_bucket_prefix).toBe('blog/')
        expect((wrapper.get('#s3_secret_key').element as HTMLInputElement).disabled).toBe(true)

        await wrapper.get('#storage_type').setValue('r2')
        await nextTick()

        expect(wrapper.find('#cloudflare_r2_account_id').exists()).toBe(true)
        await wrapper.get('#cloudflare_r2_account_id').setValue('account-id')
        await wrapper.get('#cloudflare_r2_bucket').setValue('r2-bucket')
        await wrapper.get('#cloudflare_r2_access_key').setValue('r2-access')
        await wrapper.get('#cloudflare_r2_secret_key').setValue('r2-secret')
        await wrapper.get('#cloudflare_r2_base_url').setValue('https://r2.example.com')

        expect(settings.cloudflare_r2_account_id).toBe('account-id')
        expect(settings.cloudflare_r2_bucket).toBe('r2-bucket')
        expect(settings.cloudflare_r2_access_key).toBe('r2-access')
        expect(settings.cloudflare_r2_secret_key).toBe('r2-secret')
        expect(settings.cloudflare_r2_base_url).toBe('https://r2.example.com')

        await wrapper.get('#storage_type').setValue('vercel_blob')
        await nextTick()

        expect(wrapper.find('#vercel_blob_token').exists()).toBe(true)
        expect(wrapper.find('#cloudflare_r2_account_id').exists()).toBe(false)
        await wrapper.get('#vercel_blob_token').setValue('vercel-token')
        expect(settings.vercel_blob_token).toBe('vercel-token')
    })
})
