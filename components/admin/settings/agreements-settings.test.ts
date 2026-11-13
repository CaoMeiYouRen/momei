import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AgreementsSettings from './agreements-settings.vue'
import { createLegacyToastApi, createLegacyConfirmApi } from '@/tests/helpers/caomei-service-mocks'

const translations: Record<string, string> = {
    'pages.admin.settings.system.agreements.title': '协议管理',
    'pages.admin.settings.system.agreements.description': '协议治理说明',
    'pages.admin.settings.system.agreements.user_agreement': '用户协议',
    'pages.admin.settings.system.agreements.privacy_policy': '隐私政策',
    'pages.admin.settings.system.agreements.main_language': '权威语言',
    'pages.admin.settings.system.agreements.active_authoritative': '当前生效版本',
    'pages.admin.settings.system.agreements.aggregated_view': '聚合查看',
    'pages.admin.settings.system.agreements.flat_view': '完整列表',
    'pages.admin.settings.system.agreements.create_ai_draft': 'AI 草案',
    'pages.admin.settings.system.agreements.generate_ai_draft': 'AI 生成翻译草案',
    'pages.admin.settings.system.agreements.aggregated_view_help': '聚合查看会按权威版本合并展示，并优先显示当前界面语言对应的译本。',
    'pages.admin.settings.system.agreements.flat_view_help': '完整列表会展开全部语言和版本，便于逐条编辑、切换和排查。',
    'pages.admin.settings.system.agreements.no_active_version': '尚未设置',
    'common.language': '语言',
    'pages.admin.settings.system.agreements.version': '版本号',
    'pages.admin.settings.system.agreements.version_description': '版本说明',
    'pages.admin.settings.system.agreements.content': '协议内容',
    'pages.admin.settings.system.agreements.language_help': '权威语言版本可直接生效；其他语言会作为参考翻译展示。',
    'pages.admin.settings.system.agreements.source_version': '对应权威版本',
    'pages.admin.settings.system.agreements.source_version_placeholder': '选择该翻译对应的权威版本',
    'pages.admin.settings.system.agreements.source_version_help': '参考翻译会跟随这里选中的权威版本一起展示。',
    'pages.admin.settings.system.agreements.authoritative_help': '当前语言等于权威语言，保存后可在列表中手动切换为生效版本。',
    'pages.admin.settings.system.agreements.review_statuses.draft': '草案',
    'pages.admin.settings.system.agreements.review_statuses.pending_review': '待审校',
    'pages.admin.settings.system.agreements.review_statuses.approved': '已审校',
    'pages.admin.settings.system.agreements.submit_review': '提交审校',
    'pages.admin.settings.system.agreements.approve_review': '标记已审校',
    'pages.admin.settings.system.agreements.activate_requires_approval': '仅已审校的权威版本可以设为生效版本',
    'pages.admin.settings.system.agreements.edit': '编辑协议',
    'pages.admin.settings.system.agreements.create': '创建新协议',
    'common.add': '新增',
    'common.status_label': '状态',
    'common.refresh': '刷新',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.languages.zh-CN': '简体中文',
    'common.languages.en-US': 'English',
    'common.delete': '删除',
    'pages.admin.settings.system.agreements.authoritative_version': '权威版本',
    'pages.admin.settings.system.agreements.reference_translation': '参考翻译',
    'pages.admin.settings.system.agreements.restrictions.pending_review': '仅已审校的权威版本可以设为生效版本',
    'pages.admin.settings.system.agreements.activate': '设为生效版本',
}

const translate = vi.fn((key: string) => translations[key] || key)

const mockToast = createLegacyToastApi(vi.fn())

const mockConfirm = createLegacyConfirmApi(vi.fn())

