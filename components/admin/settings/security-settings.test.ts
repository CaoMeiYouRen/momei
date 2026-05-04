import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SecuritySettings from './security-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata', 'inline'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    ToggleSwitch: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" class="toggle-switch" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)">',
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
    Textarea: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<textarea :id="id" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Divider: { template: '<hr>' },
}

describe('SecuritySettings', () => {
    it('toggles captcha fields, updates the settings model, and respects locked fields', async () => {
        const settings = reactive({
            allow_registration: true,
            enable_captcha: false,
            captcha_provider: 'turnstile',
            captcha_site_key: '',
            captcha_secret_key: '',
            enable_comment_review: true,
            blacklisted_keywords: '',
        })

        const wrapper = await mountSuspended(SecuritySettings, {
            props: {
                settings,
                metadata: {
                    allow_registration: { isLocked: false },
                    enable_captcha: { isLocked: false },
                    captcha_provider: { isLocked: false },
                    captcha_site_key: { isLocked: false },
                    captcha_secret_key: { isLocked: false },
                    enable_comment_review: { isLocked: true },
                    blacklisted_keywords: { isLocked: false },
                },
            },
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        expect(wrapper.find('#captcha_provider').exists()).toBe(false)

        await wrapper.get('#allow_registration').setValue(false)
        await wrapper.get('#enable_captcha').setValue(true)
        await nextTick()

        expect(settings.allow_registration).toBe(false)
        expect(settings.enable_captcha).toBe(true)
        expect(wrapper.find('#captcha_provider').exists()).toBe(true)

        await wrapper.get('#captcha_provider').setValue('hcaptcha')
        await wrapper.get('#captcha_site_key').setValue('site-key')
        await wrapper.get('#captcha_secret_key').setValue('secret-key')
        await wrapper.get('#blacklisted_keywords').setValue('spam, scam')

        expect(settings.captcha_provider).toBe('hcaptcha')
        expect(settings.captcha_site_key).toBe('site-key')
        expect(settings.captcha_secret_key).toBe('secret-key')
        expect(settings.blacklisted_keywords).toBe('spam, scam')
        expect((wrapper.get('#enable_comment_review').element as HTMLInputElement).disabled).toBe(true)
    })
})
