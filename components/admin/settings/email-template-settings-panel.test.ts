import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import EmailTemplateSettingsPanel from './email-template-settings-panel.vue'
import type { EmailTemplateSettingsFormValue } from '@/utils/shared/email-template-config'

const translations: Record<string, string> = {
    'pages.admin.settings.system.email_templates.title': '邮件模板',
    'pages.admin.settings.system.email_templates.description': '邮件模板说明',
    'pages.admin.settings.system.email_templates.selector_label': '模板类型',
    'pages.admin.settings.system.email_templates.selector_hint': '选择模板',
    'pages.admin.settings.system.email_templates.preview_locale_label': '预览语种',
    'pages.admin.settings.system.email_templates.preview_locale_hint': '选择语种',
    'pages.admin.settings.system.email_templates.custom_enabled': '启用自定义文案',
    'pages.admin.settings.system.email_templates.custom_enabled_hint': '启用后覆盖默认值',
    'pages.admin.settings.system.email_templates.variables_title': '可用变量',
    'pages.admin.settings.system.email_templates.no_variables': '没有变量',
    'pages.admin.settings.system.email_templates.preview_action': '生成预览',
    'pages.admin.settings.system.email_templates.preview_subject': '邮件主题',
    'pages.admin.settings.system.email_templates.preview_text': '查看纯文本版本',
    'pages.admin.settings.system.email_templates.preview_app_name': '站点名称变量',
    'pages.admin.settings.system.email_templates.preview_source_fallback': '回退自 {locale}',
    'pages.admin.settings.system.email_templates.preview_source_legacy': '回退自 legacy 值',
    'pages.admin.settings.system.email_templates.fields.title': '主题',
    'pages.admin.settings.system.email_templates.fields.preheader': '预览摘要',
    'pages.admin.settings.system.email_templates.fields.message': '正文主文案',
    'pages.admin.settings.system.email_templates.fields.buttonText': '按钮文案',
    'pages.admin.settings.system.email_templates.fields.reminderContent': '提醒说明',
    'pages.admin.settings.system.email_templates.fields.securityTip': '安全提示',
    'pages.admin.settings.system.email_templates.field_hints.title': 'hint',
    'pages.admin.settings.system.email_templates.field_hints.preheader': 'hint',
    'pages.admin.settings.system.email_templates.field_hints.message': 'hint',
    'pages.admin.settings.system.email_templates.field_hints.buttonText': 'hint',
    'pages.admin.settings.system.email_templates.field_hints.reminderContent': 'hint',
    'pages.admin.settings.system.email_templates.field_hints.securityTip': 'hint',
    'pages.admin.settings.system.email_templates.variables.appName': '站点名',
    'pages.admin.settings.system.email_templates.variables.expiresIn': '有效期',
    'pages.admin.settings.system.email_templates.catalog.verification.label': '邮箱验证链接',
    'pages.admin.settings.system.email_templates.catalog.verification.description': '发送验证链接',
    'pages.admin.settings.system.email_templates.catalog.passwordReset.label': '密码重置链接',
    'pages.admin.settings.system.email_templates.catalog.passwordReset.description': '重置密码',
    'pages.admin.settings.system.email_templates.catalog.loginOTP.label': '登录验证码',
    'pages.admin.settings.system.email_templates.catalog.loginOTP.description': '登录验证码',
    'pages.admin.settings.system.email_templates.catalog.emailVerificationOTP.label': '邮箱验证验证码',
    'pages.admin.settings.system.email_templates.catalog.emailVerificationOTP.description': '邮箱验证验证码',
    'pages.admin.settings.system.email_templates.catalog.passwordResetOTP.label': '密码重置验证码',
    'pages.admin.settings.system.email_templates.catalog.passwordResetOTP.description': '密码重置验证码',
    'pages.admin.settings.system.email_templates.catalog.magicLink.label': '无密码登录链接',
    'pages.admin.settings.system.email_templates.catalog.magicLink.description': '无密码登录链接',
    'pages.admin.settings.system.email_templates.catalog.emailChangeVerification.label': '邮箱变更确认',
    'pages.admin.settings.system.email_templates.catalog.emailChangeVerification.description': '邮箱变更确认',
    'pages.admin.settings.system.email_templates.catalog.securityNotification.label': '安全通知',
    'pages.admin.settings.system.email_templates.catalog.securityNotification.description': '安全通知',
    'pages.admin.settings.system.email_templates.catalog.subscriptionConfirmation.label': '订阅确认',
    'pages.admin.settings.system.email_templates.catalog.subscriptionConfirmation.description': '订阅确认',
    'pages.admin.settings.system.email_templates.catalog.marketingCampaign.label': '营销/文章分发',
    'pages.admin.settings.system.email_templates.catalog.marketingCampaign.description': '营销/文章分发',
    'pages.admin.settings.system.source_badges.db': '数据库生效',
    'pages.admin.settings.system.source_badges.default': '默认值生效',
    'pages.admin.settings.system.source_badges.env': '环境变量生效',
}

function translate(key: string) {
    return translations[key] || key
}

const mockFetch = vi.fn().mockResolvedValue({
    data: {
        subject: '预览主题',
        html: '<section>preview html</section>',
        text: 'preview text',
        meta: {
            locale: 'zh-CN',
            appName: {
                value: '墨梅博客',
                source: 'db',
            },
            fieldSources: {
                title: { source: 'db', resolvedLocale: 'en-US', usedFallback: true },
                preheader: { source: 'default', resolvedLocale: null, usedFallback: false },
                message: { source: 'default', resolvedLocale: null, usedFallback: false },
                buttonText: { source: 'default', resolvedLocale: null, usedFallback: false },
                reminderContent: { source: 'default', resolvedLocale: null, usedFallback: false },
                securityTip: { source: 'default', resolvedLocale: null, usedFallback: false },
            },
        },
    },
})

const showErrorToast = vi.fn()

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

vi.stubGlobal('$fetch', mockFetch)

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
        vi.stubGlobal('$fetch', mockFetch)
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
        expect(wrapper.text()).toContain('回退自 en-US')
    })
})
