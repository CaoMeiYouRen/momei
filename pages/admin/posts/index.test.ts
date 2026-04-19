import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AdminPostsPage from './index.vue'

const {
    mockEnsureLocaleMessageModules,
    mockRefresh,
    mockExportPost,
    mockExportBatch,
    mockShowErrorToast,
    mockShowSuccessToast,
    mockNavigateTo,
} = vi.hoisted(() => ({
    mockEnsureLocaleMessageModules: vi.fn(),
    mockRefresh: vi.fn(),
    mockExportPost: vi.fn(),
    mockExportBatch: vi.fn(),
    mockShowErrorToast: vi.fn(),
    mockShowSuccessToast: vi.fn(),
    mockNavigateTo: vi.fn(),
}))

const mockLocales = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en-US', name: 'English' },
]

vi.mock('@/i18n/config/locale-runtime-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n/config/locale-runtime-loader')>()

    return {
        ...actual,
        ensureLocaleMessageModules: vi.fn((options) => {
            mockEnsureLocaleMessageModules(options)
            return Promise.resolve()
        }),
    }
})

vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: () => ({
            items: vue.ref([]),
            loading: vue.ref(false),
            pagination: vue.reactive({ total: 0, limit: 10 }),
            filters: vue.reactive({ search: '', status: null, aggregate: true }),
            onPage: vi.fn(),
            onSort: vi.fn(),
            onFilterChange: vi.fn(),
            refresh: mockRefresh,
        }),
    }
})

vi.mock('@/composables/use-admin-i18n', async () => {
    const vue = await import('vue')

    return {
        useAdminI18n: () => ({
            contentLanguage: vue.ref(null),
        }),
    }
})

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        formatDateTime: () => '-',
        relativeTime: () => '-',
        isFuture: () => false,
        d: () => '-',
    }),
}))

vi.mock('@/composables/use-post-export', async () => {
    const vue = await import('vue')

    return {
        usePostExport: () => ({
            exporting: vue.ref(false),
            exportPost: mockExportPost,
            exportBatch: mockExportBatch,
        }),
    }
})

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => ({
        resolveErrorMessage: vi.fn(),
        showErrorToast: mockShowErrorToast,
        showSuccessToast: mockShowSuccessToast,
    }),
}))

// Stub components
const stubs = {
    AdminPageHeader: {
        template: '<div class="admin-header"><slot name="actions" /></div>',
        props: ['title', 'showLanguageSwitcher'],
    },
    PostMediaPreviewCell: {
        template: '<div class="post-media-preview-cell-stub">media</div>',
        props: ['post', 'mode', 'preferredLocale'],
    },
    ConfirmDeleteDialog: {
        template: '<div class="confirm-delete-dialog" />',
    },
    Button: {
        template: '<button :class="icon" @click="$emit(\'click\')"><slot /></button>',
        props: ['label', 'loading', 'icon', 'severity'],
        emits: ['click'],
    },
    IconField: { template: '<div class="icon-field"><slot /></div>' },
    InputIcon: { template: '<i :class="$attrs.class" class="input-icon" />' },
    InputText: {
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
        props: ['modelValue', 'placeholder'],
        emits: ['update:modelValue', 'input'],
    },
    ToggleSwitch: {
        template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'inputId'],
        emits: ['update:modelValue', 'change'],
    },
    Select: {
        template: '<select :class="$attrs.class" :value="modelValue" :placeholder="placeholder" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'showClear'],
        emits: ['update:modelValue', 'change'],
    },
    DataTable: {
        template: '<div class="datatable"><slot /></div>',
        props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator', 'rowsPerPageOptions', 'tableStyle', 'scrollable'],
        emits: ['page', 'sort'],
    },
    Column: { template: '<div class="column"><slot /></div>', props: ['field', 'header', 'sortable', 'headerStyle', 'bodyClass', 'headerClass', 'selectionMode'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Badge: { template: '<span class="badge">{{ value }}</span>', props: ['value', 'severity'] },
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('en-US'),
            locales: ref(mockLocales),
        }),
        useLocalePath: () => (path: string | { path: string }) => typeof path === 'string' ? path : path.path,
        useNuxtApp: () => ({ $i18n: {} }),
        useHead: vi.fn(),
        navigateTo: mockNavigateTo,
    }
})

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en-US'),
    locales: ref(mockLocales),
}))
vi.stubGlobal('useLocalePath', () => (path: string | { path: string }) => typeof path === 'string' ? path : path.path)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('navigateTo', mockNavigateTo)

describe('AdminPostsPage', () => {
    const mountPage = () => mountSuspended(AdminPostsPage, {
        global: {
            mocks: {
                $t: (key: string) => key,
            },
            stubs,
        },
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.admin-header').exists()).toBe(true)
        expect(mockEnsureLocaleMessageModules).toHaveBeenCalledWith(
            expect.objectContaining({
                locale: expect.any(String),
                modules: ['admin-posts'],
            }),
        )
    })

    it('renders create button', async () => {
        const wrapper = await mountPage()

        const html = wrapper.html()
        expect(html).toContain('pi-plus')
    })

    it('renders search input', async () => {
        const wrapper = await mountPage()

        const html = wrapper.html()
        expect(html).toContain('pi-search')
    })

    it('renders aggregate toggle switch', async () => {
        const wrapper = await mountPage()

        const html = wrapper.html()
        expect(html).toContain('aggregate')
    })

    it('renders status select filter', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.status-select').exists()).toBe(true)
    })

    it('renders data table', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.admin-page-container').exists()).toBe(true)
    })
})
