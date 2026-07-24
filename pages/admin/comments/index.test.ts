import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AdminComments from './index.vue'

const { fetchMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

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
        formatDate: () => '-',
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
        }),
    }
})

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
}))

const stubs = {
    AdminPageHeader: {
        props: ['title', 'showLanguageSwitcher'],
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
    ConfirmDeleteDialog: {
        props: ['visible', 'message'],
        template: '<div v-if="visible" class="confirm-dialog">{{ message }}</div>',
    },
    NuxtLink: { template: '<a><slot /></a>', props: ['to'] },
    Toast: { template: '<div class="toast" />' },
}

function makeListResponse() {
    return {
        code: 200,
        data: {
            items: [
                {
                    id: 'comment-1',
                    status: 'pending',
                    authorName: 'Alice',
                    authorEmail: 'alice@example.com',
                    content: 'Test content',
                    createdAt: '2026-07-24T00:00:00Z',
                    post: { id: 'post-1', title: 'Test Post' },
                },
            ],
            total: 1,
        },
    }
}

async function mountComponent() {
    return mountSuspended(AdminComments, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('AdminComments page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockResolvedValue(makeListResponse())
    })

    it('renders the page header', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-header').exists()).toBe(true)
        expect(wrapper.text()).toContain('pages.admin.comments.title')
    })

    it('renders the data table', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('renders filter controls', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.status-select').exists()).toBe(true)
    })

    it('loads comments on mount', async () => {
        await mountComponent()
        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/comments', expect.objectContaining({
                query: expect.objectContaining({ page: 1, limit: 20 }),
            }))
        })
    })

    it('renders empty state when no comments', async () => {
        fetchMock.mockResolvedValue({ code: 200, data: { items: [], total: 0 } })
        await mountComponent()
        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalled()
        })
    })

    it('handles fetch error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())
        fetchMock.mockRejectedValue(new Error('Network error'))
        await mountComponent()
        await vi.waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load comments:', expect.any(Error))
        })
        consoleSpy.mockRestore()
    })
})
