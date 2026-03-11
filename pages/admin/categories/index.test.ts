import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'
import AdminCategoriesPage from './index.vue'

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('en'),
            locales: ref([
                { code: 'zh-CN' },
                { code: 'en-US' },
            ]),
        }),
    }
})

// Stub components
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
    DataTable: {
        template: '<div class="datatable"><slot /></div>',
        props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator', 'rowsPerPageOptions', 'tableStyle'],
        emits: ['page', 'sort'],
    },
    Column: { template: '<div class="column"><slot /></div>', props: ['field', 'header', 'sortable', 'headerStyle', 'bodyClass', 'headerClass', 'vIf'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Badge: { template: '<span class="badge">{{ value }}</span>', props: ['value', 'severity'] },
    Dialog: { template: '<div v-if="visible" class="dialog"><slot /><slot name="footer" /></div>', props: ['visible', 'modal', 'header', 'style'] },
    Tabs: { template: '<div class="tabs"><slot /></div>' },
    TabList: { template: '<div class="tab-list"><slot /></div>' },
    Tab: { template: '<button class="tab"><slot /></button>', props: ['value'] },
    TabPanels: { template: '<div class="tab-panels"><slot /></div>' },
    TabPanel: { template: '<div class="tab-panel"><slot /></div>', props: ['value'] },
    Checkbox: { template: '<input class="checkbox" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['modelValue', 'binary', 'inputId'], emits: ['update:modelValue'] },
    InputGroup: { template: '<div class="input-group"><slot /></div>' },
    Textarea: { template: '<textarea class="textarea" />', props: ['modelValue', 'rows', 'cols'] },
    Select: { template: '<select class="select" />', props: ['modelValue', 'options', 'optionLabel', 'optionValue'] },
    TabsPanel: { template: '<div><slot /></div>' },
    TaxonomyTranslationAssociationCard: {
        template: '<div class="taxonomy-translation-association" :class="{\'taxonomy-translation-association--warn\': Boolean(sameLanguageConflict)}"><span>{{ clusterId }}</span><span v-for="candidate in relatedCandidates" :key="candidate.id">{{ candidate.name }}</span></div>',
        props: ['clusterId', 'usesSlugFallback', 'sameLanguageConflict', 'linkedPeers', 'relatedCandidates'],
    },
    ConfirmDeleteDialog: { template: '<div class="confirm-delete-dialog" />', props: ['visible', 'title', 'message'] },
}

const loadData = vi.fn()
const addToast = vi.fn()
const fetchMock: any = vi.fn(() => Promise.resolve({ data: { items: [] } }))

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('en'),
            locales: ref([
                { code: 'zh-CN' },
                { code: 'en-US' },
            ]),
        }),
        useLocalePath: () => (path: string) => path,
        useHead: vi.fn(),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en'),
    locales: ref([
        { code: 'zh-CN' },
        { code: 'en-US' },
    ]),
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useToast', () => ({ add: addToast }))
vi.stubGlobal('useAdminI18n', () => ({ contentLanguage: ref('zh-CN') }))
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

describe('AdminCategoriesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockImplementation(() => Promise.resolve({ data: { items: [] } }))
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.admin-header').exists()).toBe(true)
    })

    it('renders create button', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        const html = wrapper.html()
        expect(html).toContain('pi-plus')
    })

    it('renders search input', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        const html = wrapper.html()
        expect(html).toContain('pi-search')
    })

    it('renders aggregate toggle switch', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        // Aggregate toggle should be present in the template
        const html = wrapper.html()
        expect(html).toContain('aggregate')
    })

    it('renders data table', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.admin-page-container').exists()).toBe(true)
    })

    it('shows aligned sync controls when opening the create dialog', async () => {
        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        await wrapper.find('button.pi-plus').trigger('click')
        await nextTick()

        expect(wrapper.find('.taxonomy-dialog__sync-controls').exists()).toBe(true)
        expect(wrapper.find('.taxonomy-dialog__sync-toggle').exists()).toBe(true)
    })

    it('shows translation association candidates after entering a matching slug', async () => {
        fetchMock.mockImplementation((...args: any[]) => {
            const options = args[1]
            if (options?.query?.translationId === 'tech-group') {
                return Promise.resolve({
                    data: {
                        items: [
                            { id: 'cat-en', name: 'Technology', language: 'en-US', slug: 'technology', translationId: 'tech-group' },
                        ],
                    },
                })
            }

            return Promise.resolve({ data: { items: [] } })
        })

        const wrapper = await mountSuspended(AdminCategoriesPage, {
            global: {
                stubs,
            },
        })

        await wrapper.find('button.pi-plus').trigger('click')
        await nextTick()

        await wrapper.find('input#slug_zh-CN').setValue('tech-group')
        await nextTick()
        await Promise.resolve()
        await nextTick()

        expect(wrapper.find('.taxonomy-translation-association').exists()).toBe(true)
        expect(wrapper.text()).toContain('Technology')
    })
})
