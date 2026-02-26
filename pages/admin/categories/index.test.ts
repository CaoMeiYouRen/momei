import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AdminCategoriesPage from './index.vue'

// Stub components
const stubs = {
    AdminPageHeader: {
        template: '<div class="admin-header"><slot name="actions" /></div>',
        props: ['title', 'showLanguageSwitcher'],
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
    DataTable: {
        template: '<div class="datatable"><slot /></div>',
        props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator', 'rowsPerPageOptions', 'tableStyle'],
        emits: ['page', 'sort'],
    },
    Column: { template: '<div class="column"><slot /></div>', props: ['field', 'header', 'sortable', 'headerStyle', 'bodyClass', 'headerClass', 'vIf'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Badge: { template: '<span class="badge">{{ value }}</span>', props: ['value', 'severity'] },
    Dialog: { template: '<div v-if="visible" class="dialog"><slot /></div>', props: ['visible', 'modal', 'header', 'style'] },
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
    }
})

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('en'),
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())

describe('AdminCategoriesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
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
})
