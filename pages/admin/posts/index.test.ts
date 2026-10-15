import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import AdminPostsPage from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/posts` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * `Tag` / `Badge` 语义色映射（`severity` → `tone`）、动作集合的形态与可访问名、
 * 行多选与懒加载服务端分页 / 排序的 1 基页码契约、条件列（`language`）、
 * 以及**消费处静态择库**（三件套过渡组件必须用 V2）。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 */

const {
    formatDateTimeMock,
    relativeTimeMock,
    isFutureMock,
    exportPostMock,
    exportBatchMock,
    feedbackMocks,
    navigateToMock,
    useAdminListCalls,
    useAdminListState,
    onPageMock,
    onSortMock,
    onFilterChangeMock,
    refreshMock,
    deleteDialogMocks,
} = vi.hoisted(() => ({
    formatDateTimeMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
    relativeTimeMock: vi.fn((value?: string | null) => value ? `rel:${value}` : '-'),
    isFutureMock: vi.fn(() => false),
    exportPostMock: vi.fn(),
    exportBatchMock: vi.fn(),
    feedbackMocks: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
    navigateToMock: vi.fn(),
    useAdminListCalls: [] as Record<string, unknown>[],
    useAdminListState: {
        rows: [] as Record<string, unknown>[],
        pagination: { page: 1, limit: 10, total: 0 },
        filtersRef: null as Ref<Record<string, unknown>> | null,
    },
    onPageMock: vi.fn(),
    onSortMock: vi.fn(),
    onFilterChangeMock: vi.fn(),
    refreshMock: vi.fn(),
    deleteDialogMocks: { open: vi.fn(), close: vi.fn(), setLoading: vi.fn() },
}))

vi.mock('@/i18n/config/locale-runtime-loader', () => ({
    ensureLocaleMessageModules: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            useAdminListCalls.push(options)

            const filtersRef = vue.ref({ ...(options.initialFilters as Record<string, unknown> ?? {}) })
            useAdminListState.filtersRef = filtersRef

            return {
                items: vue.ref(useAdminListState.rows),
                loading: vue.ref(false),
                pagination: vue.ref({ ...useAdminListState.pagination }),
                filters: filtersRef,
                sort: vue.ref({ field: 'publishedAt', order: 'desc' }),
                onPage: onPageMock,
                onSort: onSortMock,
                onFilterChange: onFilterChangeMock,
                refresh: refreshMock,
            }
        },
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
        formatDateTime: formatDateTimeMock,
        relativeTime: relativeTimeMock,
        isFuture: isFutureMock,
    }),
}))

vi.mock('@/composables/use-post-export', async () => {
    const vue = await import('vue')

    return {
        usePostExport: () => ({
            exporting: vue.ref(false),
            exportPost: exportPostMock,
            exportBatch: exportBatchMock,
        }),
    }
})

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => ({
        showErrorToast: feedbackMocks.showErrorToast,
        showSuccessToast: feedbackMocks.showSuccessToast,
    }),
}))

/*
 * 三件套过渡组件为**消费处静态择库**（迁移方案 §5.5）：已迁移路由必须直接用 `…V2`。
 * 以带标记的桩替换 V2 模块，从而把「本页是否真的消费 V2」变成可断言的契约——
 * 若有人把导入改回 V1，标记缺失即失败（V1 组件内部重新引入在册族 PrimeVue 组件，属路由混用）。
 */
vi.mock('@/components/admin/posts/post-audit-badge-v2.vue', async () => {
    const vue = await import('vue')

    return {
        default: vue.defineComponent({
            name: 'PostAuditBadgeV2',
            props: { auditResult: { type: Object, default: null }, loading: { type: Boolean, default: false } },
            emits: ['run-audit', 'show-detail'],
            setup: (props, { emit }) => () => vue.h('span', {
                class: 'audit-badge-v2',
                'data-has-result': String(Boolean(props.auditResult)),
                'data-loading': String(props.loading),
                onClick: () => emit('run-audit'),
            }, 'audit-v2'),
        }),
    }
})

vi.mock('@/components/admin/posts/post-audit-dialog-v2.vue', async () => {
    const vue = await import('vue')

    return {
        default: vue.defineComponent({
            name: 'PostAuditDialogV2',
            props: {
                visible: { type: Boolean, default: false },
                result: { type: Object, default: null },
                aiPending: { type: Boolean, default: false },
                reAuditing: { type: Boolean, default: false },
            },
            emits: ['close', 're-audit'],
            setup: (props, { emit }) => () => vue.h('div', {
                class: 'audit-dialog-v2',
                'data-visible': String(props.visible),
                'data-ai-pending': String(props.aiPending),
                'data-re-auditing': String(props.reAuditing),
                onClick: () => emit('close'),
            }, 'audit-dialog-v2'),
        }),
    }
})

vi.mock('@/components/admin/posts/publish-push-dialog-v2.vue', async () => {
    const vue = await import('vue')

    return {
        default: vue.defineComponent({
            name: 'PublishPushDialogV2',
            emits: ['confirm'],
            setup: (_props, { emit, expose }) => {
                const opened = vue.ref<Record<string, unknown> | null>(null)
                expose({
                    open: (options?: Record<string, unknown>) => {
                        opened.value = options ?? {}
                    },
                    opened,
                })

                return () => vue.h('div', {
                    class: 'publish-push-dialog-v2',
                    'data-open-options': JSON.stringify(opened.value),
                    onClick: () => emit('confirm', { pushOption: 'draft' }),
                }, 'publish-push-dialog-v2')
            },
        }),
    }
})

const LOCALES_FIXTURE = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en-US', name: 'English' },
    { code: 'ja-JP', name: '日本語' },
]

/*
 * Nuxt 自动导入的模块解析目标各不相同（`useI18n` ← `vue-i18n`、`useLocalePath` ←
 * `@nuxtjs/i18n/runtime`、`navigateTo` ← `#app/composables/router`），mock 必须打在
 * **各自真实的源模块**上（`vi.stubGlobal` 与 `#imports` 覆盖对它们无效——已实测：
 * 真实 `useLocalePath` 会因缺少 i18n 运行时导出而抛错，使点击处理器静默中断）。
 * `useNuxtApp` 不 mock：test-utils 运行时内部依赖它，真实实例在 `mountSuspended` 下可用。
 */
mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
    locales: ref(LOCALES_FIXTURE),
}))

mockNuxtImport('navigateTo', () => (...args: Parameters<typeof navigateToMock>) => navigateToMock(...args))

mockNuxtImport('useLocalePath', () => () => (path: string | { path: string }) => path)

vi.stubGlobal('definePageMeta', vi.fn())

const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        lazy: { type: Boolean, default: false },
        paginator: { type: Boolean, default: false },
        page: { type: Number, default: undefined },
        rows: { type: Number, default: 0 },
        totalRecords: { type: Number, default: undefined },
        rowsPerPageOptions: { type: Array, default: () => [] },
        selectionMode: { type: String, default: undefined },
        rowKey: { type: [String, Function], default: undefined },
        selection: { type: Array, default: undefined },
    },
    emits: ['page', 'sort', 'update:selection'],
    setup(props, { slots, emit }) {
        return () => {
            const columns = props.columns as { key: string, header?: string, headerClass?: string, bodyClass?: string, frozen?: string, sortable?: boolean, accessor?: unknown }[]
            const rows = props.data as Record<string, unknown>[]
            const resolveAccessor = (row: Record<string, unknown>, column: { key: string, accessor?: unknown }) => {
                const accessor = typeof column.accessor === 'string' ? column.accessor : column.key

                return accessor.split('.').reduce<unknown>((acc, segment) => (acc as Record<string, unknown> | null)?.[segment] ?? null, row)
            }
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' ? value : JSON.stringify(value)
            }
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string, accessor?: unknown }) => {
                const cellSlot = slots[`cell-${column.key}`]
                const value = resolveAccessor(row, column)
                const content = cellSlot
                    ? cellSlot({ row, value, index, column })
                    : defaultCell(value)

                return h('span', { class: 'stub-td', 'data-key': column.key }, content)
            }

            return h('div', {
                class: 'datatable caomei-data-table',
                'data-selection-mode': props.selectionMode ?? '',
                'data-row-key': String(props.rowKey ?? ''),
            }, [
                h('div', { class: 'stub-headers' }, columns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                    'data-header-class': column.headerClass ?? '',
                    'data-body-class': column.bodyClass ?? '',
                    'data-frozen': column.frozen ?? '',
                    'data-sortable': String(Boolean(column.sortable)),
                }, column.header))),
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => renderCell(row, index, column)))),
                rows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
                h('button', {
                    class: 'stub-next-page',
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: props.rows, pageCount: 3 }),
                }, 'next'),
                h('button', {
                    class: 'stub-sort',
                    onClick: () => emit('sort', { sortField: 'title', sortOrder: 'asc' }),
                }, 'sort'),
            ])
        }
    },
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: 'neutral' } },
    setup(props, { slots }) {
        return () => h('span', { class: 'tag', 'data-tone': props.tone }, slots.default?.())
    },
})