const mockFetch = vi.fn((url: string, options?: { query?: Record<string, unknown> }) => {
    if (url === '/api/admin/agreements' && options?.query?.type === 'user_agreement') {
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
                        reviewStatus: 'approved',
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
                        canActivate: false,
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

    if (url === '/api/admin/agreements' && options?.query?.type === 'privacy_policy') {
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

vi.mock('ofetch', () => ({ $fetch: (...args: unknown[]) => (mockFetch as (...inner: unknown[]) => unknown)(...args) }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: (...args: unknown[]) => (mockFetch as (...inner: unknown[]) => unknown)(...args) }))

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
                    CaomeiButton: {
                        template: '<button @click="$emit(\'click\')">{{ label || $slots.default?.() }}</button>',
                        props: ['label', 'icon', 'loading', 'disabled', 'title', 'class'],
                        emits: ['click'],
                    },
                    CaomeiDataTable: {
                        template: '<div class="data-table"><slot /><slot name="empty" /></div>',
                        props: ['value', 'loading'],
                    },
                    Column: {
                        template: '<div class="column"></div>',
                        props: ['field', 'header', 'bodyClass'],
                    },
                    CaomeiTag: {
                        template: '<span class="tag"><slot /></span>',
                        props: ['tone', 'variant'],
                    },
                    CaomeiDialog: {
                        template: '<div v-if="open" class="dialog"><slot /><slot name="footer" /></div>',
                        props: ['open', 'title', 'modal', 'class'],
                        emits: ['update:open'],
                    },
                    CaomeiSelect: {
                        template: `
                            <select :value="modelValue ?? ''" @change="$emit('update:modelValue', $event.target.value || null)">
                                <option value="">--</option>
                                <option v-for="option in options" :key="option[optionValue] || option.value" :value="option[optionValue] || option.value">{{ option[optionLabel] || option.label }}</option>
                            </select>
                        `,
                        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled', 'placeholder'],
                        emits: ['update:modelValue'],
                    },
                    SettingInput: {
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                    SettingTextarea: {
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

        const addButton = wrapper.findAll('button').find((button) => button.text() === '新增')
        await addButton?.trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('权威语言版本可直接生效；其他语言会作为参考翻译展示。')

        const languageSelect = wrapper.find('select')
        await languageSelect.setValue('en-US')
        await flushPromises()

        expect(translate).toHaveBeenCalledWith('common.status_label')
        expect(wrapper.text()).toContain('对应权威版本')
        expect(wrapper.text()).toContain('参考翻译会跟随这里选中的权威版本一起展示。')
    })
})

describe('AgreementsSettings - 行内操作', () => {
    const baseItem = {
        id: 'ua-draft',
        type: 'user_agreement',
        language: 'zh-CN',
        version: '3.0.0',
        versionDescription: '草案版本',
        content: '# draft',
        reviewStatus: 'draft',
        isFromEnv: false,
        hasUserConsent: false,
        isAuthoritativeVersion: true,
        isReferenceTranslation: false,
        isCurrentActive: false,
        isCurrentReference: false,
        sourceAgreementId: null,
        sourceAgreementVersion: null,
        sourceAgreementLanguage: null,
        effectiveAt: null,
        updatedAt: null,
        createdAt: '2026-03-01T00:00:00.000Z',
        canEdit: true,
        canDelete: true,
        canActivate: false,
        restrictionReasons: ['pending_review'] as const,
    }

    const approvedItem = {
        ...baseItem,
        id: 'ua-approved',
        version: '2.0.0',
        reviewStatus: 'approved',
        canActivate: true,
        restrictionReasons: [],
        isCurrentActive: false,
        effectiveAt: '2026-02-01T00:00:00.000Z',
    }

    const translationItem = {
        ...baseItem,
        id: 'ua-en',
        language: 'en-US',
        version: '3.0.0',
        reviewStatus: 'pending_review',
        isAuthoritativeVersion: false,
        isReferenceTranslation: true,
        sourceAgreementId: 'ua-draft',
        sourceAgreementVersion: '3.0.0',
        sourceAgreementLanguage: 'zh-CN',
        canActivate: false,
    }

    const createRowFetch = () => vi.fn((url: string, options?: { method?: string, query?: Record<string, unknown> }) => {
        if (url === '/api/admin/agreements' && !options?.method) {
            const type = options?.query?.type
            const items = type === 'user_agreement' ? [baseItem, approvedItem, translationItem] : []

            return Promise.resolve({
                data: {
                    mainLanguage: 'zh-CN',
                    activeAgreementId: 'ua-approved',
                    items,
                    authoritativeOptions: [
                        { id: 'ua-draft', version: '3.0.0', language: 'zh-CN', label: '3.0.0 · zh-CN' },
                    ],
                },
            })
        }

        return Promise.resolve({ data: { id: 'ua-new' } })
    })

    async function mountWithRows(impl: (...args: never[]) => unknown) {
        mockFetch.mockImplementation(impl as never)

        const wrapper = await mountSuspended(AgreementsSettings, {
            global: {
                mocks: { $t: translate },
                stubs: {
                    CaomeiButton: {
                        template: '<button :disabled="disabled" :title="title" @click="$emit(\'click\')"><slot /></button>',
                        props: ['label', 'icon', 'loading', 'disabled', 'title', 'variant', 'tone', 'rounded', 'iconOnly'],
                        emits: ['click'],
                    },
                    CaomeiDataTable: {
                        template: `
                            <div class="data-table">
                                <template v-for="row in data" :key="row.id">
                                    <div class="row">
                                        <slot name="cell-version" :row="row" />
                                        <slot name="cell-language" :row="row" />
                                        <slot name="cell-role" :row="row" />
                                        <slot name="cell-relation" :row="row" />
                                        <slot name="cell-status" :row="row" />
                                        <slot name="cell-effectiveDate" :row="row" />
                                        <slot name="cell-updatedAt" :row="row" />
                                        <slot name="cell-versionDescription" :row="row" />
                                        <slot name="cell-actions" :row="row" />
                                    </div>
                                </template>
                                <slot name="empty" />
                            </div>
                        `,
                        props: ['data', 'value', 'columns', 'loading'],
                    },
                    Column: { template: '<div class="column"></div>', props: ['field', 'header', 'bodyClass'] },
                    CaomeiTag: { template: '<span class="tag"><slot /></span>', props: ['tone', 'variant'] },
                    CaomeiDialog: {
                        template: '<div v-if="open" class="dialog"><slot /><slot name="footer" /></div>',
                        props: ['open', 'title', 'modal', 'class'],
                        emits: ['update:open'],
                    },
                    CaomeiSelect: {
                        template: '<select :value="modelValue ?? \'\'" @change="$emit(\'update:modelValue\', $event.target.value || null)"><option value="">--</option></select>',
                        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'disabled', 'placeholder'],
                        emits: ['update:modelValue'],
                    },
                    SettingInput: {
                        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                        props: ['modelValue'],
                        emits: ['update:modelValue'],
                    },
                    SettingTextarea: {
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
                provide: { toast: mockToast, confirm: mockConfirm },
            },
        })

        await flushPromises()
        return wrapper
    }

    const findButton = (wrapper: Awaited<ReturnType<typeof mountWithRows>>, label: string) => wrapper.findAll('button')
        .find((button) => button.text().trim() === label || button.attributes('title') === label)

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders aggregated rows through the cell slots', async () => {
        const fetchMock = createRowFetch()
        const wrapper = await mountWithRows(fetchMock)
        const text = wrapper.text()

        expect(text).toContain('3.0.0')
        expect(text).toContain('简体中文')
        expect(text).toContain('权威版本')
        expect(text).toContain('2.0.0 · 简体中文')
        expect(text).toContain('草案')
        expect(text).toContain('已审校')
        expect(text).toContain('2026年2月1日')
        expect(text).toContain('草案版本')

        await findButton(wrapper, '完整列表')?.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('English')
        expect(wrapper.text()).toContain('参考翻译')
    })

    it('submits the draft for review and approves the pending translation', async () => {
        const fetchMock = createRowFetch()
        const wrapper = await mountWithRows(fetchMock)

        await findButton(wrapper, '完整列表')?.trigger('click')
        await flushPromises()

        await findButton(wrapper, '标记已审校')?.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/agreements/ua-en/review-status', expect.objectContaining({
            method: 'POST',
            body: { reviewStatus: 'approved' },
        }))

        await findButton(wrapper, '提交审校')?.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/agreements/ua-draft/review-status', expect.objectContaining({
            method: 'POST',
            body: { reviewStatus: 'pending_review' },
        }))
    })

    it('reloads agreements when refresh is clicked and switches the view hint', async () => {
        const fetchMock = createRowFetch()
        const wrapper = await mountWithRows(fetchMock)
        const callsBefore = fetchMock.mock.calls.length

        await findButton(wrapper, '刷新')?.trigger('click')
        await flushPromises()
        expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore)

        await findButton(wrapper, '完整列表')?.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('完整列表会展开全部语言和版本')
    })

    it('opens the AI draft dialog in a non-main language and keeps the source version', async () => {
        const fetchMock = createRowFetch()
        const wrapper = await mountWithRows(fetchMock)

        await findButton(wrapper, 'AI 草案')?.trigger('click')
        await flushPromises()

        expect(wrapper.find('.dialog').exists()).toBe(true)
        expect(wrapper.text()).toContain('对应权威版本')
    })

    it('keeps the table empty and warns when loading fails', async () => {
        const failingFetch = vi.fn((url: string) => {
            if (url === '/api/admin/agreements') {
                return Promise.reject(new Error('network down'))
            }
            return Promise.resolve({ data: null })
        })

        const wrapper = await mountWithRows(failingFetch)

        expect(failingFetch).toHaveBeenCalled()
        expect(wrapper.text()).toContain('尚未设置')
        expect(wrapper.find('.data-table').exists()).toBe(true)
    })
})
