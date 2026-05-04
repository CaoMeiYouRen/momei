import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AuthSettings from './auth-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
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
    Divider: { template: '<hr>' },
}

describe('AuthSettings', () => {
    it('renders oauth fields, updates the settings model, and respects locked metadata', async () => {
        const settings = {
            github_client_id: 'gh-id',
            github_client_secret: 'gh-secret',
            google_client_id: 'google-id',
            google_client_secret: 'google-secret',
        }

        const wrapper = await mountSuspended(AuthSettings, {
            props: {
                settings,
                metadata: {
                    github_client_id: { isLocked: false },
                    github_client_secret: { isLocked: false },
                    google_client_id: { isLocked: false },
                    google_client_secret: { isLocked: true },
                },
            },
            global: {
                stubs,
            },
        })

        await wrapper.get('#github_client_id').setValue('new-gh-id')
        await wrapper.get('#github_client_secret').setValue('new-gh-secret')
        await wrapper.get('#google_client_id').setValue('new-google-id')

        expect(settings.github_client_id).toBe('new-gh-id')
        expect(settings.github_client_secret).toBe('new-gh-secret')
        expect(settings.google_client_id).toBe('new-google-id')
        expect((wrapper.get('#google_client_secret').element as HTMLInputElement).disabled).toBe(true)
        expect(wrapper.findAll('.setting-field')).toHaveLength(4)
    })
})
