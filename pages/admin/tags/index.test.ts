import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'
import { caomeiComponentStubs } from '../../../tests/helpers/caomei-component-stubs'
import AdminTagsPage from './index.vue'

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
const listItems = ref<any[]>([])

/*
 * 组件桩抽到 `tests/helpers/caomei-component-stubs.ts`：本页渲染的实体组件（`admin-taxonomy-page.vue`）
 * 同时被组件用例与两个 host 页面用例渲染，三处各持一份桩集会在后续批次产生静默漂移。
 */
const stubs = caomeiComponentStubs

const { fetchMock, addToast, loadData } = vi.hoisted(() => ({
    fetchMock: vi.fn(() => Promise.resolve({ data: { items: [] } })),
    addToast: vi.fn(),
    loadData: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

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
    items: listItems,
    loading: ref(false),
    pagination: reactive({ total: 0, limit: 10 }),
    filters: reactive({ search: '', aggregate: true }),
    onPage: vi.fn(),
    onSort: vi.fn(),
    onFilterChange: vi.fn(),
    refresh: loadData,
}))

describe('AdminTagsPage', () => {
    const mountPage = () => mountSuspended(AdminTagsPage, {
        global: {
            mocks: {
                $t: (key: string) => key,
            },
            stubs,
        },
    })

    beforeEach(() => {
        vi.clearAllMocks()
        listItems.value = []
        fetchMock.mockImplementation(() => Promise.resolve({ data: { items: [] } }))
    })

    it('renders page header correctly', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.admin-header').exists()).toBe(true)
    })

    it('renders create button', async () => {
        const wrapper = await mountPage()

        // 迁移后创建按钮为 `CaomeiButton`：可见文案在默认插槽，图标走 lucide `#icon`。
        const button = wrapper.find('.admin-header .caomei-button')
        expect(button.exists()).toBe(true)
        expect(button.find('svg').exists()).toBe(true)
    })

    it('renders search input', async () => {
        const wrapper = await mountPage()

        // 迁移后搜索字段为 `CaomeiInput`：`IconField` / `InputIcon` 由 `#prefix` 承接（lucide `Search`）。
        const search = wrapper.find('.admin-filters__search')
        expect(search.exists()).toBe(true)
        expect(search.find('svg').exists()).toBe(true)
    })

    it('renders data table', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.datatable').exists()).toBe(true)
    })

    it('has correct CSS class structure', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.admin-page-container').exists()).toBe(true)
    })

    it('shows aligned sync controls when opening the create dialog', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.admin-header .caomei-button').trigger('click')
        await nextTick()

        expect(wrapper.find('.taxonomy-dialog__sync-controls').exists()).toBe(true)
        expect(wrapper.find('.taxonomy-dialog__sync-toggle').exists()).toBe(true)
    })

    it('shows same-language conflict hint for an occupied translation id', async () => {
        fetchMock.mockImplementation((...args: any[]) => {
            const options = args[1]
            if (options?.query?.translationId === 'tag-group') {
                return Promise.resolve({
                    data: {
                        items: [
                            { id: 'tag-zh', name: '回退标签', language: 'zh-CN', slug: 'fallback-tag', translationId: 'tag-group' },
                        ],
                    },
                } as any)
            }

            return Promise.resolve({ data: { items: [] } })
        })

        const wrapper = await mountPage()

        await wrapper.find('.admin-header .caomei-button').trigger('click')
        await nextTick()

        await wrapper.find('input#slug_zh-CN').setValue('tag-group')
        await nextTick()
        await Promise.resolve()
        await nextTick()

        expect(wrapper.find('.taxonomy-translation-association--warn').exists()).toBe(true)
        expect(wrapper.text()).toContain('回退标签')
    })
})
