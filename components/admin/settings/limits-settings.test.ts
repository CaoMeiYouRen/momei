import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LimitsSettings from './limits-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata', 'description'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    InputNumber: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
    },
    InputText: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
}

describe('LimitsSettings', () => {
    it('renders all limit fields, updates the model, and respects locked metadata', async () => {
        const settings = reactive({
            posts_per_page: 10,
            max_upload_size: '10MB',
            max_audio_upload_size: '50MB',
            allowed_file_types: 'jpg,png',
            comment_interval: '30s',
            upload_daily_limit: 100,
            upload_single_user_daily_limit: 10,
            upload_limit_window: '24h',
        })

        const wrapper = await mountSuspended(LimitsSettings, {
            props: {
                settings,
                metadata: {
                    posts_per_page: { isLocked: false },
                    max_upload_size: { isLocked: false },
                    max_audio_upload_size: { isLocked: false },
                    allowed_file_types: { isLocked: false },
                    comment_interval: { isLocked: false },
                    upload_daily_limit: { isLocked: false },
                    upload_single_user_daily_limit: { isLocked: true },
                    upload_limit_window: { isLocked: false },
                },
            },
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.get('#posts_per_page').setValue('20')
        await wrapper.get('#max_upload_size').setValue('20MB')
        await wrapper.get('#max_audio_upload_size').setValue('80MB')
        await wrapper.get('#allowed_file_types').setValue('jpg,png,webp')
        await wrapper.get('#comment_interval').setValue('60s')
        await wrapper.get('#upload_daily_limit').setValue('200')
        await wrapper.get('#upload_limit_window').setValue('48h')

        expect(settings.posts_per_page).toBe(20)
        expect(settings.max_upload_size).toBe('20MB')
        expect(settings.max_audio_upload_size).toBe('80MB')
        expect(settings.allowed_file_types).toBe('jpg,png,webp')
        expect(settings.comment_interval).toBe('60s')
        expect(settings.upload_daily_limit).toBe(200)
        expect(settings.upload_limit_window).toBe('48h')
        expect((wrapper.get('#upload_single_user_daily_limit').element as HTMLInputElement).disabled).toBe(true)
        expect(wrapper.findAll('.setting-field')).toHaveLength(8)
    })
})