import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminAdCampaigns from './campaigns.vue'
import { CampaignStatus } from '@/types/ad'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/ad/campaigns` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`severity` → `tone`）、日期 / 收益列的渲染与空值回落、
 * 行内动作集合、客户端分页委托、弹窗字段映射（`InputText` → `CaomeiInput`、
 * `Dropdown` → `CaomeiSelect`、`p-invalid` → `:invalid`）与保存校验。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 本页未在 B2 在册族内的 PrimeVue 组件（`DatePicker`）与浮层自身（`Dialog` / `ConfirmDialog`）
 * 显式豁免，维持 PrimeVue；其**内部**在册族组件随本路由迁移（否则命中零残留守卫）。
 */

const { confirmRequireMock, fetchMock, formatDateTimeMock, showErrorToastMock, showSuccessToastMock } = vi.hoisted(() => ({
    confirmRequireMock: vi.fn(),
    fetchMock: vi.fn(),
    formatDateTimeMock: vi.fn((value?: string | Date | null) => value ? `date:${value}` : '-'),
    showErrorToastMock: vi.fn(),
    showSuccessToastMock: vi.fn(),
}))

vi.mock('primevue/useconfirm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/useconfirm')>()

    return {
        ...actual,
        useConfirm: () => ({ require: confirmRequireMock }),
    }
})

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        formatDateTime: formatDateTimeMock,
    }),
}))

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => ({
        showErrorToast: showErrorToastMock,
        showSuccessToast: showSuccessToastMock,
    }),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

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
    {
        id: 'c1',
        name: '夏季推广',
        status: CampaignStatus.ACTIVE,
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-03-01T00:00:00.000Z',
        impressions: 1200,
        clicks: 34,
        revenue: 12.5,
    },
    {
        id: 'c2',
        name: '草稿活动',
        status: CampaignStatus.DRAFT,
        startDate: null,
        endDate: null,
        impressions: 0,
        clicks: 0,
        revenue: undefined,
    },
    { id: 'c3', name: '已暂停', status: CampaignStatus.PAUSED, impressions: 1, clicks: 1, revenue: 1 },
    { id: 'c4', name: '已结束', status: CampaignStatus.ENDED, impressions: 1, clicks: 1, revenue: 1 },
    // 非在册状态：覆盖 `getAdCampaignStatusTone` 的默认分支。
    { id: 'c5', name: '未知', status: 'archived', impressions: 0, clicks: 0, revenue: 0 },
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
                    // caomei `@page` 为 1 基；页面未监听该事件，故点击只用于证明「无页码换算 / 无服务端请求」。
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: 10, pageCount: 2 }),
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
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        // 忠实镜像 caomei-ui：可见文本仅来自默认插槽，`label` 只映射 `aria-label`。
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-tone': props.tone,
            'data-variant': props.variant,
            'data-icon-only': String(props.iconOnly),
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: {
        modelValue: { type: String, default: '' },
        id: { type: String, default: '' },
        invalid: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-input',
            'data-id': props.id,
            'data-invalid': String(props.invalid),
            value: props.modelValue,
            onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
    },
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: [String, Number], default: null },
        options: { type: Array, default: () => [] },
        optionLabel: { type: String, default: 'label' },
        optionValue: { type: String, default: 'value' },
        id: { type: String, default: '' },
        invalid: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            class: 'caomei-select',
            id: props.id,
            'data-invalid': String(props.invalid),
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as { label: string, value: unknown }[]).map((option) => h('option', {
            value: String(option.value),
        }, option.label)))
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
    AdminTableEmptyState: defineComponent({
        name: 'AdminTableEmptyState',
        props: { label: String },
        setup: (props) => () => h('div', { class: 'empty-state' }, props.label),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
    ConfirmDialog: defineComponent({
        name: 'ConfirmDialog',
        setup: () => () => h('div', { class: 'confirm-dialog' }),
    }),
    DatePicker: defineComponent({
        name: 'DatePicker',
        props: ['modelValue', 'showTime', 'hourFormat', 'showSeconds', 'id'],
        setup: () => () => h('div', { class: 'date-picker' }),
    }),
    Dialog: {
        props: ['visible', 'modal', 'header'],
        template: '<div v-if="visible" class="dialog"><header>{{ header }}</header><slot /><slot name="footer" /></div>',
    },
}

async function mountComponent(rows: Record<string, unknown>[] = sampleRows) {
    fetchMock.mockResolvedValue({ data: rows })

    const wrapper = await mountSuspended(AdminAdCampaigns, {
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

function findButtonByText(wrapper: Awaited<ReturnType<typeof mountComponent>>, text: string) {
    const match = wrapper.findAll('.caomei-button').find((button) => button.text().includes(text))

    if (!match) {
        const available = wrapper.findAll('.caomei-button')
            .map((button) => `"${button.text()}"(label=${button.attributes('data-label') ?? '-'})`)
            .join(', ')
        throw new Error(`未找到含可见文本「${text}」的按钮；当前按钮：${available || '(无)'}`)
    }

    return match
}

function actionLabels(wrapper: Awaited<ReturnType<typeof mountComponent>>, rowIndex: number) {
    return wrapper.findAll('.stub-row')[rowIndex]!
        .find('[data-key="actions"]')
        .findAll('.caomei-button')
        .map((button) => button.attributes('data-label'))
}

describe('AdminAdCampaigns page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('渲染页头与创建按钮（可见文案来自默认插槽，非 label）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-list-shell').attributes('data-title')).toBe('pages.admin.ad.campaigns.title')

        const createButton = findButtonByText(wrapper, 'common.create')
        expect(createButton.attributes('data-icon-only')).toBe('false')
        expect(createButton.text()).toContain('common.create')
    })

    it('渲染 caomei 数据表与全局确认浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    })

    it('声明本页在册列定义（名称 / 状态 / 开始 / 结束 / 展示 / 点击 / 收益 / 动作），动作列右对齐', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'name',
            'status',
            'startDate',
            'endDate',
            'impressions',
            'clicks',
            'revenue',
            'actions',
        ])
        // 迁移前动作列以 `class="text-right"` 右对齐，迁移后用列级 `align` 等价还原。
        expect(headers.at(-1)!.attributes('data-align')).toBe('right')
    })

    it('列插槽按 row 渲染：名称 / 展示 / 点击走默认取值，状态 / 日期 / 收益 / 动作走插槽', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(5)

        expect(rows[0]!.find('[data-key="name"]').text()).toBe('夏季推广')
        expect(rows[0]!.find('[data-key="impressions"]').text()).toBe('1200')
        expect(rows[0]!.find('[data-key="clicks"]').text()).toBe('34')

        // 日期列经 `formatDateTime(row.x, 'YYYY-MM-DD HH:mm')` 渲染，空值回落 '-'
        // （迁移前 `data.startDate ? formatDateTime(...) : '-'`）。
        expect(rows[0]!.find('[data-key="startDate"]').text()).toBe('date:2026-02-01T00:00:00.000Z')
        expect(rows[1]!.find('[data-key="startDate"]').text()).toBe('-')
        expect(rows[1]!.find('[data-key="endDate"]').text()).toBe('-')
        // 格式串必须一并透传（否则 mock 的默认返回值会掩盖参数丢失）。
        expect(formatDateTimeMock).toHaveBeenCalledWith('2026-02-01T00:00:00.000Z', 'YYYY-MM-DD HH:mm')

        // 收益列 `${{ revenue?.toFixed(2) || '0.00' }}`：正常值 / `undefined` / `0` 三个边界。
        expect(rows[0]!.find('[data-key="revenue"]').text()).toBe('$12.50')
        expect(rows[1]!.find('[data-key="revenue"]').text()).toBe('$0.00')
        expect(rows[4]!.find('[data-key="revenue"]').text()).toBe('$0.00')

        expect(rows[0]!.find('[data-key="actions"]').findAll('.caomei-button')).toHaveLength(2)
    })

    it('状态 Tag 使用 tone 语义色（active / paused / ended / 默认）', async () => {
        const wrapper = await mountComponent()

        const toneOf = (rowIndex: number) => wrapper.findAll('.stub-row')[rowIndex]!
            .find('[data-key="status"]')
            .find('.tag')
            .attributes('data-tone')

        expect(toneOf(0)).toBe('success')
        expect(toneOf(2)).toBe('warning')
        expect(toneOf(3)).toBe('danger')
        expect(toneOf(1)).toBe('neutral')
        expect(toneOf(4)).toBe('neutral')
    })

    it('行内动作集合为编辑 / 删除，且为 caomei 0.6.0 iconOnly 形态', async () => {
        const wrapper = await mountComponent()

        expect(actionLabels(wrapper, 0)).toEqual(['common.edit', 'common.delete'])

        const buttons = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')

        for (const button of buttons) {
            expect(button.attributes('data-icon-only')).toBe('true')
            expect(button.attributes('data-variant')).toBe('ghost')
        }
        expect(buttons[0]!.attributes('data-tone')).toBe('primary')
        expect(buttons[1]!.attributes('data-tone')).toBe('danger')
    })

    it('客户端分页委托给 caomei DataTable（1 基内部态；页面不传 page / lazy / total-records，也不监听 @page）', async () => {
        const wrapper = await mountComponent()

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('rows')).toBe(10)
        expect(table.props('page')).toBeUndefined()
        expect(table.props('lazy')).toBe(false)
        expect(table.props('totalRecords')).toBeUndefined()

        const callsBefore = fetchMock.mock.calls.length
        await wrapper.find('.stub-next-page').trigger('click')
        // 页面未监听 `@page`：翻页不触发任何服务端请求（也无页码回写）。
        expect(fetchMock.mock.calls.length).toBe(callsBefore)
    })

    it('打开创建弹窗时把字段映射到 CaomeiInput / CaomeiSelect，且校验态为 :invalid', async () => {
        const wrapper = await mountComponent()

        await findButtonByText(wrapper, 'common.create').trigger('click')
        await nextTick()

        const dialog = wrapper.find('.dialog')
        expect(dialog.exists()).toBe(true)

        const input = wrapper.find('.caomei-input')
        expect(input.attributes('data-id')).toBe('name')
        expect(input.attributes('data-invalid')).toBe('false')

        const select = wrapper.find('.caomei-select')
        expect(select.attributes('id')).toBe('status')
        expect(select.findAll('option')).toHaveLength(4)
        expect(select.attributes('data-invalid')).toBe('false')

        // 弹窗页脚按钮渲染默认插槽文案（非纯图标）。
        expect(findButtonByText(wrapper, 'common.cancel').attributes('data-icon-only')).toBe('false')
        expect(findButtonByText(wrapper, 'common.save').text()).toContain('common.save')

        // 浮层自身显式豁免，维持 PrimeVue Dialog / DatePicker；其内部在册族组件已迁移。
        expect(dialog.find('.caomei-input').exists()).toBe(true)
        expect(dialog.find('.caomei-select').exists()).toBe(true)
        expect(dialog.find('.date-picker').exists()).toBe(true)
    })

    it('编辑态：openDialog(row) 把行数据填入表单', async () => {
        const wrapper = await mountComponent()

        const editButton = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')[0]!
        await editButton.trigger('click')
        await nextTick()

        expect((wrapper.find('.caomei-input').element as HTMLInputElement).value).toBe('夏季推广')
        expect((wrapper.find('.caomei-select').element as HTMLSelectElement).value).toBe(CampaignStatus.ACTIVE)
    })

    it('保存校验：缺失名称时把 CaomeiInput 标为 invalid 且不发请求', async () => {
        const wrapper = await mountComponent()

        await findButtonByText(wrapper, 'common.create').trigger('click')
        await nextTick()

        fetchMock.mockClear()

        await findButtonByText(wrapper, 'common.save').trigger('click')
        await nextTick()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.find('.caomei-input[data-id="name"]').attributes('data-invalid')).toBe('true')
    })

    it('删除确认：经全局 confirm 触发，accept 后调用删除接口并刷新列表', async () => {
        const wrapper = await mountComponent()

        const deleteButton = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')[1]!
        await deleteButton.trigger('click')

        expect(confirmRequireMock).toHaveBeenCalledTimes(1)
        const options = confirmRequireMock.mock.calls[0]![0] as { message: string, accept: () => Promise<void> }
        expect(options.message).toBe('pages.admin.ad.campaigns.messages.delete_confirm')

        fetchMock.mockClear()
        await options.accept()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ad/campaigns/c1', { method: 'DELETE' })
    })
})
