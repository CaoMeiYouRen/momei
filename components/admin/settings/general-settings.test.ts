import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GeneralSettings from './general-settings.vue'
import type { GeneralSettingsModel, LocalizedSettingValueV1 } from '@/types/setting'

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
    LocalizedSettingEditor: {
        template: '<div class="localized-editor-stub" :data-field-key="fieldKey">{{ fieldKey }}</div>',
        props: ['modelValue', 'fieldKey', 'inputId', 'metadata', 'description', 'multiline', 'rows', 'stringList'],
    },
    SettingFormField: {
        template: '<div class="setting-form-field-stub" :data-field-key="fieldKey"><slot /></div>',
        props: ['fieldKey', 'inputId', 'metadata', 'description', 'inline'],
    },
    InputText: {
        template: `<input :id="id" class="input-text-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'disabled', 'placeholder', 'fluid'],
        emits: ['update:modelValue'],
    },
    Textarea: {
        template: `<textarea :id="id" class="textarea-stub" :value="modelValue ?? ''" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'disabled', 'placeholder', 'rows', 'fluid'],
        emits: ['update:modelValue'],
    },
    ToggleSwitch: {
        template: '<input :id="id" class="toggle-switch-stub" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
    },
    Select: {
        template: `
            <select :id="id" class="select-stub" :value="modelValue ?? ''" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
                <option
                    v-for="option in options"
                    :key="typeof option === 'string' ? option : option[optionValue || 'value']"
                    :value="typeof option === 'string' ? option : option[optionValue || 'value']"
                >
                    {{ typeof option === 'string' ? option : option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
        props: ['id', 'modelValue', 'options', 'disabled', 'optionLabel', 'optionValue', 'fluid'],
        emits: ['update:modelValue'],
    },
    InputNumber: {
        template: '<input :id="id" class="input-number-stub" type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
        props: ['id', 'modelValue', 'disabled', 'min', 'max', 'step', 'fluid'],
        emits: ['update:modelValue'],
    },
    Divider: {
        template: '<div class="divider-stub"><slot /></div>',
        props: ['align'],
    },
    AppUploader: {
        template: '<button :id="id" class="uploader-stub" type="button" :disabled="disabled" @click="$emit(\'update:modelValue\', id === \'site_logo\' ? \'/logo-next.svg\' : \'/favicon-next.ico\')">{{ modelValue }}</button>',
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
    },
    Image: {
        template: '<img class="image-stub" :src="src" :width="width" />',
        props: ['src', 'width', 'preview', 'class'],
    },
}

function createSettings(): GeneralSettingsModel {
    const localizedText = (zhCn: string, enUs: string): LocalizedSettingValueV1<string> => ({
        version: 1,
        type: 'localized-text',
        locales: { 'zh-CN': zhCn, 'en-US': enUs },
    })
    const localizedList = (zhCn: string[], enUs: string[]): LocalizedSettingValueV1<string[]> => ({
        version: 1,
        type: 'localized-string-list',
        locales: { 'zh-CN': zhCn, 'en-US': enUs },
    })

    return reactive<GeneralSettingsModel>({
        site_title: localizedText('墨梅', 'Momei'),
        site_name: 'Momei Blog',
        site_description: localizedText('中文描述', 'English description'),
        site_keywords: localizedList(['技术'], ['tech']),
        post_copyright: 'cc-by-nc-sa-4.0',
        site_copyright_owner: localizedText('墨梅', 'Momei'),
        site_copyright_start_year: '2024',
        default_language: 'zh-CN',
        site_logo: '/logo.png',
        site_favicon: '/favicon.png',
        site_operator: localizedText('站长', 'Owner'),
        contact_email: 'owner@example.com',
        feedback_url: 'https://example.com/feedback',
        show_compliance_info: true,
        icp_license_number: 'ICP-123456',
        public_security_number: '公网安备 123456',
        footer_code: '<script>footer</script>',
        friend_links_enabled: true,
        friend_links_application_enabled: true,
        friend_links_footer_enabled: true,
        friend_links_footer_limit: 8,
        friend_links_application_guidelines: localizedText('指引', 'Guideline'),
        friend_links_check_interval_minutes: '1d',
        travellings_enabled: true,
        travellings_header_enabled: true,
        travellings_footer_enabled: true,
        travellings_sidebar_enabled: true,
        live2d_enabled: true,
        live2d_script_url: 'https://cdn.example.com/live2d.js',
        live2d_model_url: 'https://cdn.example.com/model.json',
        live2d_options_json: '{"dock":"right"}',
        live2d_mobile_enabled: true,
        live2d_min_width: 960,
        live2d_data_saver_block: true,
        canvas_nest_enabled: true,
        canvas_nest_options_json: '{"pointColor":"#fff"}',
        canvas_nest_mobile_enabled: true,
        canvas_nest_min_width: 820,
        canvas_nest_data_saver_block: true,
        effects_mobile_enabled: true,
        effects_min_width: 768,
        effects_data_saver_block: true,
    })
}

describe('GeneralSettings', () => {
    it('renders and updates branding, footer and effect sections when related settings are enabled', async () => {
        const settings = createSettings()

        const wrapper = mount(GeneralSettings, {
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

        expect(wrapper.find('#site_name').exists()).toBe(true)
        expect(wrapper.findAll('.image-stub')).toHaveLength(2)
        expect(wrapper.find('#friend_links_footer_limit').exists()).toBe(true)
        expect(wrapper.find('#travellings_sidebar_enabled').exists()).toBe(true)
        expect(wrapper.find('#live2d_script_url').exists()).toBe(true)
        expect(wrapper.find('#canvas_nest_options_json').exists()).toBe(true)
        expect(wrapper.find('#effects_min_width').exists()).toBe(true)

        await wrapper.get('#site_name').setValue('Momei Next')
        await wrapper.get('#default_language').setValue('en-US')
        await wrapper.get('#site_logo').trigger('click')
        await wrapper.get('#site_favicon').trigger('click')
        await wrapper.get('#contact_email').setValue('next@example.com')
        await wrapper.get('#feedback_url').setValue('https://example.com/next-feedback')
        await wrapper.get('#show_compliance_info').setValue(false)
        await wrapper.get('#icp_license_number').setValue('ICP-654321')
        await wrapper.get('#public_security_number').setValue('公网安备 654321')
        await wrapper.get('#footer_code').setValue('<script>next-footer</script>')
        await wrapper.get('#friend_links_application_enabled').setValue(false)
        await wrapper.get('#friend_links_footer_enabled').setValue(false)
        await wrapper.get('#friend_links_footer_limit').setValue('12')
        await wrapper.get('#friend_links_check_interval_minutes').setValue('2h')
        await wrapper.get('#travellings_header_enabled').setValue(false)
        await wrapper.get('#travellings_footer_enabled').setValue(false)
        await wrapper.get('#travellings_sidebar_enabled').setValue(false)
        await wrapper.get('#live2d_script_url').setValue('https://cdn.example.com/live2d-next.js')
        await wrapper.get('#live2d_model_url').setValue('https://cdn.example.com/model-next.json')
        await wrapper.get('#live2d_options_json').setValue('{"dock":"left"}')
        await wrapper.get('#live2d_mobile_enabled').setValue(false)
        await wrapper.get('#live2d_min_width').setValue('1280')
        await wrapper.get('#live2d_data_saver_block').setValue(false)
        await wrapper.get('#canvas_nest_options_json').setValue('{"pointColor":"#000"}')
        await wrapper.get('#canvas_nest_mobile_enabled').setValue(false)
        await wrapper.get('#canvas_nest_min_width').setValue('960')
        await wrapper.get('#canvas_nest_data_saver_block').setValue(false)
        await wrapper.get('#effects_mobile_enabled').setValue(false)
        await wrapper.get('#effects_min_width').setValue('1440')
        await wrapper.get('#effects_data_saver_block').setValue(false)

        expect(settings.site_name).toBe('Momei Next')
        expect(settings.default_language).toBe('en-US')
        expect(settings.site_logo).toBe('/logo-next.svg')
        expect(settings.site_favicon).toBe('/favicon-next.ico')
        expect(settings.contact_email).toBe('next@example.com')
        expect(settings.feedback_url).toBe('https://example.com/next-feedback')
        expect(settings.show_compliance_info).toBe(false)
        expect(settings.icp_license_number).toBe('ICP-654321')
        expect(settings.public_security_number).toBe('公网安备 654321')
        expect(settings.footer_code).toBe('<script>next-footer</script>')
        expect(settings.friend_links_application_enabled).toBe(false)
        expect(settings.friend_links_footer_enabled).toBe(false)
        expect(settings.friend_links_footer_limit).toBe(12)
        expect(settings.friend_links_check_interval_minutes).toBe('2h')
        expect(settings.travellings_header_enabled).toBe(false)
        expect(settings.travellings_footer_enabled).toBe(false)
        expect(settings.travellings_sidebar_enabled).toBe(false)
        expect(settings.live2d_script_url).toBe('https://cdn.example.com/live2d-next.js')
        expect(settings.live2d_model_url).toBe('https://cdn.example.com/model-next.json')
        expect(settings.live2d_options_json).toBe('{"dock":"left"}')
        expect(settings.live2d_mobile_enabled).toBe(false)
        expect(settings.live2d_min_width).toBe(1280)
        expect(settings.live2d_data_saver_block).toBe(false)
        expect(settings.canvas_nest_options_json).toBe('{"pointColor":"#000"}')
        expect(settings.canvas_nest_mobile_enabled).toBe(false)
        expect(settings.canvas_nest_min_width).toBe(960)
        expect(settings.canvas_nest_data_saver_block).toBe(false)
        expect(settings.effects_mobile_enabled).toBe(false)
        expect(settings.effects_min_width).toBe(1440)
        expect(settings.effects_data_saver_block).toBe(false)

        await wrapper.get('#friend_links_enabled').setValue(false)
        await wrapper.get('#travellings_enabled').setValue(false)
        await wrapper.get('#live2d_enabled').setValue(false)
        await wrapper.get('#canvas_nest_enabled').setValue(false)

        expect(settings.friend_links_enabled).toBe(false)
        expect(settings.travellings_enabled).toBe(false)
        expect(settings.live2d_enabled).toBe(false)
        expect(settings.canvas_nest_enabled).toBe(false)
        expect(wrapper.find('#friend_links_footer_limit').exists()).toBe(false)
        expect(wrapper.find('#travellings_sidebar_enabled').exists()).toBe(false)
        expect(wrapper.find('#live2d_script_url').exists()).toBe(false)
        expect(wrapper.find('#canvas_nest_options_json').exists()).toBe(false)
    })
})
