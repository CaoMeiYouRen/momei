import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AdminPostsPage from './index.vue'

// Stub components
const stubs = {
    AdminPageHeader: {
        template: '<div class="admin-header"><slot name="actions" /></div>',
        props: ['title', 'showLanguageSwitcher'],
    },
    Button: {
        template: '<button @click="$emit(\'click\')"><slot /></button>',
        props: ['label', 'loading', 'icon', 'severity', 'class'],
        emits: ['click'],
    },
    IconField: { template: '<div class="icon-field"><slot /></div>' },
    InputIcon: { template: '<i class="input-icon" />', props: ['class'] },
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
        template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'showClear', 'class'],
        emits: ['update:modelValue', 'change'],
    },
    DataTable: {
        template: '<div class="datatable"><slot /></div>',
        props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator', 'rowsPerPageOptions', 'tableStyle', 'scrollable'],
        emits: ['page', 'sort'],
    },
    Column: { template: '<div class="column"><slot /></div>', props: ['field', 'header', 'sortable', 'headerStyle', 'bodyClass', 'headerClass', 'class', 'selectionMode'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Badge: { template: '<span class="badge">{{ value }}</span>', props: ['value', 'severity', 'class'] },
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('en'),
        }),
        useLocalePath: () => (path: string) => path,
        useHead: vi.fn(),
        navigateTo: vi.fn(),
    }
})

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en'),
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())

describe('AdminPostsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.admin-header').exists()).toBe(true)
    })

    it('renders create button', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        const html = wrapper.html()
        expect(html).toContain('pi-plus')
    })

    it('renders search input', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        const html = wrapper.html()
        expect(html).toContain('pi-search')
    })

    it('renders aggregate toggle switch', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        // Aggregate toggle should be present in the template
        const html = wrapper.html()
        expect(html).toContain('aggregate')
    })

    it('renders status select filter', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        // Status select should be present in the template
        const html = wrapper.html()
        expect(html).toContain('status')
    })

    it('renders data table', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountSuspended(AdminPostsPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.admin-page-container').exists()).toBe(true)
    })
})
