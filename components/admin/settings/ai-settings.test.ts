import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AiSettings from './ai-settings.vue'
import type { AISettingsModel } from '@/types/setting'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

const metadata = new Proxy({}, {
    get: () => ({ isLocked: false }),
})

const stubs = {
    SettingFormField: { template: '<div class="setting-form-field"><slot /></div>', props: ['fieldKey', 'inputId', 'metadata', 'description', 'inline', 'label'] },
    ToggleSwitch: { template: '<input :id="id" class="toggle-switch" type="checkbox" :checked="modelValue" />', props: ['id', 'modelValue', 'disabled'] },
    Select: { template: '<select :id="id" class="select" />', props: ['id', 'modelValue', 'options', 'disabled', 'fluid'] },
    InputText: { template: '<input :id="id" :value="modelValue" />', props: ['id', 'modelValue', 'disabled', 'fluid'] },
    Password: { template: '<input :id="id" class="password" :value="modelValue" />', props: ['id', 'modelValue', 'disabled', 'toggleMask', 'fluid'] },
    Divider: { template: '<div class="divider" />' },
    AiQuotaPoliciesEditor: { template: '<div class="ai-quota-policies-editor" />', props: ['modelValue', 'metadata'] },
    AiAlertThresholdsEditor: { template: '<div class="ai-alert-thresholds-editor" />', props: ['modelValue', 'metadata'] },
    AiCostFactorsEditor: { template: '<div class="ai-cost-factors-editor" />', props: ['modelValue', 'metadata'] },
    AiQuotaUsagePreview: { template: '<div class="ai-quota-usage-preview" />', props: ['settings'] },
}

describe('AiSettings', () => {
    it('renders provider-specific and feature-specific sections when toggles are enabled', () => {
        const settings = reactive<AISettingsModel>({
            ai_enabled: true,
            ai_provider: 'google',
            ai_model: 'gemini-2.5-pro',
            ai_api_key: 'secret',
            ai_endpoint: 'https://api.example.com/ai',
            gemini_api_token: 'gemini-token',
            ai_quota_enabled: true,
            ai_quota_policies: '[{"role":"user","limit":100}]',
            ai_alert_thresholds: '{"daily":80}',
            ai_cost_factors: '{"tts":1.2}',
            ai_image_enabled: true,
            ai_image_provider: 'gemini',
            ai_image_model: 'imagen-4',
            ai_image_api_key: 'image-secret',
            ai_image_endpoint: 'https://api.example.com/image',
            asr_enabled: true,
            asr_provider: 'volcengine',
            asr_api_key: 'asr-secret',
            asr_model: 'asr-model',
            asr_endpoint: 'https://api.example.com/asr',
            asr_credential_ttl_seconds: '900',
            asr_volcengine_cluster_id: 'volc',
            volcengine_app_id: '123456',
            volcengine_access_key: 'access-key',
            volcengine_secret_key: 'secret-key',
            tts_enabled: true,
            tts_provider: 'volcengine',
            tts_api_key: 'tts-secret',
            tts_model: 'tts-model',
            tts_endpoint: 'https://api.example.com/tts',
        })

        const wrapper = mount(AiSettings, {
            props: {
                metadata,
                settings,
                'onUpdate:settings': (value: unknown) => value,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs,
            },
        })

        expect(wrapper.find('#ai_provider').exists()).toBe(true)
        expect(wrapper.find('#gemini_api_token').exists()).toBe(true)
        expect(wrapper.find('.ai-quota-policies-editor').exists()).toBe(true)
        expect(wrapper.find('.ai-alert-thresholds-editor').exists()).toBe(true)
        expect(wrapper.find('.ai-cost-factors-editor').exists()).toBe(true)
        expect(wrapper.find('#ai_image_provider').exists()).toBe(true)
        expect(wrapper.find('#asr_credential_ttl_seconds').exists()).toBe(true)
    })
})
