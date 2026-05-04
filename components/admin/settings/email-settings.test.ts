import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EmailSettings from './email-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata', 'description'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    EmailTemplateSettingsPanel: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<button class="template-configs" type="button" @click="$emit(\'update:modelValue\', { welcome: { subject: \'Hello\' } })">update templates</button>',
    },
    InputText: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    InputNumber: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
    },
    Password: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" type="password" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    Divider: { template: '<hr>' },
}

describe('EmailSettings', () => {
    it('renders email fields, updates the model, and respects locked metadata', async () => {
        const settings = reactive({
            email_host: 'smtp.example.com',
            email_port: 465,
            email_user: 'mailer',
            email_pass: 'secret',
            email_from: 'noreply@example.com',
            email_daily_limit: 1000,
            email_single_user_daily_limit: 10,
            email_limit_window: '24h',
            email_template_configs: {},
        })

        const wrapper = await mountSuspended(EmailSettings, {
            props: {
                settings,
                metadata: {
                    email_host: { isLocked: false },
                    email_port: { isLocked: false },
                    email_user: { isLocked: false },
                    email_pass: { isLocked: false },
                    email_from: { isLocked: false },
                    email_daily_limit: { isLocked: false },
                    email_single_user_daily_limit: { isLocked: true },
                    email_limit_window: { isLocked: false },
                },
            },
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        await wrapper.get('#email_host').setValue('smtp.mail.test')
        await wrapper.get('#email_port').setValue('587')
        await wrapper.get('#email_user').setValue('mailer2')
        await wrapper.get('#email_pass').setValue('top-secret')
        await wrapper.get('#email_from').setValue('team@example.com')
        await wrapper.get('#email_daily_limit').setValue('2000')
        await wrapper.get('#email_limit_window').setValue('48h')
        await wrapper.get('.template-configs').trigger('click')

        expect(settings.email_host).toBe('smtp.mail.test')
        expect(settings.email_port).toBe(587)
        expect(settings.email_user).toBe('mailer2')
        expect(settings.email_pass).toBe('top-secret')
        expect(settings.email_from).toBe('team@example.com')
        expect(settings.email_daily_limit).toBe(2000)
        expect(settings.email_limit_window).toBe('48h')
        expect(settings.email_template_configs).toEqual({ welcome: { subject: 'Hello' } })
        expect((wrapper.get('#email_single_user_daily_limit').element as HTMLInputElement).disabled).toBe(true)
        expect(wrapper.findAll('.setting-field')).toHaveLength(8)
    })
})
