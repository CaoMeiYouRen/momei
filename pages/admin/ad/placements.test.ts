import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminAdPlacements from './placements.vue'
import { AdFormat, AdLocation } from '@/types/ad'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/ad/placements` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`severity` → `tone`）、适配器名解析与未知回退、行内动作集合
 * （含启停按钮的**可访问名随状态翻转**与 lucide 图标分支）、客户端分页委托、
 * 弹窗字段映射（`InputText` → `CaomeiInput`、`Dropdown` → `CaomeiSelect`、`p-invalid` → `:invalid`）、
 * 保存校验、删除确认与启停请求体。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 本页未在 B2 在册族内的 PrimeVue 组件（`InputNumber` / `Checkbox`）与浮层自身
 * （`Dialog` / `ConfirmDialog`）显式豁免，维持 PrimeVue；其**内部**在册族组件随本路由迁移。
 */

const { confirmRequireMock, fetchMock, showErrorToastMock, showSuccessToastMock } = vi.hoisted(() => ({
    confirmRequireMock: vi.fn(),
    fetchMock: vi.fn(),
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
        id: 'p1',
        name: '侧边栏广告',
        location: AdLocation.SIDEBAR,
        format: AdFormat.RESPONSIVE,
        adapterId: 'adsense',
        metadata: { slot: 'ca-pub-1/2' },
        priority: 10,
        enabled: true,
    },
    {
        id: 'p2',
        name: '页脚广告',
        location: AdLocation.FOOTER,
        format: AdFormat.DISPLAY,
        adapterId: 'unknown-adapter',
        metadata: {},
        priority: 0,
        enabled: false,
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
        // 忠实镜像 caomei-ui：可见文本仅来自默认插槽，`label` 只映射 `aria-label`（本 stub 记为 data-label）。
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
        id: { type: String, default: '' },
        placeholder: { type: String, default: '' },
        invalid: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-input',
            'data-id': props.id,
            'data-invalid': String(props.invalid),
            placeholder: props.placeholder,
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
        // 忠实镜像 caomei-ui：`optionLabel` / `optionValue` 决定读取选项的哪个字段
        // （本页适配器选项用 `{ id, name }`，靠 `option-value="id"` / `option-label="name"` 映射）。
        return () => h('select', {
            class: 'caomei-select',
            'data-id': props.id,
            'data-invalid': String(props.invalid),
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as Record<string, unknown>[]).map((option) => h('option', {
            value: String(option[props.optionValue]),
        }, String(option[props.optionLabel]))))
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
    InputNumber: defineComponent({
        name: 'InputNumber',
        props: ['modelValue', 'min', 'max', 'id'],
        setup: () => () => h('div', { class: 'input-number' }),
    }),
    Checkbox: defineComponent({
        name: 'Checkbox',
        props: ['modelValue', 'binary', 'inputId'],
        setup: () => () => h('input', { class: 'checkbox', type: 'checkbox' }),
    }),
    Dialog: {
        props: ['visible', 'modal', 'header'],
        template: '<div v-if="visible" class="dialog"><header>{{ header }}</header><slot /><slot name="footer" /></div>',
    },
}

async function mountComponent(rows: Record<string, unknown>[] = sampleRows) {
    fetchMock.mockResolvedValue({ data: rows })

    const wrapper = await mountSuspended(AdminAdPlacements, {
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

function actionButtons(wrapper: Awaited<ReturnType<typeof mountComponent>>, rowIndex: number) {
    return wrapper.findAll('.stub-row')[rowIndex]!
        .find('[data-key="actions"]')
        .findAll('.caomei-button')
}

describe('AdminAdPlacements page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('渲染页头与创建按钮（可见文案来自默认插槽，非 label）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-list-shell').attributes('data-title')).toBe('pages.admin.ad.placements.title')

        const createButton = findButtonByText(wrapper, 'common.create')
        expect(createButton.attributes('data-icon-only')).toBe('false')
        expect(createButton.text()).toContain('common.create')
    })

    it('渲染 caomei 数据表与全局确认浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    })

    it('声明本页在册列定义（名称 / 位置 / 格式 / 适配器 / 状态 / 优先级 / 动作），动作列右对齐', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'name',
            'location',
            'format',
            'adapterId',
            'enabled',
            'priority',
            'actions',
        ])
        expect(headers.at(-1)!.attributes('data-align')).toBe('right')
    })

    it('列插槽按 row 渲染：名称 / 优先级走默认取值，位置 / 格式 / 适配器 / 状态走插槽', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(2)

        expect(rows[0]!.find('[data-key="name"]').text()).toBe('侧边栏广告')
        expect(rows[0]!.find('[data-key="priority"]').text()).toBe('10')

        // 位置 / 格式 Tag：text 为原始枚举值（迁移前 `:value="data.location"` / `:value="data.format"`）。
        expect(rows[0]!.find('[data-key="location"]').text()).toBe(AdLocation.SIDEBAR)
        expect(rows[0]!.find('[data-key="format"]').text()).toBe(AdFormat.RESPONSIVE)

        // 适配器列经 `getAdapterName` 解析：已知 id → 名称；未知 id → 原样回退。
        expect(rows[0]!.find('[data-key="adapterId"]').text()).toBe('Google AdSense')
        expect(rows[1]!.find('[data-key="adapterId"]').text()).toBe('unknown-adapter')

        // 状态列文案随 enabled 翻转（迁移前 `data.enabled ? enabled : disabled`）。
        expect(rows[0]!.find('[data-key="enabled"]').text()).toBe('pages.admin.ad.placements.enabled')
        expect(rows[1]!.find('[data-key="enabled"]').text()).toBe('pages.admin.ad.placements.disabled')
    })

    it('Tag tone 映射：位置 neutral / 格式 primary / 状态 success 与 danger', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        const toneOf = (rowIndex: number, key: string) => rows[rowIndex]!
            .find(`[data-key="${key}"] .tag`)
            .attributes('data-tone')

        // 位置：迁移前 `severity="secondary"` → 有损近似 `neutral`。
        expect(toneOf(0, 'location')).toBe('neutral')
        // 格式：迁移前 `severity="info"` → §6.2 `primary`。
        expect(toneOf(0, 'format')).toBe('primary')
        // 状态：`success` / `danger` 直通。
        expect(toneOf(0, 'enabled')).toBe('success')
        expect(toneOf(1, 'enabled')).toBe('danger')
    })

    it('行内动作集合为编辑 / 启停 / 删除，且为 caomei 0.6.0 iconOnly 形态', async () => {
        const wrapper = await mountComponent()

        const buttons = actionButtons(wrapper, 0)
        expect(buttons.map((button) => button.attributes('data-label'))).toEqual([
            'common.edit',
            'pages.admin.ad.placements.actions.disable',
            'common.delete',
        ])

        for (const button of buttons) {
            expect(button.attributes('data-icon-only')).toBe('true')
            expect(button.attributes('data-variant')).toBe('ghost')
        }
        expect(buttons.map((button) => button.attributes('data-tone'))).toEqual(['primary', 'warning', 'danger'])
    })

    it('启停按钮的可访问名随行状态翻转（迁移前该按钮无可访问名，迁移时按 caomei iconOnly 契约补齐）', async () => {
        const wrapper = await mountComponent()

        expect(actionButtons(wrapper, 0)[1]!.attributes('data-label')).toBe('pages.admin.ad.placements.actions.disable')
        expect(actionButtons(wrapper, 1)[1]!.attributes('data-label')).toBe('pages.admin.ad.placements.actions.enable')
        // 图标分支必须**可判别**：仅断言「渲染了 svg」无法发现 EyeOff / Eye 写反
        // （lucide 会把组件名落到 `svg.lucide-*` 类上）。
        const toggle0 = actionButtons(wrapper, 0)[1]!
        const toggle1 = actionButtons(wrapper, 1)[1]!
        expect(toggle0.find('svg.lucide-eye-off').exists()).toBe(true)
        expect(toggle0.find('svg.lucide-eye').exists()).toBe(false)
        expect(toggle1.find('svg.lucide-eye').exists()).toBe(true)
        expect(toggle1.find('svg.lucide-eye-off').exists()).toBe(false)
    })

    it('客户端分页委托给 caomei DataTable（不传 page / lazy / total-records，也不监听 @page）', async () => {
        const wrapper = await mountComponent()

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('rows')).toBe(10)
        expect(table.props('page')).toBeUndefined()
        expect(table.props('lazy')).toBe(false)
        expect(table.props('totalRecords')).toBeUndefined()

        const callsBefore = fetchMock.mock.calls.length
        await wrapper.find('.stub-next-page').trigger('click')
        expect(fetchMock.mock.calls.length).toBe(callsBefore)
    })

    it('打开创建弹窗时把字段映射到 CaomeiInput / CaomeiSelect，且校验态为 :invalid', async () => {
        const wrapper = await mountComponent()

        await findButtonByText(wrapper, 'common.create').trigger('click')
        await nextTick()

        const dialog = wrapper.find('.dialog')
        expect(dialog.exists()).toBe(true)

        const inputs = wrapper.findAll('.caomei-input')
        expect(inputs.map((input) => input.attributes('data-id'))).toEqual(['name', 'metadata_slot'])
        expect(inputs.every((input) => input.attributes('data-invalid') === 'false')).toBe(true)
        expect(inputs[1]!.attributes('placeholder')).toBe('pages.admin.ad.placements.slot_id_placeholder')

        const selects = wrapper.findAll('.caomei-select')
        expect(selects.map((select) => select.attributes('data-id'))).toEqual(['location', 'format', 'adapterId'])
        expect(selects.map((select) => select.findAll('option').length)).toEqual([6, 4, 3])
        expect(selects.every((select) => select.attributes('data-invalid') === 'false')).toBe(true)
        // 选项文本必须来自 i18n / 适配器名（而非 key 或空白），否则「只数 option 个数」会掩盖
        // `option-label` 丢失（本页 i18n 键在测试里被 stub 为原样返回，故断言 key 文本）。
        expect(selects[0]!.findAll('option')[0]!.text()).toBe('pages.admin.ad.placements.locations.header')
        expect(selects[1]!.findAll('option')[0]!.text()).toBe('pages.admin.ad.placements.formats.display')
        // 适配器选项的文本取 `name` 字段（`option-label="name"`），不是 `label` / 空串。
        expect(selects[2]!.findAll('option').map((option) => option.text())).toEqual([
            'Google AdSense',
            '百度联盟',
            '腾讯广告 (广点通)',
        ])

        // 弹窗页脚按钮渲染默认插槽文案（非纯图标）。
        expect(findButtonByText(wrapper, 'common.cancel').attributes('data-icon-only')).toBe('false')
        expect(findButtonByText(wrapper, 'common.save').text()).toContain('common.save')

        // 浮层自身与不在册族的表单控件维持 PrimeVue。
        expect(dialog.find('.input-number').exists()).toBe(true)
        expect(dialog.find('.checkbox').exists()).toBe(true)
        expect(dialog.find('.caomei-input').exists()).toBe(true)
        expect(dialog.find('.caomei-select').exists()).toBe(true)
    })

    it('编辑态：openDialog(row) 把行数据填入表单', async () => {
        const wrapper = await mountComponent()

        await actionButtons(wrapper, 0)[0]!.trigger('click')
        await nextTick()

        const inputs = wrapper.findAll('.caomei-input')
        expect((inputs[0]!.element as HTMLInputElement).value).toBe('侧边栏广告')
        expect((inputs[1]!.element as HTMLInputElement).value).toBe('ca-pub-1/2')

        const selects = wrapper.findAll('.caomei-select')
        expect((selects[0]!.element as HTMLSelectElement).value).toBe(AdLocation.SIDEBAR)
        expect((selects[1]!.element as HTMLSelectElement).value).toBe(AdFormat.RESPONSIVE)
        expect((selects[2]!.element as HTMLSelectElement).value).toBe('adsense')
    })

    it('保存校验：缺失名称时把 CaomeiInput 标为 invalid 且不发请求', async () => {
        const wrapper = await mountComponent()

        await findButtonByText(wrapper, 'common.create').trigger('click')
        await nextTick()

        // 清空名称（新建弹窗的 `name` 默认为空，故直接保存即命中校验分支）。
        fetchMock.mockClear()

        await findButtonByText(wrapper, 'common.save').trigger('click')
        await nextTick()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.find('.caomei-input[data-id="name"]').attributes('data-invalid')).toBe('true')
    })

    it('删除确认：经全局 confirm 触发，accept 后调用删除接口', async () => {
        const wrapper = await mountComponent()

        await actionButtons(wrapper, 0)[2]!.trigger('click')

        expect(confirmRequireMock).toHaveBeenCalledTimes(1)
        const options = confirmRequireMock.mock.calls[0]![0] as { message: string, accept: () => Promise<void> }
        expect(options.message).toBe('pages.admin.ad.placements.messages.delete_confirm')

        fetchMock.mockClear()
        await options.accept()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ad/placements/p1', { method: 'DELETE' })
    })

    it('启停按钮：PUT 同一资源并翻转 enabled，成功提示随原状态选择', async () => {
        const wrapper = await mountComponent()

        fetchMock.mockClear()
        fetchMock.mockResolvedValue({ data: [] })

        await actionButtons(wrapper, 0)[1]!.trigger('click')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ad/placements/p1', {
            method: 'PUT',
            body: expect.objectContaining({ id: 'p1', enabled: false }),
        })
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.ad.placements.messages.disable_success')

        showSuccessToastMock.mockClear()
        await actionButtons(wrapper, 1)[1]!.trigger('click')

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/ad/placements/p2', {
            method: 'PUT',
            body: expect.objectContaining({ id: 'p2', enabled: true }),
        })
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.ad.placements.messages.enable_success')
    })

    it('空列表时渲染空态插槽（AdminTableEmptyState）', async () => {
        const wrapper = await mountComponent([])
        expect(wrapper.find('.stub-empty').exists()).toBe(true)
        expect(wrapper.find('.empty-state').text()).toBe('pages.admin.ad.placements.empty')
    })
})
