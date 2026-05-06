import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AiSettings from './ai-settings.vue'
import type { AISettingsFields, AISettingsMetadata, AISettingsModel } from '@/types/setting'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

const stubs = {
    SettingFormField: { template: '<div class="setting-form-field"><slot /></div>', props: ['fieldKey', 'inputId', 'metadata', 'description', 'inline', 'label'] },
    ToggleSwitch: { template: '<input :id="id" class="toggle-switch" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['id', 'modelValue', 'disabled'], emits: ['update:modelValue'] },
    Select: {
        template: `
            <select :id="id" class="select" :value="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
                <option
                    v-for="option in options"
                    :key="typeof option === 'string' ? option : option[optionValue || 'value']"
                    :value="typeof option === 'string' ? option : option[optionValue || 'value']"
                >
                    {{ typeof option === 'string' ? option : option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
        props: ['id', 'modelValue', 'options', 'disabled', 'fluid', 'optionLabel', 'optionValue'],
        emits: ['update:modelValue'],
    },
    InputText: { template: '<input :id="id" :value="modelValue" :disabled="disabled" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'disabled', 'fluid', 'placeholder'], emits: ['update:modelValue'] },
    Password: { template: '<input :id="id" class="password" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'disabled', 'toggleMask', 'fluid'], emits: ['update:modelValue'] },
    Divider: { template: '<div class="divider" />' },
    AiQuotaPoliciesEditor: { template: '<div class="ai-quota-policies-editor" />', props: ['modelValue', 'metadata'] },
    AiAlertThresholdsEditor: { template: '<div class="ai-alert-thresholds-editor" />', props: ['modelValue', 'metadata'] },
    AiCostFactorsEditor: { template: '<div class="ai-cost-factors-editor" />', props: ['modelValue', 'metadata'] },
    AiQuotaUsagePreview: { template: '<div class="ai-quota-usage-preview" />', props: ['settings'] },
}

const defaultSettings: AISettingsModel = {
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
}

function createMetadata(lockedKeys: string[] = []) {
    const lockedKeySet = new Set(lockedKeys)

    return new Proxy({}, {
        get: (_, key) => ({
            isLocked: typeof key === 'string' && lockedKeySet.has(key),
        }),
    }) as AISettingsMetadata
}

function createSettings(overrides: Partial<AISettingsFields> = {}) {
    const settings = reactive<AISettingsModel>({
        ...defaultSettings,
    })

    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            settings[key] = value
        }
    }

    return settings
}

function mountComponent(settings: AISettingsModel, lockedKeys: string[] = []) {
    return mount(AiSettings, {
        props: {
            metadata: createMetadata(lockedKeys),
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
}

describe('AiSettings', () => {
    it('renders provider-specific and feature-specific sections when toggles are enabled', async () => {
        const settings = createSettings()
        const wrapper = mountComponent(settings)

        expect(wrapper.find('#ai_provider').exists()).toBe(true)
        expect(wrapper.find('#gemini_api_token').exists()).toBe(true)
        expect(wrapper.find('.ai-settings__hint').exists()).toBe(true)
        expect(wrapper.find('.ai-quota-policies-editor').exists()).toBe(true)
        expect(wrapper.find('.ai-alert-thresholds-editor').exists()).toBe(true)
        expect(wrapper.find('.ai-cost-factors-editor').exists()).toBe(true)
        expect(wrapper.find('#ai_image_provider').exists()).toBe(true)
        expect(wrapper.find('#asr_credential_ttl_seconds').exists()).toBe(true)
        expect(wrapper.find('#asr_volcengine_cluster_id').exists()).toBe(true)
        expect(wrapper.find('#volcengine_app_id').exists()).toBe(true)
        expect(wrapper.find('#tts_api_key').exists()).toBe(false)
        expect(wrapper.find('#tts_endpoint').exists()).toBe(false)

        await wrapper.get('#asr_model').setValue('volc.seedasr.next')
        await wrapper.get('#asr_endpoint').setValue('https://api.example.com/asr-next')
        await wrapper.get('#asr_volcengine_cluster_id').setValue('volc-next')
        await wrapper.get('#volcengine_app_id').setValue('654321')
        await wrapper.get('#ai_image_api_key').setValue('image-secret-next')
        await wrapper.get('#ai_image_endpoint').setValue('https://api.example.com/image-next')
        await wrapper.get('#asr_credential_ttl_seconds').setValue('15m')

        expect((wrapper.get('#asr_model').element as HTMLInputElement).value).toBe('volc.seedasr.next')
        expect(settings.ai_image_api_key).toBe('image-secret-next')
        expect(settings.ai_image_endpoint).toBe('https://api.example.com/image-next')
        expect(settings.asr_model).toBe('volc.seedasr.next')
        expect(settings.asr_endpoint).toBe('https://api.example.com/asr-next')
        expect(settings.asr_credential_ttl_seconds).toBe('15m')
        expect(settings.asr_volcengine_cluster_id).toBe('volc-next')
        expect(settings.volcengine_app_id).toBe('654321')

        await wrapper.get('#asr_enabled').setValue(false)

        expect(settings.asr_enabled).toBe(false)
        expect(wrapper.find('#asr_provider').exists()).toBe(false)
    })

    it('renders siliconflow asr and standard tts providers without unrelated sections', async () => {
        const settings = createSettings({
            ai_provider: 'openai',
            ai_image_provider: 'openai',
            gemini_api_token: '',
            ai_quota_enabled: false,
            ai_image_enabled: false,
            asr_provider: 'siliconflow',
            tts_provider: 'openai',
        })
        const wrapper = mountComponent(settings)

        expect(wrapper.find('#gemini_api_token').exists()).toBe(false)
        expect(wrapper.find('.ai-settings__hint').exists()).toBe(false)
        expect(wrapper.find('.ai-quota-policies-editor').exists()).toBe(false)
        expect(wrapper.find('#ai_image_provider').exists()).toBe(false)
        expect(wrapper.find('#asr_api_key').exists()).toBe(true)
        expect(wrapper.get('#asr_model').attributes('placeholder')).toBe('FunAudioLLM/SenseVoiceSmall')
        expect(wrapper.find('#asr_volcengine_cluster_id').exists()).toBe(false)
        expect(wrapper.find('#volcengine_app_id').exists()).toBe(false)
        expect(wrapper.find('#tts_api_key').exists()).toBe(true)
        expect(wrapper.find('#tts_endpoint').exists()).toBe(true)

        await wrapper.get('#asr_provider').setValue('siliconflow')
        await wrapper.get('#asr_api_key').setValue('siliconflow-secret')
        await wrapper.get('#asr_model').setValue('FunAudioLLM/SenseVoiceLarge')
        await wrapper.get('#asr_endpoint').setValue('https://api.example.com/siliconflow-asr')
        await wrapper.get('#tts_api_key').setValue('updated-tts-secret')
        await wrapper.get('#tts_model').setValue('gpt-4.1-mini-tts')
        await wrapper.get('#tts_endpoint').setValue('https://api.example.com/tts-next')
        await wrapper.get('#tts_provider').setValue('siliconflow')
        await wrapper.get('#tts_enabled').setValue(false)

        expect(settings.asr_provider).toBe('siliconflow')
        expect(settings.asr_api_key).toBe('siliconflow-secret')
        expect(settings.asr_model).toBe('FunAudioLLM/SenseVoiceLarge')
        expect(settings.asr_endpoint).toBe('https://api.example.com/siliconflow-asr')
        expect(settings.tts_api_key).toBe('updated-tts-secret')
        expect(settings.tts_model).toBe('gpt-4.1-mini-tts')
        expect(settings.tts_endpoint).toBe('https://api.example.com/tts-next')
        expect(settings.tts_provider).toBe('siliconflow')
        expect(settings.tts_enabled).toBe(false)
        expect(wrapper.find('#tts_api_key').exists()).toBe(false)
    })

    it('renders volcengine shared credentials for tts-only configuration and respects locks', async () => {
        const settings = createSettings({
            ai_provider: 'openai',
            ai_image_enabled: false,
            asr_enabled: false,
            tts_provider: 'volcengine',
        })
        const wrapper = mountComponent(settings, ['volcengine_app_id'])

        expect(wrapper.find('#asr_credential_ttl_seconds').exists()).toBe(false)
        expect(wrapper.find('#tts_api_key').exists()).toBe(false)
        expect(wrapper.find('#tts_endpoint').exists()).toBe(false)
        expect(wrapper.find('#volcengine_app_id').exists()).toBe(true)
        expect(wrapper.find('#volcengine_access_key').exists()).toBe(true)
        expect(wrapper.find('#volcengine_secret_key').exists()).toBe(true)
        expect(wrapper.get('#volcengine_app_id').attributes('disabled')).toBeDefined()

        await wrapper.get('#tts_model').setValue('volcengine-v3')
        await wrapper.get('#volcengine_access_key').setValue('volc-ak-next')
        await wrapper.get('#volcengine_secret_key').setValue('volc-sk-next')

        expect(settings.tts_model).toBe('volcengine-v3')
        expect(settings.volcengine_access_key).toBe('volc-ak-next')
        expect(settings.volcengine_secret_key).toBe('volc-sk-next')
    })
})
