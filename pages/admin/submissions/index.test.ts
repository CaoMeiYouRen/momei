import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AdminSubmissions from './index.vue'

const { refreshMock } = vi.hoisted(() => ({
    refreshMock: vi.fn(),
}))

vi.mock('@/composables/use-admin-list', () => ({
    useAdminList: () => ({
        items: ref([]),
        loading: ref(false),
        pagination: ref({ total: 0, limit: 10, page: 1 }),
        onPage: vi.fn(),
        onFilterChange: vi.fn(),
        refresh: refreshMock,
    }),
}))

vi.mock('@/composables/use-delete-dialog-state', () => ({
    useDeleteDialogState: () => ({
        visible: { value: false },
        item: { value: null },
        openDeleteDialog: vi.fn(),
        resetDeleteDialog: vi.fn(),
    }),
}))

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        formatDateTime: () => '-',
    }),
}))

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('zh-CN'),
            locales: ref([{ code: 'zh-CN', name: '简体中文' }]),
        }),
    }
})

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
    locales: ref([{ code: 'zh-CN', name: '简体中文' }]),
}))

const stubs = {
    AdminPageHeader: {
        props: ['title'],
        template: '<div class="admin-header">{{ title }}</div>',
    },
    IconField: { template: '<div class="icon-field"><slot /></div>' },
    InputIcon: { template: '<i class="pi pi-search" />' },
    InputText: {
        props: ['modelValue', 'placeholder'],
        emits: ['update:modelValue'],
        template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Select: {
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
        emits: ['update:modelValue', 'change'],
        template: '<select class="status-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\')"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    },
    DataTable: {
        props: ['value', 'loading', 'lazy', 'totalRecords', 'rows', 'paginator'],
        emits: ['page'],
        template: '<div class="datatable"><slot /><slot name="empty" /></div>',
    },
    Column: { template: '<div class="column"><slot /></div>', props: ['field', 'header'] },
    Tag: { props: ['value', 'severity'], template: '<span class="tag" :data-severity="severity">{{ value }}</span>' },
    Button: {
        props: ['label', 'loading', 'icon', 'severity', 'text', 'rounded'],
        emits: ['click'],
        template: '<button :class="icon" :data-severity="severity" @click="$emit(\'click\')"><slot /></button>',
    },
    Dialog: {
        props: ['visible', 'modal', 'header', 'style'],
        template: '<div v-if="visible" class="dialog"><header>{{ header }}</header><slot /><slot name="footer" /></div>',
    },
    Textarea: {
        props: ['modelValue', 'placeholder', 'rows', 'fluid'],
        emits: ['update:modelValue'],
        template: '<textarea :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    Checkbox: {
        props: ['modelValue', 'binary', 'inputId'],
        emits: ['update:modelValue'],
        template: '<input type="checkbox" :checked="modelValue" :id="inputId" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    },
    Divider: { template: '<hr />' },
    ConfirmDeleteDialog: {
        props: ['visible', 'title'],
        template: '<div v-if="visible" class="confirm-dialog" />',
    },
    Toast: { template: '<div class="toast" />' },
}

async function mountComponent() {
    return mountSuspended(AdminSubmissions, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('AdminSubmissions page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the page header', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-header').exists()).toBe(true)
        expect(wrapper.text()).toContain('pages.admin.submissions.title')
    })

    it('renders the data table', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('renders filter controls', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.status-select').exists()).toBe(true)
    })

    it('renders the toast component', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.toast').exists()).toBe(true)
    })
})