const CaomeiBadgeStub = defineComponent({
    name: 'CaomeiBadge',
    props: { value: { type: [String, Number], default: '' }, tone: { type: String, default: 'neutral' } },
    emits: ['click'],
    setup(props, { emit }) {
        return () => h('span', {
            class: 'badge',
            'data-value': props.value,
            'data-tone': props.tone,
            onClick: () => emit('click'),
        }, String(props.value))
    },
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        rounded: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-tone': props.tone,
            'data-variant': props.variant,
            'data-icon-only': String(props.iconOnly),
            'data-rounded': String(props.rounded),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
        return () => h('span', { class: 'caomei-input' }, [
            slots.prefix?.(),
            h('input', {
                value: props.modelValue,
                placeholder: props.placeholder,
                onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
            }),
        ])
    },
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: String, default: null },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: 'label' },
        optionValue: { type: String, default: 'value' },
        placeholder: { type: String, default: '' },
        showClear: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const options = props.options as Record<string, string>[]

        return () => h('span', { class: 'caomei-select', 'data-placeholder': props.placeholder, 'data-show-clear': String(props.showClear) }, [
            h('select', {
                'data-options': options.map((option) => option[props.optionValue]).join(','),
                onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
            }, options.map((option) => h('option', {
                value: option[props.optionValue] ?? '',
            }, option[props.optionLabel] ?? ''))),
        ])
    },
})

