import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'
import { z } from 'zod'
import AdminTaxonomyPage from './admin-taxonomy-page.vue'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('en-US'),
            locales: ref([
                { code: 'zh-CN' },
                { code: 'en-US' },
            ]),
        }),
    }
})

const stubs = {
    AdminPageHeader: {
        template: '<div class="admin-header"><slot name="actions" /></div>',
        props: ['title', 'showLanguageSwitcher'],
    },
    Button: {
        template: '<button :class="icon" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ label }}</button>',
        props: ['label', 'loading', 'icon', 'severity', 'disabled'],
        emits: ['click'],
    },
    IconField: { template: '<div class="icon-field"><slot /></div>' },
    InputIcon: { template: '<i :class="$attrs.class" class="input-icon" />' },
    InputText: {
        template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
        props: ['id', 'modelValue', 'placeholder'],
        emits: ['update:modelValue', 'input'],
    },
    ToggleSwitch: {
        template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'inputId'],
        emits: ['update:modelValue', 'change'],
    },
    DataTable: { template: '<div class="datatable"><slot /></div>', props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator', 'rowsPerPageOptions', 'tableStyle'] },
    Column: { template: '<div class="column"><slot /><slot name="body" :data="{}" /></div>', props: ['field', 'header', 'sortable', 'headerStyle', 'bodyClass', 'headerClass'] },
    Badge: { template: '<button class="badge" @click="$emit(\'click\')">{{ value }}</button>', props: ['value', 'severity'], emits: ['click'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Dialog: { template: '<div v-if="visible" class="dialog"><slot /><slot name="footer" /></div>', props: ['visible', 'modal', 'header', 'style'] },
    Tabs: { template: '<div class="tabs"><slot /></div>' },
    TabList: { template: '<div class="tab-list"><slot /></div>' },
    Tab: { template: '<button class="tab"><slot /></button>', props: ['value'] },
    TabPanels: { template: '<div class="tab-panels"><slot /></div>' },
    TabPanel: { template: '<div class="tab-panel"><slot /></div>', props: ['value'] },
    Checkbox: { template: '<input class="checkbox" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['modelValue', 'binary', 'inputId'], emits: ['update:modelValue'] },
    InputGroup: { template: '<div class="input-group"><slot /></div>' },
    Textarea: { template: '<textarea class="textarea" :value="modelValue" />', props: ['modelValue', 'rows', 'cols'] },
    Select: { template: '<select class="select" />', props: ['modelValue', 'options', 'optionLabel', 'optionValue'] },
    TaxonomyTranslationAssociationCard: { template: '<div class="taxonomy-translation-association" />', props: ['clusterId', 'usesSlugFallback', 'sameLanguageConflict', 'linkedPeers', 'relatedCandidates'] },
    ConfirmDeleteDialog: { template: '<div class="confirm-delete-dialog" />', props: ['visible', 'title', 'message'] },
}

const loadData = vi.fn()
const fetchMock: any = vi.fn(() => Promise.resolve({ data: { items: [] } }))

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en-US'),
    locales: ref([
        { code: 'zh-CN' },
        { code: 'en-US' },
    ]),
}))
vi.stubGlobal('useAdminI18n', () => ({ contentLanguage: ref('zh-CN') }))
vi.stubGlobal('useRequestFeedback', () => ({
    showErrorToast: vi.fn(),
    showSuccessToast: vi.fn(),
}))
vi.stubGlobal('useAdminAI', () => ({
    aiLoading: reactive({ 'zh-CN': { name: false, slug: false }, 'en-US': { name: false, slug: false } }),
    translateName: vi.fn(),
    generateSlug: vi.fn(),
    syncAIAllLanguages: vi.fn(),
}))
vi.stubGlobal('useAdminList', () => ({
    items: ref([]),
    loading: ref(false),
    pagination: reactive({ total: 0, limit: 10 }),
    filters: reactive({ search: '', aggregate: true }),
    onPage: vi.fn(),
    onSort: vi.fn(),
    onFilterChange: vi.fn(),
    refresh: loadData,
}))
vi.stubGlobal('$fetch', fetchMock)

const taxonomySchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    language: z.string(),
    translationId: z.string().nullable().optional(),
})

const config = {
    endpoint: '/api/categories',
    titleKey: 'pages.admin.categories.title',
    createKey: 'pages.admin.categories.create',
    searchPlaceholderKey: 'pages.admin.categories.search_placeholder',
    deleteConfirmTitleKey: 'pages.admin.categories.delete_confirm_title',
    deleteConfirmKey: 'pages.admin.categories.delete_confirm',
    saveSuccessKey: 'pages.admin.categories.save_success',
    deleteSuccessKey: 'pages.admin.categories.delete_success',
    syncToAllLanguagesKey: 'pages.admin.categories.sync_to_all_languages',
    createSchema: taxonomySchema,
    updateSchema: taxonomySchema,
    showParentField: true,
    showDescriptionField: true,
    buildEmptyForm: (lang: string) => ({
        id: null,
        name: '',
        slug: '',
        description: '',
        parentId: null,
        language: lang,
        translationId: null,
    }),
    buildFormFromItem: (item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        parentId: item.parentId || null,
        language: item.language,
        translationId: item.translationId,
    }),
    buildMissingTranslationDraft: (item: any, langCode: string) => ({
        id: null,
        name: '',
        slug: item.slug,
        description: '',
        parentId: item.parentId || null,
        language: langCode,
        translationId: item.translationId,
    }),
}

describe('AdminTaxonomyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockImplementation(() => Promise.resolve({ data: { items: [] } }))
    })

    it('hydrates existing translations when opening a missing translation draft', async () => {
        fetchMock.mockImplementation((...args: any[]) => {
            const options = args[1]
            if (options?.query?.translationId === 'tech-group') {
                return Promise.resolve({
                    data: {
                        items: [{
                            id: 'cat-zh',
                            name: '技术',
                            slug: 'tech',
                            language: 'zh-CN',
                            translationId: 'tech-group',
                            parentId: null,
                        }],
                    },
                })
            }

            return Promise.resolve({ data: { items: [] } })
        })

        const wrapper = await mountSuspended(AdminTaxonomyPage, {
            props: { config },
            global: { stubs },
        })

        const openMissingTranslationDialog = (wrapper.vm as any).openMissingTranslationDialog
        expect(typeof openMissingTranslationDialog).toBe('function')

        await openMissingTranslationDialog({
            id: 'cat-zh',
            name: '技术',
            slug: 'tech',
            language: 'zh-CN',
            translationId: 'tech-group',
            parentId: null,
            translations: [],
        }, 'en-US')
        await Promise.resolve()
        await nextTick()

        expect((wrapper.find('input#name_zh-CN').element as HTMLInputElement).value).toBe('技术')
        expect((wrapper.find('input#slug_en-US').element as HTMLInputElement).value).toBe('tech')
        expect(wrapper.find('.taxonomy-dialog__sync-controls').exists()).toBe(false)
    })
})
