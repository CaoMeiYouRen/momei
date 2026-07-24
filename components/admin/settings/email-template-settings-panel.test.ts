import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import EmailTemplateSettingsPanel from './email-template-settings-panel.vue'
import type { EmailTemplateSettingsFormValue } from '@/utils/shared/email-template-config'

const translate = (key: string) => key

const { mockFetch, showErrorToast } = vi.hoisted(() => ({
    mockFetch: vi.fn().mockResolvedValue({
        data: {
            subject: '预览主题',
            html: '<p>墨梅博客 · 站点名称变量 · 回退自 English</p>',
        },
    }),
    showErrorToast: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: ref('zh-CN'),
        }),
    }
})

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useAppApi: () => ({
            $appFetch: mockFetch,
        }),
        useRequestFeedback: () => ({
            showErrorToast,
        }),
    }
})

vi.stubGlobal('useAppApi', () => ({
    $appFetch: mockFetch,
}))

vi.stubGlobal('useRequestFeedback', () => ({
    showErrorToast,
}))

vi.stubGlobal('useToast', () => ({
    add: vi.fn(),
}))

vi.stubGlobal('useI18n', () => ({
    t: translate,
    locale: ref('zh-CN'),
}))

describe('EmailTemplateSettingsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockResolvedValue({
            data: {
                subject: '预览主题',
                html: '<p>墨梅博客 · 站点名称变量 · 回退自 English</p>',
                text: '墨梅博客 · 站点名称变量 · 回退自 English',
                meta: {
                    locale: 'zh-CN',
                    appName: { value: '墨梅博客', source: 'db' },
                    fieldSources: {},
                },
            },
        })
    })

    it('updates model and requests preview for the selected template', async () => {
        const updates: EmailTemplateSettingsFormValue[] = []

        const wrapper = await mountSuspended(EmailTemplateSettingsPanel, {
            props: {
                modelValue: null,
                'onUpdate:modelValue': (value: unknown) => updates.push(value as EmailTemplateSettingsFormValue),
            },
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    Divider: { template: '<div><slot /></div>' },
                    Message: { template: '<div><slot /></div>' },
                    SettingFormField: { template: '<div><slot /></div>', props: ['label', 'description', 'inline'] },
                    Select: {
                        template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
                        props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
                        emits: ['update:modelValue'],
                    },
                    ToggleSwitch: {
                        template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                    LocalizedSettingEditor: {
                        template: '<button class="localized-editor" @click="$emit(\'update:modelValue\', payload)">edit</button>',
                        props: ['modelValue', 'label', 'fieldKey', 'inputId', 'description', 'multiline', 'rows'],
                        emits: ['update:modelValue'],
                        data() {
                            return {
                                payload: {
                                    version: 1,
                                    type: 'localized-text',
                                    locales: {
                                        'zh-CN': '自定义主题',
                                    },
                                    legacyValue: null,
                                },
                            }
                        },
                    },
                    Button: {
                        template: '<button class="preview-button" @click="$emit(\'click\')">{{ label }}</button>',
                        props: ['label', 'icon', 'loading'],
                        emits: ['click'],
                    },
                    Tag: {
                        template: '<span class="tag">{{ value }}</span>',
                        props: ['severity', 'value'],
                    },
                },
            },
        })

        await flushPromises()

        const editors = wrapper.findAll('.localized-editor')
        expect(editors.length).toBeGreaterThan(0)

        await editors[0]!.trigger('click')
        await flushPromises()

        const latestModelValue = (updates.at(-1) ?? null) as EmailTemplateSettingsFormValue
        await wrapper.setProps({
            modelValue: latestModelValue,
        })
        await flushPromises()

        expect(updates.at(-1)).toEqual(expect.objectContaining({
            version: 1,
            templates: expect.objectContaining({
                verification: expect.objectContaining({
                    fields: expect.objectContaining({
                        title: expect.objectContaining({
                            locales: expect.objectContaining({
                                'zh-CN': '自定义主题',
                            }),
                        }),
                    }),
                }),
            }),
        }))

        await wrapper.find('.preview-button').trigger('click')
        await flushPromises()

        expect(mockFetch).toHaveBeenCalledWith('/api/admin/settings/email-templates-preview', expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                templateId: 'verification',
                locale: 'zh-CN',
            }),
        }))
        expect(wrapper.text()).toContain('预览主题')
        expect(wrapper.text()).toContain('站点名称变量')
        expect(wrapper.text()).toContain('墨梅博客')
        expect(wrapper.text()).toContain('回退自 English')
        expect(wrapper.find('.email-template-settings-panel__preview-actions select').exists()).toBe(true)
    })

})