const CaomeiSwitchStub = defineComponent({
    name: 'CaomeiSwitch',
    props: { modelValue: { type: Boolean, default: false }, id: { type: String, default: '' } },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
        return () => h('button', {
            class: 'caomei-switch',
            'data-id': props.id,
            'data-checked': String(props.modelValue),
            onClick: () => {
                emit('update:modelValue', !props.modelValue)
                emit('change', !props.modelValue)
            },
        }, 'switch')
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-header', 'data-title': props.title }, [
            slots.actions?.(),
        ]),
    }),
    PostMediaPreviewCell: defineComponent({
        name: 'PostMediaPreviewCell',
        props: { post: { type: Object, default: null }, mode: { type: String, default: '' }, preferredLocale: { type: String, default: '' } },
        setup: (props) => () => h('span', { class: 'media-cell', 'data-mode': props.mode }, 'media'),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        setup: (_props, { expose }) => {
            expose(deleteDialogMocks)
            return () => h('div', { class: 'confirm-delete-dialog' })
        },
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiBadge: CaomeiBadgeStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
    CaomeiSwitch: CaomeiSwitchStub,
}

const sampleRows: Record<string, unknown>[] = [
    {
        id: 'post-1',
        title: 'Hello',
        slug: 'hello',
        status: 'published',
        isPinned: true,
        language: 'zh-CN',
        views: 12,
        publishedAt: '2026-02-01T00:00:00.000Z',
        translations: [{ id: 'post-1', language: 'zh-CN' }, { id: 'post-1-en', language: 'en-US' }],
        author: { name: 'Ada' },
        category: { name: 'Tech' },
        categoryId: 'cat-1',
        tags: [{ id: 'tag-1' }],
        audioUrl: null,
        coverImage: null,
    },
    {
        id: 'post-2',
        title: 'Draft',
        slug: 'draft',
        status: 'draft',
        isPinned: false,
        language: 'en-US',
        views: 0,
        publishedAt: null,
        translations: null,
        author: { name: 'Bob' },
        category: null,
        categoryId: null,
        tags: null,
        audioUrl: null,
        coverImage: null,
    },
]

async function mountPage(
    rows: Record<string, unknown>[] = sampleRows,
    pagination = { page: 1, limit: 10, total: rows.length },
) {
    useAdminListState.rows = rows
    useAdminListState.pagination = { ...pagination }

    const wrapper = await mountSuspended(AdminPostsPage, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
    await nextTick()

    return wrapper
}

describe('AdminPostsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAdminListCalls.length = 0
        useAdminListState.filtersRef = null
    })

    it('渲染页头与创建按钮（可见文本来自默认插槽而非 label）', async () => {
        const wrapper = await mountPage()
        expect(wrapper.find('.admin-header').attributes('data-title')).toBe('pages.admin.posts.title')

        const createButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.posts.create'))
        expect(createButton).toBeTruthy()
        // caomei `CaomeiButton` 的 `label` 仅映射可访问名，可见文本必须落在默认插槽
        // （否则按钮退化为纯图标按钮）——本断言防止该写法回退。
        expect(createButton!.attributes('data-icon-only')).toBe('false')
        await createButton!.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith('/admin/posts/new')
    })

    it('未选中行时不渲染批量导出按钮；选中行后出现（正向对照）', async () => {
        const wrapper = await mountPage()
        const hasBatchExport = () => wrapper.findAll('.caomei-button').some((button) => button.text().includes('pages.admin.posts.export_selected'))
        expect(hasBatchExport()).toBe(false)

        const table = wrapper.findComponent(CaomeiDataTableStub)
        table.vm.$emit('update:selection', [sampleRows[0]])
        await nextTick()
        expect(hasBatchExport()).toBe(true)

        // 批量导出：聚合开启时把各翻译版本 id 一并展开（`handleBatchExport`）。
        const batchButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.posts.export_selected'))!
        await batchButton.trigger('click')
        expect(exportBatchMock).toHaveBeenCalledWith(['post-1', 'post-1-en'])
    })

    it('筛选行：CaomeiInput（IconField + InputIcon → #prefix lucide Search）与 6 项状态选择器（show-clear）', async () => {
        const wrapper = await mountPage()

        const input = wrapper.find('.caomei-input')
        expect(input.find('svg.lucide-search').exists()).toBe(true)
        expect(input.find('input[placeholder="pages.admin.posts.search_placeholder"]').exists()).toBe(true)

        const select = wrapper.find('.caomei-select')
        expect(select.attributes('data-show-clear')).toBe('true')
        expect(select.attributes('data-placeholder')).toBe('pages.admin.posts.status')
        expect(select.find('select').attributes('data-options')).toBe('published,scheduled,draft,pending,rejected,hidden')
    })

    it('聚合开关：CaomeiSwitch 以 id 关联原生 label[for]', async () => {
        const wrapper = await mountPage()

        const switchNode = wrapper.find('.caomei-switch')
        expect(switchNode.attributes('data-id')).toBe('aggregate-switch')
        expect(wrapper.find('label[for="aggregate-switch"]').exists()).toBe(true)
    })

    it('声明本页在册列定义（聚合开启时的 12 列稳定顺序）', async () => {
        const wrapper = await mountPage()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'title',
            'author',
            'status',
            'isPinned',
            'coverImage',
            'audioUrl',
            'translations',
            'category',
            'views',
            'publishedAt',
            'audit',
            'actions',
        ])
    })

    it('列声明保真：条件列 language 随聚合开关出现 / 消失，动作列冻结在右侧', async () => {
        const wrapper = await mountPage()
        const keysOf = () => wrapper.findAll('.stub-th').map((node) => node.attributes('data-key'))
        // 默认 `aggregate: true` → 迁移前 `v-if="!filters.aggregate"` 使 `language` 列不渲染。
        expect(keysOf()).not.toContain('language')

        useAdminListState.filtersRef!.value.aggregate = false
        await nextTick()
        expect(keysOf()).toContain('language')

        // 迁移前动作列为 `frozen` + `align-frozen="right"`，迁移后以列级 `frozen: 'right'` 承接。
        const actionsHeader = wrapper.findAll('.stub-th').find((node) => node.attributes('data-key') === 'actions')!
        expect(actionsHeader.attributes('data-frozen')).toBe('right')
    })

    it('列声明保真：响应式 class 与对齐 class 两侧镜像（th / td 逐单元格等价）', async () => {
        const wrapper = await mountPage()

        const th = (key: string) => wrapper.findAll('.stub-th').find((node) => node.attributes('data-key') === key)!
        expect(th('author').attributes('data-header-class')).toBe('hidden lg:table-cell')
        expect(th('author').attributes('data-body-class')).toBe('hidden lg:table-cell')
        expect(th('isPinned').attributes('data-header-class')).toBe('text-center hidden md:table-cell')
        expect(th('coverImage').attributes('data-header-class')).toBe('text-center')
        expect(th('coverImage').attributes('data-body-class')).toBe('text-center')
        expect(th('title').attributes('data-header-class')).toBe('')
    })

    it('列插槽按 row 渲染：状态 / 置顶 Tag、语言 Tag、封面与播客预览、翻译徽标、审计徽标', async () => {
        const wrapper = await mountPage()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(2)

        expect(rows[0]!.find('[data-key="status"] .tag').attributes('data-tone')).toBe('success')
        expect(rows[0]!.find('[data-key="status"]').text()).toBe('common.status.published')
        // `draft` 的 severity 为 `secondary` → `neutral`（§6.2 有损近似）。
        expect(rows[1]!.find('[data-key="status"] .tag').attributes('data-tone')).toBe('neutral')
        expect(rows[1]!.find('[data-key="status"]').text()).toBe('common.status.draft')

        expect(rows[0]!.find('[data-key="isPinned"] .tag').attributes('data-tone')).toBe('primary')
        expect(rows[0]!.find('[data-key="isPinned"]').text()).toBe('common.yes')
        expect(rows[1]!.find('[data-key="isPinned"] .tag').attributes('data-tone')).toBe('neutral')
        expect(rows[1]!.find('[data-key="isPinned"]').text()).toBe('common.no')

        expect(rows[0]!.find('[data-key="coverImage"] .media-cell').attributes('data-mode')).toBe('cover')
        expect(rows[0]!.find('[data-key="audioUrl"] .media-cell').attributes('data-mode')).toBe('audio')

        // `Badge` 确有 `value` prop（与 `Tag` 不同）：翻译徽标沿用 `:value` + `tone`。
        const badges = rows[0]!.find('[data-key="translations"]').findAll('.badge')
        expect(badges.map((badge) => badge.attributes('data-value'))).toEqual(['ZH-CN', 'EN-US', 'JA-JP'])
        expect(badges.map((badge) => badge.attributes('data-tone'))).toEqual(['success', 'success', 'neutral'])
    })

    it('状态 Tag 的 tone 覆盖全部六态（`severity → tone` 的有损近似逐档锁定）', async () => {
        // 覆盖 `getPostStatusSeverity` 的六个出口：published→success、scheduled/hidden→info、
        // draft→secondary、pending→warn、rejected→danger；逐态给出期望 tone。
        const cases: [string, string][] = [
            ['published', 'success'],
            ['scheduled', 'primary'],
            ['draft', 'neutral'],
            ['pending', 'warning'],
            ['rejected', 'danger'],
            ['hidden', 'primary'],
        ]
        const rows = cases.map(([status], index) => ({
            ...sampleRows[0]!,
            id: `post-status-${index}`,
            status,
        }))
        const wrapper = await mountPage(rows, { page: 1, limit: 10, total: rows.length })

        const actual = wrapper.findAll('.stub-row').map((row) => row.find('[data-key="status"] .tag').attributes('data-tone'))
        expect(actual).toEqual(cases.map(([, tone]) => tone))
    })

    it('条件列 language：关闭聚合后渲染语言 Tag（既有翻译走 editor，缺失走新建）', async () => {
        const wrapper = await mountPage()
        useAdminListState.filtersRef!.value.aggregate = false
        await nextTick()

        const rows = wrapper.findAll('.stub-row')
        expect(rows[0]!.find('[data-key="language"] .tag').attributes('data-tone')).toBe('neutral')
        expect(rows[0]!.find('[data-key="language"]').text()).toBe('common.languages.zh-CN')
        expect(rows[1]!.find('[data-key="language"]').text()).toBe('common.languages.en-US')
    })

    it('列插槽：动作集合的形态与可访问名（含迁移前缺失的编辑 / 删除可访问名）', async () => {
        const wrapper = await mountPage()
        const rows = wrapper.findAll('.stub-row')

        // 已发布行：分发 / 再次推送 / 导出 / 编辑 / 删除（5 个 iconOnly 按钮）。
        const publishedActions = rows[0]!.find('[data-key="actions"]').findAll('.caomei-button')
        expect(publishedActions).toHaveLength(5)
        expect(publishedActions.map((button) => button.attributes('data-label'))).toEqual([
            'pages.admin.posts.distribution.tooltip',
            'pages.admin.posts.repush',
            'common.export',
            'common.edit',
            'common.delete',
        ])
        expect(publishedActions.every((button) => button.attributes('data-icon-only') === 'true')).toBe(true)
        expect(publishedActions.every((button) => button.attributes('data-variant') === 'ghost')).toBe(true)
        expect(publishedActions.map((button) => button.attributes('data-tone'))).toEqual([
            'neutral',
            'warning',
            'neutral',
            'primary',
            'danger',
        ])
        // 图标分支互斥断言（断言 class 无法判别分支，写反仍会全绿）。
        expect(publishedActions[0]!.find('svg.lucide-refresh-cw').exists()).toBe(true)
        expect(publishedActions[1]!.find('svg.lucide-send').exists()).toBe(true)
        expect(publishedActions[2]!.find('svg.lucide-download').exists()).toBe(true)
        expect(publishedActions[3]!.find('svg.lucide-pencil').exists()).toBe(true)
        expect(publishedActions[4]!.find('svg.lucide-trash-2').exists()).toBe(true)

        // 草稿行：无「再次推送」按钮（迁移前 `v-if="status === 'published'"`）。
        const draftActions = rows[1]!.find('[data-key="actions"]').findAll('.caomei-button')
        expect(draftActions).toHaveLength(4)
        expect(draftActions.some((button) => button.attributes('data-label') === 'pages.admin.posts.repush')).toBe(false)
    })

    it('动作跳转：编辑 / 分发分别携带路由与查询参数', async () => {
        const wrapper = await mountPage()
        const actions = wrapper.findAll('.stub-row')[0]!.find('[data-key="actions"]')

        await actions.findAll('.caomei-button')[0]!.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith({ path: '/admin/posts/post-1', query: { openDistribution: 'true' } })

        await actions.findAll('.caomei-button')[3]!.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith('/admin/posts/post-1')
    })

    it('单行导出：聚合开启且存在多个翻译时导出全部版本', async () => {
        const wrapper = await mountPage()
        const actions = wrapper.findAll('.stub-row')[0]!.find('[data-key="actions"]')

        await actions.findAll('.caomei-button')[2]!.trigger('click')
        expect(exportPostMock).toHaveBeenCalledWith('post-1', { slug: 'hello', all: true })
    })

    it('删除动作打开全局确认浮层', async () => {
        const wrapper = await mountPage()
        const actions = wrapper.findAll('.stub-row')[0]!.find('[data-key="actions"]')

        await actions.findAll('.caomei-button')[4]!.trigger('click')
        expect(deleteDialogMocks.open).toHaveBeenCalledTimes(1)
    })

    it('翻译徽标点击：已有翻译跳转编辑器，缺失翻译跳转新建并携带语言与来源', async () => {
        const wrapper = await mountPage()
        const badges = wrapper.findAll('.stub-row')[0]!.findAll('.badge')

        await badges[0]!.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith('/admin/posts/post-1')

        navigateToMock.mockClear()
        // ja-JP 无既有翻译 → 走新建分支（来源取 `translationId || id`）。
        await badges[2]!.trigger('click')
        expect(navigateToMock).toHaveBeenCalledWith({
            path: '/admin/posts/new',
            query: { translationId: 'post-1', language: 'ja-JP' },
        })
    })

    it('发布列走 data-visual-mask 遮蔽（动态相对时间不参与视觉门禁）', async () => {
        const wrapper = await mountPage()
        const cell = wrapper.findAll('.stub-row')[0]!.find('[data-key="publishedAt"]')

        expect(cell.find('.user-created-at[data-visual-mask]').exists()).toBe(true)
        expect(cell.find('.user-created-at__date').text()).toBe('date:2026-02-01T00:00:00.000Z')
        expect(relativeTimeMock).toHaveBeenCalled()
    })

    it('懒加载服务端分页：声明 pageIndexBase: 1、初始排序与聚合默认开启', async () => {
        await mountPage()
        expect(useAdminListCalls).toHaveLength(1)
        expect(useAdminListCalls[0]!.pageIndexBase).toBe(1)
        expect(useAdminListCalls[0]!.initialFilters).toEqual({ search: '', status: null, aggregate: true })
        expect(useAdminListCalls[0]!.initialSort).toEqual({ field: 'publishedAt', order: 'desc' })
    })

    it('行多选与分页：selection-mode / row-key / 每页条数候选与受控页码回传', async () => {
        const wrapper = await mountPage(sampleRows, { page: 3, limit: 20, total: 40 })

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.attributes('data-selection-mode')).toBe('multiple')
        expect(table.attributes('data-row-key')).toBe('id')
        expect(table.props('lazy')).toBe(true)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('page')).toBe(3)
        expect(table.props('rows')).toBe(20)
        expect(table.props('totalRecords')).toBe(40)
        expect(table.props('rowsPerPageOptions')).toEqual([5, 10, 20, 50])
    })

    it('表格抛出的 1 基 @page / @sort 被原样转发（页面侧无二次包装）', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.stub-next-page').trigger('click')
        await wrapper.find('.stub-sort').trigger('click')
        await nextTick()

        expect(onPageMock).toHaveBeenCalledWith(expect.objectContaining({ page: 2, rows: 10 }))
        expect(onSortMock).toHaveBeenCalledWith(expect.objectContaining({ sortField: 'title', sortOrder: 'asc' }))
    })

    it('状态选择器变更后触发列表刷新（caomei Select 仅抛 update:modelValue）', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.caomei-select select').setValue('published')
        await nextTick()

        expect(refreshMock).toHaveBeenCalled()
    })

    it('聚合开关变更后触发列表刷新', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.caomei-switch').trigger('click')
        await nextTick()

        expect(onFilterChangeMock).toHaveBeenCalled()
    })

    it('消费处静态择库：审计徽标与两个浮层均使用 V2 过渡组件', async () => {
        const wrapper = await mountPage()

        expect(wrapper.findAll('.audit-badge-v2')).toHaveLength(sampleRows.length)
        expect(wrapper.find('.audit-dialog-v2').exists()).toBe(true)
        expect(wrapper.find('.publish-push-dialog-v2').exists()).toBe(true)
    })

    it('审计徽标：默认无结果且非加载态；openAuditDialog 只在有缓存结果时开浮层', async () => {
        const wrapper = await mountPage()
        const auditCell = wrapper.findAll('.stub-row')[0]!.find('[data-key="audit"]')
        const badge = auditCell.findComponent({ name: 'PostAuditBadgeV2' })

        expect(badge.props('auditResult')).toBeNull()
        expect(badge.props('loading')).toBe(false)

        // 无缓存结果时点击详情不应打开浮层（迁移前 `openAuditDialog` 的 `if (cached)` 分支）。
        badge.vm.$emit('show-detail')
        await nextTick()
        expect(wrapper.find('.audit-dialog-v2').attributes('data-visible')).toBe('false')
    })

    it('空列表时渲染空态插槽', async () => {
        const wrapper = await mountPage([], { page: 1, limit: 10, total: 0 })
        expect(wrapper.find('.stub-empty').exists()).toBe(true)
        expect(wrapper.find('.stub-empty .empty-state').text()).toBe('pages.posts.empty')
    })
})
