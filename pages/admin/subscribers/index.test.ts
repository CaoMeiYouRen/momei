import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminSubscribers from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/subscribers` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`severity` → `tone`）、状态 Tag 的可点击切换、`AppAvatar` → `AppAvatarV2`
 * 的消费处替换、懒加载服务端分页的 1 基页码契约、筛选与导出、删除确认。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 分页自证：本页是**懒加载服务端分页**（迁移前 PrimeVue `DataTable` 亦 `lazy` + `@page`）。
 * PrimeVue `@page` 为 0 基、caomei `@page` 为 1 基，故页面必须向 `useAdminList` 声明
 * `pageIndexBase: 1`，否则页码会被二次抬升。
 */

const { fetchMock, formatDateMock, useAdminListCalls, useAdminListState, onPageMock, openDeleteDialogMock, deleteState } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    formatDateMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
    useAdminListCalls: [] as Record<string, unknown>[],
    useAdminListState: {
        rows: [] as Record<string, unknown>[],
        pagination: { page: 1, limit: 20, total: 0 },
    },
    onPageMock: vi.fn(),
    openDeleteDialogMock: vi.fn(),
    deleteState: { visible: false, item: null as Record<string, unknown> | null },
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

vi.mock('@/composables/use-delete-dialog-state', async () => {
    const vue = await import('vue')

    return {
        useDeleteDialogState: () => ({
            visible: vue.ref(deleteState.visible),
            item: vue.ref(deleteState.item),
            openDeleteDialog: openDeleteDialogMock,
            resetDeleteDialog: vi.fn(),
        }),
    }
})

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        formatDate: formatDateMock,
    }),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

mockNuxtImport('useDebounceFn', () => (fn: (...args: unknown[]) => unknown) => fn)

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
    {
        id: 'sub-1',
        email: 'ada@example.com',
        language: 'zh-CN',
        isActive: true,
        createdAt: '2026-02-01T00:00:00.000Z',
        user: { name: 'Ada', email: 'ada@example.com', image: 'https://cdn.example.com/ada.png' },
    },
    {
        id: 'sub-2',
        email: 'bob@example.com',
        language: 'en-US',
        isActive: false,
        createdAt: '2026-02-02T00:00:00.000Z',
        user: null,
    },
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
            const columns = props.columns as { key: string, header?: string, align?: string, sortable?: boolean }[]
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
                    'data-sortable': String(column.sortable ?? false),
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
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('span', { class: 'tag', 'data-tone': props.tone, onClick: () => emit('click') }, slots.default?.())
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

const AppAvatarV2Stub = defineComponent({
    name: 'AppAvatarV2',
    inheritAttrs: false,
    props: {
        image: { type: String, default: '' },
        email: { type: String, default: '' },
        name: { type: String, default: '' },
        size: { type: String, default: '' },
        shape: { type: String, default: '' },
    },
    setup: (props, { attrs }) => () => h('span', {
        class: ['app-avatar-v2', ...(attrs.class ? [attrs.class as string] : [])],
        'data-image': props.image,
        'data-email': props.email,
        'data-name': props.name,
        'data-size': props.size,
        'data-shape': props.shape,
    }),
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
    AdminTableEmptyState: defineComponent({
        name: 'AdminTableEmptyState',
        props: { label: String },
        setup: (props) => () => h('div', { class: 'admin-table-empty-state', 'data-label': props.label }),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        setup: () => () => h('div', { class: 'confirm-delete-dialog' }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    AppAvatarV2: AppAvatarV2Stub,
}

async function mountComponent(
    rows: Record<string, unknown>[] = sampleRows,
    pagination = { page: 1, limit: 20, total: rows.length },
) {
    useAdminListState.rows = rows.map((row) => ({ ...row }))
    useAdminListState.pagination = { ...pagination }

    const wrapper = await mountSuspended(AdminSubscribers, {
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

describe('AdminSubscribers page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAdminListCalls.length = 0
        deleteState.visible = false
        deleteState.item = null
    })

    it('渲染页头与导出按钮（secondary 变体，且可见文本来自默认插槽而非 label）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-list-shell').attributes('data-title')).toBe('pages.admin.subscribers.title')

        const exportButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.subscribers.export'))
        expect(exportButton).toBeTruthy()
        expect(exportButton!.attributes('data-variant')).toBe('secondary')
        // caomei `CaomeiButton` 的 `label` 仅映射可访问名，可见文本必须落在默认插槽
        // （否则按钮退化为纯图标按钮）——本断言防止该写法回退。
        expect(exportButton!.attributes('data-icon-only')).toBe('false')
        expect(exportButton!.text()).toContain('pages.admin.subscribers.export')
    })

    it('渲染 caomei 数据表与全局确认浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.confirm-delete-dialog').exists()).toBe(true)
    })

    it('筛选行迁移为 CaomeiInput（IconField + InputIcon + InputText → #prefix 图标）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.findAll('.caomei-input')).toHaveLength(1)
        expect(wrapper.find('.caomei-input input[placeholder="pages.admin.subscribers.search_placeholder"]').exists()).toBe(true)
    })

    it('声明本页在册列定义（email / language / isActive / user / createdAt / actions），动作列右对齐', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'email',
            'language',
            'isActive',
            'user',
            'createdAt',
            'actions',
        ])
        // 迁移前动作列以 `class="text-right"` 右对齐，迁移后用列级 `align` 等价还原。
        expect(headers.at(-1)!.attributes('data-align')).toBe('right')
        // 迁移前 `field="email"` 列带 `sortable`；沿用既有已迁移路由口径保留。
        expect(headers[0]!.attributes('data-sortable')).toBe('true')
    })

    it('邮箱列走默认取值，加入时间经 formatDate，动作列为单个删除图标按钮', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(2)

        expect(rows[0]!.find('[data-key="email"]').text()).toBe('ada@example.com')
        expect(rows[1]!.find('[data-key="createdAt"]').text()).toBe('date:2026-02-02T00:00:00.000Z')

        const actions = rows[0]!.find('[data-key="actions"]')
        expect(actions.findAll('.caomei-button')).toHaveLength(1)
        const deleteButton = actions.find('.caomei-button')
        expect(deleteButton.attributes('data-label')).toBe('common.delete')
        expect(deleteButton.attributes('data-tone')).toBe('danger')
        expect(deleteButton.attributes('data-icon-only')).toBe('true')
        expect(deleteButton.attributes('data-variant')).toBe('ghost')
        expect(deleteButton.attributes('data-rounded')).toBe('true')
    })

    it('语言 Tag 使用 neutral tone（迁移前 severity="secondary"）', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        const languageTag = rows[0]!.find('[data-key="language"] .tag')
        expect(languageTag.attributes('data-tone')).toBe('neutral')
        expect(languageTag.text()).toBe('common.languages.zh-CN')
    })

    it('状态 Tag：色调随 isActive 翻转，且带可点击类', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        const activeTag = rows[0]!.find('[data-key="isActive"] .tag')
        const inactiveTag = rows[1]!.find('[data-key="isActive"] .tag')

        expect(activeTag.attributes('data-tone')).toBe('success')
        expect(activeTag.text()).toBe('pages.admin.subscribers.active')
        expect(inactiveTag.attributes('data-tone')).toBe('neutral')
        expect(inactiveTag.text()).toBe('pages.admin.subscribers.inactive')

        // 迁移前用内联 `style="cursor: pointer"` 表达可点击，迁移后为 scoped 类。
        expect(activeTag.classes()).toContain('admin-subscribers__status-tag')
    })

    it('点击状态 Tag 调用 PUT 并就地翻转本地状态', async () => {
        fetchMock.mockResolvedValue({ code: 200 })
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[1]!.find('[data-key="isActive"] .tag').trigger('click')
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/subscribers/sub-2', {
            method: 'PUT',
            body: { isActive: true },
        })
        // 本地行数据同步翻转（迁移前行为一致）。
        expect((useAdminListState.rows[1] as Record<string, unknown>).isActive).toBe(true)
    })

    it('关联用户列：有用户时渲染 AppAvatarV2 与「名称 || 邮箱」回退', async () => {
        const wrapper = await mountComponent()

        const cell = wrapper.findAll('.stub-row')[0]!.find('[data-key="user"]')
        const avatar = cell.find('.app-avatar-v2')
        expect(avatar.exists()).toBe(true)
        expect(avatar.attributes('data-image')).toBe('https://cdn.example.com/ada.png')
        expect(avatar.attributes('data-email')).toBe('ada@example.com')
        expect(avatar.attributes('data-name')).toBe('Ada')
        expect(avatar.attributes('data-shape')).toBe('circle')
        // 迁移前 `size="small"` 在 PrimeVue 下为无效值（渲染默认 32px）；迁移后改用有效档位 normal
        expect(avatar.attributes('data-size')).toBe('normal')
        expect(cell.text()).toContain('Ada')
    })

    it('关联用户列：无用户时渲染 warning Tag（迁移前 severity="warning"）', async () => {
        const wrapper = await mountComponent()

        const cell = wrapper.findAll('.stub-row')[1]!.find('[data-key="user"]')
        expect(cell.find('.app-avatar-v2').exists()).toBe(false)
        const tag = cell.find('.tag')
        expect(tag.attributes('data-tone')).toBe('warning')
        expect(tag.text()).toBe('pages.admin.subscribers.not_associated')
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

        expect(onPageMock).toHaveBeenCalledTimes(1)
        expect(onPageMock.mock.calls[0]![0]).toMatchObject({ page: 2, rows: 20 })
    })

    it('空列表时渲染空态插槽（AdminTableEmptyState）', async () => {
        const wrapper = await mountComponent([], { page: 1, limit: 20, total: 0 })
        expect(wrapper.find('.stub-empty').exists()).toBe(true)
        expect(wrapper.find('.admin-table-empty-state').attributes('data-label')).toBe('pages.posts.empty')
    })

    it('动作列删除按钮打开删除确认浮层并携带该行', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.find('[data-key="actions"] .caomei-button').trigger('click')

        expect(openDeleteDialogMock).toHaveBeenCalledTimes(1)
        expect(openDeleteDialogMock.mock.calls[0]![0]).toMatchObject({ id: 'sub-1' })
    })

    it('删除确认后调用 DELETE 并刷新列表', async () => {
        fetchMock.mockResolvedValue({ code: 200 })
        deleteState.item = { id: 'sub-1' }

        const wrapper = await mountComponent()
        // 通过浮层 stub 触发 confirm 事件
        await wrapper.findComponent({ name: 'ConfirmDeleteDialog' }).vm.$emit('confirm')
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/subscribers/sub-1', { method: 'DELETE' })
    })

    it('导出按钮新开窗口指向订阅导出接口（无筛选参数）', async () => {
        const wrapper = await mountComponent()
        const openSpy = vi.fn()
        vi.stubGlobal('open', openSpy)

        const exportButton = wrapper.findAll('.caomei-button')
            .find((button) => button.text().includes('pages.admin.subscribers.export'))!
        await exportButton.trigger('click')

        expect(openSpy).toHaveBeenCalledWith('/api/subscribers/export', '_blank')
    })
})
