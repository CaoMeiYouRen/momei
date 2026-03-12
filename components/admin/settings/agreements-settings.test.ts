import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AgreementsSettings from './agreements-settings.vue'

const translations: Record<string, string> = {
    'pages.admin.settings.system.agreements.title': '协议管理',
    'pages.admin.settings.system.agreements.description': '协议治理说明',
    'pages.admin.settings.system.agreements.user_agreement': '用户协议',
    'pages.admin.settings.system.agreements.privacy_policy': '隐私政策',
    'pages.admin.settings.system.agreements.main_language': '权威语言',
    'pages.admin.settings.system.agreements.active_authoritative': '当前生效版本',
    'pages.admin.settings.system.agreements.language': '语言',
    'pages.admin.settings.system.agreements.version': '版本号',
    'pages.admin.settings.system.agreements.version_description': '版本说明',
    'pages.admin.settings.system.agreements.content': '协议内容',
    'pages.admin.settings.system.agreements.language_help': '权威语言版本可直接生效；其他语言会作为参考翻译展示。',
    'pages.admin.settings.system.agreements.source_version': '对应权威版本',
    'pages.admin.settings.system.agreements.source_version_placeholder': '选择该翻译对应的权威版本',
    'pages.admin.settings.system.agreements.source_version_help': '参考翻译会跟随这里选中的权威版本一起展示。',
    'pages.admin.settings.system.agreements.authoritative_help': '当前语言等于权威语言，保存后可在列表中手动切换为生效版本。',
    'pages.admin.settings.system.agreements.edit': '编辑协议',
    'pages.admin.settings.system.agreements.create': '创建新协议',
    'common.add': '新增',
    'common.refresh': '刷新',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.languages.zh-CN': '简体中文',
    'common.languages.en-US': 'English',
}

function translate(key: string) {
    return translations[key] || key
}

const mockToast = {
    add: vi.fn(),
}

const mockConfirm = {
    require: vi.fn(),
}

const mockFetch = vi.fn((url: string) => {
    if (url === '/api/admin/agreements?type=user_agreement') {
        return Promise.resolve({
            data: {
                mainLanguage: 'zh-CN',
                activeAgreementId: 'ua-v2',
                items: [
                    {
                        id: 'ua-v2',
                        type: 'user_agreement',
                        language: 'zh-CN',
                        version: '2.0.0',
                        versionDescription: '正式生效版本',
                        content: '# CN',
                        isFromEnv: false,
                        hasUserConsent: true,
                        isAuthoritativeVersion: true,
                        isReferenceTranslation: false,
                        isCurrentActive: true,
                        isCurrentReference: false,
                        sourceAgreementId: null,
                        sourceAgreementVersion: null,
                        sourceAgreementLanguage: null,
                        effectiveAt: '2026-02-01T00:00:00.000Z',
                        updatedAt: '2026-02-02T00:00:00.000Z',
                        createdAt: '2026-01-20T00:00:00.000Z',
                        canEdit: false,
                        canDelete: false,
                        restrictionReasons: ['consented', 'active_authoritative'],
                    },
                ],
                authoritativeOptions: [
                    {
                        id: 'ua-v2',
                        version: '2.0.0',
                        language: 'zh-CN',
                        label: '2.0.0 · zh-CN',
                    },
                ],
            },
        })
    }

    if (url === '/api/admin/agreements?type=privacy_policy') {
        return Promise.resolve({
            data: {
                mainLanguage: 'zh-CN',
                activeAgreementId: 'pp-v2',
                items: [],
                authoritativeOptions: [
                    {
                        id: 'pp-v2',
                        version: '2.0.0',
                        language: 'zh-CN',
                        label: '2.0.0 · zh-CN',
                    },
                ],
            },
        })
    }

    return Promise.resolve({ data: null })
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: ref('zh-CN'),
            locales: ref([
                { code: 'zh-CN' },
                { code: 'en-US' },
            ]),
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
    }
})

vi.stubGlobal('useAppApi', () => ({
    $appFetch: mockFetch,
}))

describe('AgreementsSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders active agreement summary and switches to translation mode in the dialog', async () => {
        const wrapper = await mountSuspended(AgreementsSettings, {
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    Button: {
                        template: '<button @click="$emit(\'click\')">{{ label || $slots.default?.() }}</button>',
                        props: ['label', 'icon', 'loading', 'disabled', 'title', 'class'],
                        emits: ['click'],
                    },
                    DataTable: {
                        template: '<div class="data-table"><slot /><slot name="empty" /></div>',
                        props: ['value', 'loading'],
                    },
                    Column: {
                        template: '<div class="column"></div>',
                        props: ['field', 'header', 'bodyClass'],
                    },
                    Tag: {
                        template: '<span class="tag">{{ value }}</span>',
                        props: ['value', 'severity'],
                    },
                    Dialog: {
                        template: '<div v-if="visible" class="dialog"><slot /><slot name="footer" /></div>',
                        props: ['visible', 'header', 'modal', 'class'],
                        emits: ['update:visible'],
                    },
                    Select: {
                        template: `
                            <select :value="modelValue ?? ''" @change="$emit('update:modelValue', $event.target.value || null)">
                                <option value="">--</option>
                                <option v-for="option in options" :key="option[optionValue] || option.value" :value="option[optionValue] || option.value">{{ option[optionLabel] || option.label }}</option>
                            </select>
                        `,
                        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled', 'placeholder'],
                        emits: ['update:modelValue'],
                    },
                    InputText: {
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                    Textarea: {
                        template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                    ClientOnly: { template: '<div><slot /></div>' },
                    AdminMavonEditorClient: {
                        template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                },
                provide: {
                    toast: mockToast,
                    confirm: mockConfirm,
                },
            },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('用户协议')
        expect(wrapper.text()).toContain('权威语言')

        const addButtons = wrapper.findAll('button')
        await addButtons[0]?.trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('权威语言版本可直接生效；其他语言会作为参考翻译展示。')

        const languageSelect = wrapper.find('select')
        await languageSelect.setValue('en-US')
        await flushPromises()

        expect(wrapper.text()).toContain('对应权威版本')
        expect(wrapper.text()).toContain('参考翻译会跟随这里选中的权威版本一起展示。')
    })
})
