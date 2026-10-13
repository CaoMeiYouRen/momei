import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminSubmissions from './index.vue'
import { SubmissionStatus } from '@/types/submission'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/submissions` 首路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`status` → `tone`）、行内动作集合、分页事件（caomei `page` 为 1 基，
 * 页面直接转发、不做减一）、筛选模型映射（关键词输入 / 状态选择，`null` 可往返）。
 * 沿用本仓库既有页面测试的组件 stub 约定；真实渲染（DOM / 计算样式 / 空态文案）
 * 由 E2E 与截图识别层承担。
 */

const { refreshMock, onPageMock, onFilterChangeMock, useAdminListCalls, seedRows } = vi.hoisted(() => ({
    refreshMock: vi.fn(),
    onPageMock: vi.fn(),
    onFilterChangeMock: vi.fn(),
    useAdminListCalls: [] as Record<string, unknown>[],
    seedRows: [] as Record<string, unknown>[],
}))

// Mock 共享列表 composable：既能注入行数据，又记录调用参数（用于断言 `pageIndexBase` 契约）。
vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            useAdminListCalls.push(options)
            const rows = seedRows.slice()

            return {
                items: vue.ref<Record<string, unknown>[]>(rows),
                loading: vue.ref(false),
                pagination: vue.ref({ total: rows.length, limit: 10, page: 1 }),
                onPage: onPageMock,
                onFilterChange: onFilterChangeMock,
                refresh: refreshMock,
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
        formatDateTime: (value: string) => `date:${value}`,
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

const sampleRows: Record<string, unknown>[] = [
    {
        id: 's1',
        title: '稿件一',
        status: SubmissionStatus.PENDING,
        contributorName: '甲',
        contributorEmail: 'a@example.com',
        createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
        id: 's2',
        title: '稿件二',
        status: SubmissionStatus.ACCEPTED,
        contributorName: '乙',
        contributorEmail: 'b@example.com',
        createdAt: '2026-02-02T00:00:00.000Z',
    },
    {
        id: 's3',
        title: '稿件三',
        status: SubmissionStatus.REJECTED,
        contributorName: '丙',
        contributorEmail: 'c@example.com',
        createdAt: '2026-02-03T00:00:00.000Z',
    },
    {
        id: 's4',
        title: '稿件四',
        // 非在册状态：用于覆盖 `getSubmissionStatusTone` 的默认分支。
        status: 'archived',
        contributorName: '丁',
        contributorEmail: 'd@example.com',
        createdAt: '2026-02-04T00:00:00.000Z',
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
        lazy: { type: Boolean, default: false },
        paginator: { type: Boolean, default: false },
        totalRecords: { type: Number, default: 0 },
        rows: { type: Number, default: 10 },
        page: { type: Number, default: 1 },
    },
    emits: ['page'],
    setup(props, { slots, emit }) {
        // 注意：`props.data` / `props.columns` 必须在 render 内读取，否则会捕获挂载前的空数组。
        return () => {
            const columns = props.columns as { key: string, header?: string }[]
            const rows = props.data as Record<string, unknown>[]
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' ? value : JSON.stringify(value)
            }
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string, header?: string }) => {
                const cellSlot = slots[`cell-${column.key}`]
                const content = cellSlot ? cellSlot({ row, value: row[column.key], index, column }) : defaultCell(row[column.key])

                return h('span', { class: 'stub-td', 'data-key': column.key }, content)
            }

            return h('div', { class: 'datatable caomei-data-table' }, [
                h('div', { class: 'stub-headers' }, columns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                }, column.header))),
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => renderCell(row, index, column)))),
                rows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
                h('button', {
                    class: 'stub-next-page',
                    onClick: () => emit('page', { page: (props.page ?? 1) + 1, rows: props.rows, first: 0, pageCount: 2 }),
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
        tone: { type: String, default: '' },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-tone': props.tone,
            'data-icon-only': String(props.iconOnly),
            onClick: () => emit('click'),
        }, slots.icon?.())
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' } },
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
        modelValue: { type: [String, Number], default: null },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: 'label' },
        optionValue: { type: String, default: 'value' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            class: 'status-select',
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as { label: string, value: unknown }[]).map((option) => h('option', {
            value: String(option.value),
        }, option.label)))
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props) => () => h('div', { class: 'admin-header', 'data-title': props.title }, props.title),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        props: { visible: Boolean, title: String },
        setup: () => () => h('div', { class: 'confirm-dialog' }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
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
    Toast: { template: '<div class="toast" />' },
}

async function mountComponent(rows: Record<string, unknown>[] = sampleRows) {
    seedRows.length = 0
    seedRows.push(...rows)

    const wrapper = await mountSuspended(AdminSubmissions, {
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

function cellLabels(wrapper: Awaited<ReturnType<typeof mountComponent>>, rowIndex: number) {
    return wrapper.findAll('.stub-row')[rowIndex]!
        .find('[data-key="actions"]')
        .findAll('.caomei-button')
        .map((button) => button.attributes('data-label'))
}

describe('AdminSubmissions page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAdminListCalls.length = 0
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

    it('声明本页在册列定义（status / contributor / title / createdAt / actions）', async () => {
        const wrapper = await mountComponent()

        const keys = wrapper.findAll('.stub-th').map((node) => node.attributes('data-key'))
        expect(keys).toEqual(['status', 'contributor', 'title', 'createdAt', 'actions'])
    })

    it('列插槽按 row 渲染：状态 / 贡献者 / 日期 / 动作，且 title 走默认取值', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(4)

        expect(rows[0]!.find('[data-key="status"]').text()).toContain('pages.admin.submissions.status_pending')
        expect(rows[0]!.find('[data-key="contributor"]').text()).toContain('甲')
        expect(rows[0]!.find('[data-key="contributor"]').text()).toContain('a@example.com')
        expect(rows[0]!.find('[data-key="createdAt"]').text()).toContain('date:2026-02-01T00:00:00.000Z')
        // title 列无自定义插槽，由表格默认取值渲染 `row.title`。
        expect(rows[0]!.find('[data-key="title"]').text()).toContain('稿件一')
        // 动作列由 `#cell-actions` 插槽提供（非默认取值）。
        expect(rows[0]!.find('[data-key="actions"]').findAll('.caomei-button').length).toBeGreaterThan(0)
    })

    it('状态 Tag 使用 tone 语义色（pending / accepted / rejected / 默认）', async () => {
        const wrapper = await mountComponent()

        const toneOf = (rowIndex: number) => wrapper.findAll('.stub-row')[rowIndex]!
            .find('[data-key="status"]')
            .find('.tag')
            .attributes('data-tone')

        expect(toneOf(0)).toBe('warning')
        expect(toneOf(1)).toBe('success')
        expect(toneOf(2)).toBe('danger')
        expect(toneOf(3)).toBe('neutral')
    })

    it('行内动作按状态收敛（pending 审核 + 删除，其余仅删除）', async () => {
        const wrapper = await mountComponent()

        expect(cellLabels(wrapper, 0)).toEqual(['pages.admin.submissions.review', 'common.delete'])
        expect(cellLabels(wrapper, 1)).toEqual(['common.delete'])
        expect(cellLabels(wrapper, 2)).toEqual(['common.delete'])
        expect(cellLabels(wrapper, 3)).toEqual(['common.delete'])
    })

    it('分页事件为 1 基页码：页面直接把 caomei 载荷转发给 onPage（不做减一）', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.stub-next-page').trigger('click')

        expect(onPageMock).toHaveBeenCalledTimes(1)
        expect(onPageMock).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
        // 页面直接转发：载荷页码与 stub 发出的 1 基页码一致（未被改写为 1）。
        expect((onPageMock.mock.calls[0]![0] as { page: number }).page).toBe(2)
    })

    it('筛选映射：关键词输入的 update:modelValue 触发 onFilterChange', async () => {
        const wrapper = await mountComponent()

        const input = wrapper.findComponent(CaomeiInputStub)
        input.vm.$emit('update:modelValue', 'abc')
        await nextTick()

        expect(input.props('modelValue')).toBe('abc')
        expect(onFilterChangeMock).toHaveBeenCalledTimes(1)
    })

    it('筛选映射：状态选择写回 filters.status，且 null 语义可往返', async () => {
        const wrapper = await mountComponent()

        const select = wrapper.findComponent(CaomeiSelectStub)
        expect(select.props('modelValue')).toBeNull()

        select.vm.$emit('update:modelValue', SubmissionStatus.PENDING)
        await nextTick()
        expect(select.props('modelValue')).toBe(SubmissionStatus.PENDING)
        expect(onFilterChangeMock).toHaveBeenCalledTimes(1)

        select.vm.$emit('update:modelValue', null)
        await nextTick()
        expect(select.props('modelValue')).toBeNull()
        expect(onFilterChangeMock).toHaveBeenCalledTimes(2)
    })

    it('向共享列表 composable 传入 1 基页码契约（pageIndexBase: 1）', async () => {
        await mountComponent()

        expect(useAdminListCalls).toHaveLength(1)
        expect(useAdminListCalls[0]).toEqual(expect.objectContaining({
            url: '/api/admin/submissions',
            pageIndexBase: 1,
        }))
    })
})
