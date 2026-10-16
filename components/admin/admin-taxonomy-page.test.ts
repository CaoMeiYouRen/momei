import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { nextTick, reactive, ref } from 'vue'
import { CaomeiDataTableStub, CaomeiTabsStub, caomeiInputFocusCalls, caomeiComponentStubs, taxonomyTestConfig } from '../../tests/helpers/caomei-component-stubs'
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

/*
 * 组件桩与配置夹具抽到 `tests/helpers/caomei-component-stubs.ts`：同一组件被组件用例与两个 host 页面用例
 * 共同渲染，三处各持一份桩集会在后续批次产生静默漂移。
 */
const stubs = caomeiComponentStubs

const { fetchMock, loadData } = vi.hoisted(() => ({
    fetchMock: vi.fn(() => Promise.resolve({ data: { items: [] } })),
    loadData: vi.fn(),
}))

/** 捕获 `useAdminList` 入参并允许逐用例注入数据行（与 `/admin/posts` 用例同一手法）。 */
const adminListState = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[], rows: [] as Record<string, unknown>[] }))

vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            adminListState.calls.push(options)

            return {
                items: vue.ref(adminListState.rows),
                loading: vue.ref(false),
                pagination: vue.ref({ page: 1, limit: 10, total: adminListState.rows.length }),
                filters: vue.ref({ ...(options.initialFilters as Record<string, unknown> ?? {}) }),
                onPage: vi.fn(),
                onSort: vi.fn(),
                onFilterChange: vi.fn(),
                refresh: loadData,
            }
        },
    }
})

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

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

const config = taxonomyTestConfig

/**
 * 挂载页面桩集。
 *
 * `keepReal` 用于必须渲染**真实子组件**的用例：共享桩会把子组件整卡替换掉，
 * 此时对「子组件内部可见文案」的断言验的是桩而不是实现（例如翻译关联卡片的候选按钮文案）。
 */
const mountPage = (options: { keepReal?: string[] } = {}) => {
    const activeStubs: Record<string, unknown> = { ...stubs }

    for (const name of options.keepReal ?? []) {
        delete activeStubs[name]
    }

    return mountSuspended(AdminTaxonomyPage, {
        props: { config },
        global: { stubs: activeStubs as typeof stubs },
    })
}

const openCreateDialog = async (options: { keepReal?: string[] } = {}) => {
    const wrapper = await mountPage(options)
    await (wrapper.vm as unknown as { openDialog: () => Promise<void> }).openDialog()
    await flushPromises()
    await nextTick()

    return wrapper
}

const setRows = (rows: Record<string, unknown>[]) => {
    adminListState.rows = rows
}

