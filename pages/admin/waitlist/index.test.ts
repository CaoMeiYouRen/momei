import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminWaitlist from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/waitlist` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`severity` → `tone`）、动作集合、懒加载服务端分页的 1 基页码契约、
 * 筛选映射与导出链接。真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 分页自证：本页是**懒加载服务端分页**（迁移前 PrimeVue `DataTable` 亦 `lazy` + `@page`）。
 * PrimeVue `@page` 为 0 基、caomei `@page` 为 1 基，故页面必须向 `useAdminList` 声明
 * `pageIndexBase: 1`，否则页码会被二次抬升。本用例断言：① 声明了 `pageIndexBase: 1`；
 * ② 页面把 1 基当前页作为受控值回传给 caomei `DataTable`；③ 表格抛出的 1 基 `@page`
 * 被原样转发给共享 composable（无「减一 / 加一」包装）。
 */

const { fetchMock, formatDateMock, useAdminListCalls, useAdminListState, onPageMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    formatDateMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
    useAdminListCalls: [] as Record<string, unknown>[],
    useAdminListState: {
        rows: [] as Record<string, unknown>[],
        pagination: { page: 1, limit: 20, total: 0 },
    },
    onPageMock: vi.fn(),
}))

// Mock 共享列表 composable：既能注入行数据 / 分页态，又记录调用参数（用于断言 `pageIndexBase` 契约）。
vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            useAdminListCalls.push(options)

            return {
                items: vue.ref(useAdminListState.rows),
                loading: vue.ref(false),
                pagination: vue.ref({ ...useAdminListState.pagination }),
                onPage: onPageMock,
                onFilterChange: vi.fn(),
                refresh: vi.fn(),
            }
        },
    }
})

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
        formatDate: formatDateMock,
    }),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

mockNuxtImport('useDebounceFn', () => (fn: (...args: unknown[]) => unknown) => fn)

// Mock Nuxt auto-imports（页面经 `useI18n()` 取 `t`，模板经全局 `$t` 取值）。
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

const sampleRows: Record<string, unknown>[] = [
    { id: 1, name: 'Ada', email: 'ada@example.com', purpose: 'benefit', locale: 'zh-CN', createdAt: '2026-02-01T00:00:00.000Z' },
    { id: 2, name: 'Bob', email: 'bob@example.com', purpose: null, locale: null, createdAt: '2026-02-02T00:00:00.000Z' },
]

// 表格 stub：按列定义渲染表头与单元格，并把 `#cell-{key}` 插槽内容真正渲染出来；
// 无对应插槽的列回落到 caomei `DataTable` 的默认取值（读取 `row[key]`）。
const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        paginator: { type: Boolean, default: false },
        rows: { type: Number, default: 0 },
        lazy: { type: Boolean, default: false },
        page: { type: Number, default: undefined },
        totalRecords: { type: Number, default: undefined },
    },
    emits: ['page'],
    setup(props, { slots, emit }) {
        return () => {
            const columns = props.columns as { key: string, header?: string, align?: string }[]
            const rows = props.data as Record<string, unknown>[]
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' ? value : JSON.stringify(value)
            }
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string }) => {
                const cellSlot = slots[`cell-${column.key}`]
                const content = cellSlot ? cellSlot({ row, value: row[column.key], index, column }) : defaultCell(row[column.key])

                return h('span', { class: 'stub-td', 'data-key': column.key }, content)
            }

            return h('div', { class: 'datatable caomei-data-table' }, [
                h('div', { class: 'stub-headers' }, columns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                    'data-align': column.align ?? '',
                }, column.header))),
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => renderCell(row, index, column)))),
                rows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
                h('button', {
                    class: 'stub-next-page',
                    // caomei `@page` 为 1 基；页面应把该值原样转发给共享 composable。
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: props.rows, pageCount: 3 }),
                }, 'next'),
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

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        rounded: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-tone': props.tone,
            'data-variant': props.variant,
            'data-icon-only': String(props.iconOnly),
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