describe('AdminTaxonomyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        adminListState.calls = []
        adminListState.rows = []
        caomeiInputFocusCalls.mockClear()
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
                } as any)
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

    it('分页基准：向共享 composable 声明 pageIndexBase: 1（caomei @page 为 1 基）', async () => {
        await mountPage()

        expect(adminListState.calls[0]).toMatchObject({ url: '/api/categories', pageIndexBase: 1 })
    })

    it('创建按钮：可见文案落默认插槽（`CaomeiButton` 的 `label` 只是可访问名）', async () => {
        const wrapper = await mountPage()
        const button = wrapper.find('.admin-header .caomei-button')

        expect(button.exists()).toBe(true)
        expect(button.text()).toContain('pages.admin.categories.create')
        expect(button.find('svg').exists()).toBe(true)
    })

    it('搜索字段：`CaomeiInput` 承接 IconField / InputIcon（图标落 `#prefix`）', async () => {
        const wrapper = await mountPage()
        const search = wrapper.find('.admin-filters__search')

        expect(search.exists()).toBe(true)
        expect(search.find('svg').exists()).toBe(true)
    })

    it('列定义：逐列镜像迁移前的 key / 排序 / 两侧 style-class，条件列按 config 开关决定有无', async () => {
        const wrapper = await mountPage()
        const table = wrapper.findComponent(CaomeiDataTableStub)

        expect(table.props('columns')).toEqual([
            { key: 'name', header: 'common.name', sortable: true, headerStyle: { minWidth: '10rem' } },
            { key: 'slug', header: 'common.slug', sortable: true, headerStyle: { minWidth: '8rem' } },
            { key: 'parent', accessor: 'parent.name', header: 'common.parent', headerStyle: { minWidth: '8rem' } },
            {
                key: 'translations',
                header: 'common.translation_status',
                headerClass: 'text-center',
                bodyClass: 'text-center',
                headerStyle: { minWidth: '8rem' },
            },
            {
                key: 'description',
                header: 'common.description',
                headerClass: 'hidden md:table-cell',
                bodyClass: 'hidden md:table-cell',
            },
            {
                key: 'actions',
                header: 'common.actions',
                headerClass: 'text-right',
                bodyClass: 'text-right',
                headerStyle: { minWidth: '8rem' },
                bodyStyle: { minWidth: '8rem' },
            },
        ])
    })

    it('聚合开关关闭时用语言列替换翻译状态列（迁移前为 v-if / v-else）', async () => {
        const wrapper = await mountPage()
        const filters = (wrapper.vm as unknown as { filters: { aggregate: boolean } }).filters

        filters.aggregate = false
        await nextTick()

        const keys = (wrapper.findComponent(CaomeiDataTableStub).props('columns') as { key: string }[]).map((column) => column.key)

        expect(keys).toContain('language')
        expect(keys).not.toContain('translations')
    })

    it('状态标签：`CaomeiTag` 用默认插槽承载可见文案（该组件无 value prop）', async () => {
        setRows([{ id: 'cat-zh', name: '技术', slug: 'tech', language: 'zh-CN' }])
        const wrapper = await mountPage()
        const filters = (wrapper.vm as unknown as { filters: { aggregate: boolean } }).filters

        filters.aggregate = false
        await nextTick()

        const tag = wrapper.find('.caomei-tag')
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(tag.exists()).toBe(true)
        expect(tag.attributes('data-tone')).toBe('neutral')
        // 模板里的 `$t` 走真实 i18n 实例（脚本里的 `t` 才是用例桩），故期望值同源取自 `vm.$t`。
        expect(tag.text()).toBe($t('common.languages.zh-CN'))
    })

    it('翻译徽章：`CaomeiBadge` 走 `:value` + `tone`（命中语言 success / 未命中 neutral）', async () => {
        setRows([
            { id: 'cat-zh', name: '技术', slug: 'tech', language: 'zh-CN' },
            { id: 'cat-xx', name: 'Other', slug: 'other', language: 'xx-XX' },
        ])
        const wrapper = await mountPage()

        const tones = wrapper.findAll('.caomei-badge').map((badge) => badge.attributes('data-tone'))
        const values = wrapper.findAll('.caomei-badge').map((badge) => badge.attributes('data-value'))

        expect(tones).toContain('success')
        expect(tones).toContain('neutral')
        // `Badge` 确有 `value` prop（与 `Tag` 不同），故沿用 `:value` 渲染可见文案。
        expect(values).toContain('ZH-CN')
    })

    it('聚合开关：`CaomeiSwitch` 以 id 关联原生 label[for]', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.caomei-switch').attributes('data-id')).toBe('aggregate-switch')
        expect(wrapper.find('label[for="aggregate-switch"]').exists()).toBe(true)
    })

    it('弹窗：Tabs 族 / InputGroup / Checkbox / Textarea 按路由级在册族增量迁移', async () => {
        const wrapper = await openCreateDialog()

        expect(wrapper.find('.caomei-tabs').exists()).toBe(true)
        expect(wrapper.findAll('.caomei-tab-trigger').length).toBe(2)
        // 桩渲染全部语言面板：2 个语言 × 3 组（名称 / 别名 / 关联标识）。
        expect(wrapper.findAll('.caomei-input-group').length).toBe(6)
        expect(wrapper.find('.caomei-checkbox').attributes('id')).toBe('syncAll_zh-CN')
        expect(wrapper.find('.caomei-textarea').attributes('id')).toBe('description_zh-CN')
        expect(wrapper.find('.caomei-textarea').attributes('rows')).toBe('3')
        // 校验态由 `:invalid` 承接（迁移前为 `class="p-invalid"`）。
        expect(wrapper.find('input#name_zh-CN').exists()).toBe(true)
    })

    it('父级字段：`Select` + `filter` 由 `CaomeiAutoComplete`（strict + dropdown）承接', async () => {
        const wrapper = await openCreateDialog()
        const autoComplete = wrapper.find('.caomei-auto-complete')

        expect(autoComplete.exists()).toBe(true)
        expect(autoComplete.attributes('data-id')).toBe('parent_zh-CN')
        expect(autoComplete.attributes('data-strict')).toBe('true')
        expect(autoComplete.attributes('data-dropdown')).toBe('true')
    })

    it('父级字段取空时回写 null（维持 parentId: string | null 契约）', async () => {
        const wrapper = await openCreateDialog()
        const vm = wrapper.vm as unknown as {
            getFormState: (lang: string) => { parentId?: string | null }
            setParentId: (lang: string, value: unknown) => void
        }

        vm.setParentId('zh-CN', 'parent-1')
        expect(vm.getFormState('zh-CN').parentId).toBe('parent-1')
        vm.setParentId('zh-CN', '')
        expect(vm.getFormState('zh-CN').parentId).toBe(null)
    })

    it('行内动作：`icon-only` 按钮补 `:label` 可访问名（迁移前无可见文本也无可访问名）', async () => {
        setRows([{ id: 'cat-zh', name: '技术', slug: 'tech', language: 'zh-CN' }])
        const wrapper = await mountPage()
        const buttons = wrapper.findAll('.stub-td[data-key="actions"] .caomei-button')

        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(buttons.length).toBe(2)
        expect(buttons[0]?.attributes('data-label')).toBe($t('common.edit'))
        expect(buttons[1]?.attributes('data-label')).toBe($t('common.delete'))
        expect(buttons[0]?.attributes('data-icon-only')).toBe('true')
    })

    it('弹窗页脚：可见文案落默认插槽', async () => {
        const wrapper = await openCreateDialog()
        const footerButtons = wrapper.findAll('.dialog-footer .caomei-button')
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(footerButtons.map((button) => button.text())).toEqual([$t('common.cancel'), $t('common.save')])
    })

    it('名称字段焦点交接：浮层 focusin（trap 落到关闭按钮）后把焦点交回当前语言页签的名称输入', async () => {
        const wrapper = await mountPage()
        const vm = wrapper.vm as unknown as {
            openMissingTranslationDialog: (item: unknown, lang: string) => Promise<void>
        }

        caomeiInputFocusCalls.mockClear()
        // 用**非默认语言**（en-US）打开：这样「写死 zh-CN」的实现会被下面的断言杀死
        // （若走默认语言，activeTab 恰好也是 zh-CN，写死实现会与期望值重合而存活）。
        await vm.openMissingTranslationDialog({
            id: 'cat-zh',
            name: '技术',
            slug: 'tech',
            language: 'zh-CN',
            translationId: null,
            parentId: null,
            translations: [],
        }, 'en-US')
        await flushPromises()

        // `@show` 已置位交接标记：未收到 focusin 前不得抢焦点（否则会被浮层 focus trap 覆盖）。
        expect(caomeiInputFocusCalls).not.toHaveBeenCalled()

        await wrapper.find('.dialog').trigger('focusin')
        // 交接只应发生一次：缺 `pendingInitialFocus` 守卫的实现会在用户后续焦点变化时继续抢焦点。
        await wrapper.find('.dialog').trigger('focusin')

        expect(caomeiInputFocusCalls).toHaveBeenCalledTimes(1)
        expect(caomeiInputFocusCalls).toHaveBeenCalledWith('name_en-US')
    })

    it('弹窗关闭后复位交接标记（否则下次打开前的首次 focusin 会被抢焦点）', async () => {
        const wrapper = await mountPage()
        const vm = wrapper.vm as unknown as { openDialog: () => Promise<void>, hideDialog: () => void }

        caomeiInputFocusCalls.mockClear()
        await vm.openDialog()
        await flushPromises()
        vm.hideDialog()
        await nextTick()

        const dialog = wrapper.find('.dialog')

        if (dialog.exists()) {
            await dialog.trigger('focusin')
        }

        expect(caomeiInputFocusCalls).not.toHaveBeenCalled()
        expect((wrapper.vm as unknown as { pendingInitialFocus: boolean }).pendingInitialFocus).toBe(false)
    })

    it('语言页签：`v-model` 双向（Tabs 抛 update:modelValue 后 activeTab 跟随）', async () => {
        const wrapper = await openCreateDialog()
        const vm = wrapper.vm as unknown as { activeTab: string }

        // 入向绑定：`v-model` 的 `modelValue` 确实由页面状态驱动（否则「只留写回监听」的实现可蒙过写回断言）。
        expect(wrapper.findComponent(CaomeiTabsStub).props('modelValue')).toBe(vm.activeTab)

        wrapper.findComponent(CaomeiTabsStub).vm.$emit('update:modelValue', 'en-US')
        await nextTick()

        expect(vm.activeTab).toBe('en-US')
        expect(wrapper.findComponent(CaomeiTabsStub).props('modelValue')).toBe('en-US')
    })
})