const stubs = {
    AdminListShell: defineComponent({
        name: 'AdminListShell',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-list-shell', 'data-title': props.title }, [
            slots.actions?.(),
            slots.filters?.(),
            slots.default?.(),
        ]),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        setup: () => () => h('div', { class: 'confirm-delete-dialog' }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
}

async function mountComponent(
    rows: Record<string, unknown>[] = sampleRows,
    pagination = { page: 1, limit: 20, total: rows.length },
) {
    useAdminListState.rows = rows
    useAdminListState.pagination = { ...pagination }

    const wrapper = await mountSuspended(AdminWaitlist, {
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

describe('AdminWaitlist page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAdminListCalls.length = 0
    })

    it('渲染页头与导出按钮（secondary 变体，且可见文本来自默认插槽而非 label）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-list-shell').attributes('data-title')).toBe('pages.admin.waitlist.title')

        const exportButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.waitlist.export'))
        expect(exportButton).toBeTruthy()
        expect(exportButton!.attributes('data-variant')).toBe('secondary')
        // caomei `CaomeiButton` 的 `label` 仅映射可访问名，可见文本必须落在默认插槽
        // （否则按钮退化为纯图标按钮）——本断言防止该写法回退。
        expect(exportButton!.attributes('data-icon-only')).toBe('false')
        expect(exportButton!.text()).toContain('pages.admin.waitlist.export')
    })

    it('渲染 caomei 数据表与全局确认浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.confirm-delete-dialog').exists()).toBe(true)
    })

    it('筛选行迁移为 CaomeiInput（IconField + InputIcon + InputText → #prefix 图标）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.findAll('.caomei-input')).toHaveLength(2)
        expect(wrapper.find('.caomei-input input[placeholder="pages.admin.waitlist.search_placeholder"]').exists()).toBe(true)
        expect(wrapper.find('.caomei-input input[placeholder="pages.admin.waitlist.purpose_filter"]').exists()).toBe(true)
    })

    it('声明本页在册列定义（name / email / purpose / locale / createdAt / actions），动作列右对齐', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'name',
            'email',
            'purpose',
            'locale',
            'createdAt',
            'actions',
        ])
        // 迁移前动作列以 `class="text-right"` 右对齐，迁移后用列级 `align` 等价还原。
        expect(headers.at(-1)!.attributes('data-align')).toBe('right')
    })

    it('列插槽按 row 渲染：姓名 / 邮箱走默认取值，加入时间 / 动作走插槽', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(2)

        // 默认取值列（无插槽）：读取 `row[key]`。
        expect(rows[0]!.find('[data-key="name"]').text()).toBe('Ada')
        expect(rows[1]!.find('[data-key="email"]').text()).toBe('bob@example.com')

        // 加入时间列由 `#cell-createdAt` 经 `formatDate` 渲染。
        expect(rows[0]!.find('[data-key="createdAt"]').text()).toBe('date:2026-02-01T00:00:00.000Z')

        // 动作列由 `#cell-actions` 插槽提供（单个删除图标按钮）。
        const actions = rows[0]!.find('[data-key="actions"]')
        expect(actions.findAll('.caomei-button')).toHaveLength(1)
        expect(actions.find('.caomei-button').attributes('data-label')).toBe('common.delete')
        expect(actions.find('.caomei-button').attributes('data-tone')).toBe('danger')
    })

    it('目的 Tag 使用 primary tone，空值回落为 benefit', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows[0]!.find('[data-key="purpose"] .tag').attributes('data-tone')).toBe('primary')
        // 迁移前 `:value="data.purpose || 'benefit'"`；`purpose` 为 null 时回落展示 'benefit'。
        expect(rows[1]!.find('[data-key="purpose"]').text()).toBe('benefit')
    })

    it('语言 Tag 使用 neutral tone，空值回落为破折号', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows[0]!.find('[data-key="locale"] .tag').attributes('data-tone')).toBe('neutral')
        expect(rows[0]!.find('[data-key="locale"]').text()).toBe('zh-CN')
        // 无语言时不渲染 Tag，改渲染占位破折号。
        expect(rows[1]!.find('[data-key="locale"] .tag').exists()).toBe(false)
        expect(rows[1]!.find('[data-key="locale"]').text()).toBe('—')
    })

    it('懒加载服务端分页：向 useAdminList 声明 pageIndexBase: 1 与 initialLimit: 20', async () => {
        await mountComponent()
        expect(useAdminListCalls).toHaveLength(1)
        expect(useAdminListCalls[0]!.pageIndexBase).toBe(1)
        expect(useAdminListCalls[0]!.initialLimit).toBe(20)
    })

    it('懒加载服务端分页：把 1 基当前页作为受控值回传给 caomei DataTable', async () => {
        const wrapper = await mountComponent(sampleRows, { page: 3, limit: 20, total: 40 })

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('lazy')).toBe(true)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('page')).toBe(3)
        expect(table.props('rows')).toBe(20)
        expect(table.props('totalRecords')).toBe(40)
    })

    it('表格抛出的 1 基 @page 被原样转发（无二次抬升）', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.stub-next-page').trigger('click')
        await nextTick()

        // 事件载荷 `page: 2`（1 基）应原样转发（`pageIndexBase: 1` 契约在 composable 内保证不抬升）。
        expect(onPageMock).toHaveBeenCalledTimes(1)
        expect(onPageMock.mock.calls[0]![0]).toMatchObject({ page: 2, rows: 20 })
    })

    it('空列表时渲染空态插槽（AdminTableEmptyState）', async () => {
        const wrapper = await mountComponent([], { page: 1, limit: 20, total: 0 })
        expect(wrapper.find('.stub-empty').exists()).toBe(true)
    })

    it('导出 CSV：按目的筛选拼接查询串并新开窗口', async () => {
        const wrapper = await mountComponent()
        const openSpy = vi.fn()
        vi.stubGlobal('open', openSpy)

        await wrapper.find('.caomei-input input[placeholder="pages.admin.waitlist.purpose_filter"]').setValue('beta')

        const exportButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.waitlist.export'))!
        await exportButton.trigger('click')

        expect(openSpy).toHaveBeenCalledWith('/api/admin/waitlist/export?purpose=beta', '_blank')
    })
})
