import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminExternalLinks from './index.vue'
import { LinkStatus } from '@/types/ad'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/external-links` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`status` → `tone`）、跳转页图标分支、行内动作集合、客户端分页委托
 * 与弹窗字段映射（`InputText` → `CaomeiInput`、`Dropdown` → `CaomeiSelect`、`p-invalid` → `:invalid`）。
 * 沿用本仓库既有页面测试的组件 stub 约定；真实渲染（DOM / 计算样式 / 空态文案）
 * 由 E2E 与截图识别层承担。
 *
 * 分页自证：本页是**客户端分页**（迁移前 PrimeVue 表格也未接服务端分页），迁移后把分页完全委托给
 * caomei `DataTable` 的受控前 1 基内部态——页面**不传** `page` / `lazy` / `total-records`，也**不监听**
 * `@page`，因此不存在 PrimeVue（0 基）与 caomei（1 基）之间的页码换算，无 `pageIndexBase` 契约需要声明。
 */

const { confirmRequireMock, fetchMock, formatDateTimeMock, showErrorToastMock, showSuccessToastMock } = vi.hoisted(() => ({
    confirmRequireMock: vi.fn(),
    fetchMock: vi.fn(),
    formatDateTimeMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
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
        id: 'l1',
        shortCode: 'abc123',
        originalUrl: 'https://example.com/one',
        status: LinkStatus.ACTIVE,
        clickCount: 5,
        showRedirectPage: true,
    },
    {
        id: 'l2',
        shortCode: 'def456',
        originalUrl: 'https://example.com/two',
        status: LinkStatus.BLOCKED,
        clickCount: 0,
        showRedirectPage: false,
    },
    {
        id: 'l3',
        shortCode: 'ghi789',
        originalUrl: 'https://example.com/three',
        status: LinkStatus.EXPIRED,
        clickCount: 12,
        showRedirectPage: true,
    },
    {
        id: 'l4',
        shortCode: 'jkl000',
        // 非在册状态：用于覆盖 `getExternalLinkStatusTone` 的默认分支。
        status: 'archived',
        clickCount: 1,
        showRedirectPage: false,
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
            const columns = props.columns as { key: string, header?: string }[]
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
        size: { type: String, default: '' },
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
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
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
            placeholder: props.placeholder,
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
            'data-invalid': String(props.invalid),
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
        props: { title: String, showLanguageSwitcher: Boolean },
        setup: (props, { slots }) => () => h('div', { class: 'admin-header', 'data-title': props.title }, [
            props.title,
            slots.actions?.(),
        ]),
    }),
    ConfirmDialog: defineComponent({
        name: 'ConfirmDialog',
        setup: () => () => h('div', { class: 'confirm-dialog' }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
    Dialog: {
        props: ['visible', 'modal', 'header'],
        template: '<div v-if="visible" class="dialog"><header>{{ header }}</header><slot /><slot name="footer" /></div>',
    },
    Checkbox: {
        props: ['modelValue', 'binary', 'inputId'],
        emits: ['update:modelValue'],
        template: '<input type="checkbox" :checked="modelValue" :id="inputId" />',
    },
}

async function mountComponent(rows: Record<string, unknown>[] = sampleRows) {
    fetchMock.mockResolvedValue({ data: rows })

    const wrapper = await mountSuspended(AdminExternalLinks, {
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

function actionLabels(wrapper: Awaited<ReturnType<typeof mountComponent>>, rowIndex: number) {
    return wrapper.findAll('.stub-row')[rowIndex]!
        .find('[data-key="actions"]')
        .findAll('.caomei-button')
        .map((button) => button.attributes('data-label'))
}

describe('AdminExternalLinks page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('渲染页头与创建按钮', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-header').exists()).toBe(true)
        expect(wrapper.find('.admin-header').attributes('data-title')).toBe('pages.admin.external_links.title')

        const createButton = wrapper.findAll('.caomei-button')
            .find((button) => button.attributes('data-label') === 'common.create')
        expect(createButton).toBeTruthy()
    })

    it('渲染 caomei 数据表与全局确认浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    })

    it('声明本页在册列定义（shortCode / originalUrl / status / clickCount / showRedirectPage / actions）', async () => {
        const wrapper = await mountComponent()

        const keys = wrapper.findAll('.stub-th').map((node) => node.attributes('data-key'))
        expect(keys).toEqual(['shortCode', 'originalUrl', 'status', 'clickCount', 'showRedirectPage', 'actions'])
    })

    it('列插槽按 row 渲染：短码 / 原始链接 / 跳转页 / 动作，且点击次数走默认取值', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(4)

        // 短码列：`code` 文本 + 复制图标按钮（迁移前为 PrimeVue 按钮 + `pi pi-copy`）。
        const shortCodeCell = rows[0]!.find('[data-key="shortCode"]')
        expect(shortCodeCell.text()).toContain('abc123')
        expect(shortCodeCell.find('.short-code').exists()).toBe(true)
        expect(shortCodeCell.findAll('.caomei-button').map((button) => button.attributes('data-label'))).toEqual(['common.copy'])

        // 原始链接列：截断容器 + `title` 提示。
        const urlCell = rows[0]!.find('[data-key="originalUrl"]')
        expect(urlCell.text()).toContain('https://example.com/one')
        expect(urlCell.find('.url-truncate').attributes('title')).toBe('https://example.com/one')

        // 点击次数列无自定义插槽，由表格默认取值渲染 `row.clickCount`。
        expect(rows[0]!.find('[data-key="clickCount"]').text()).toBe('5')

        // 动作列由 `#cell-actions` 插槽提供（非默认取值）。
        expect(rows[0]!.find('[data-key="actions"]').findAll('.caomei-button')).toHaveLength(3)
    })

    it('跳转页列按布尔值渲染成功 / 次级图标（迁移前为 PrimeVue 勾选 / 叉号图标）', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows[0]!.find('[data-key="showRedirectPage"] .text-success').exists()).toBe(true)
        expect(rows[0]!.find('[data-key="showRedirectPage"] .text-secondary').exists()).toBe(false)
        expect(rows[1]!.find('[data-key="showRedirectPage"] .text-secondary').exists()).toBe(true)
        expect(rows[1]!.find('[data-key="showRedirectPage"] .text-success').exists()).toBe(false)
    })

    it('状态 Tag 使用 tone 语义色（active / blocked / expired / 默认）', async () => {
        const wrapper = await mountComponent()

        const toneOf = (rowIndex: number) => wrapper.findAll('.stub-row')[rowIndex]!
            .find('[data-key="status"]')
            .find('.tag')
            .attributes('data-tone')

        expect(toneOf(0)).toBe('success')
        expect(toneOf(1)).toBe('danger')
        expect(toneOf(2)).toBe('warning')
        expect(toneOf(3)).toBe('neutral')
    })

    it('行内动作集合为统计 / 编辑 / 删除（stats + edit + delete）', async () => {
        const wrapper = await mountComponent()

        expect(actionLabels(wrapper, 0)).toEqual([
            'pages.admin.external_links.stats',
            'common.edit',
            'common.delete',
        ])
    })

    it('行内图标按钮使用 caomei 0.6.0 iconOnly，不再依赖本地 padding 补丁', async () => {
        const wrapper = await mountComponent()

        const buttons = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')

        for (const button of buttons) {
            expect(button.attributes('data-icon-only')).toBe('true')
            expect(button.attributes('data-variant')).toBe('ghost')
        }
        expect(buttons[0]!.attributes('data-tone')).toBe('primary')
        expect(buttons[2]!.attributes('data-tone')).toBe('danger')
    })

    it('客户端分页委托给 caomei DataTable（1 基内部态；页面不传 page / lazy / total-records，也不监听 @page）', async () => {
        const wrapper = await mountComponent()

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('rows')).toBe(10)
        // 不进入受控分页：页码由 caomei 自持（1 基），因此无需 PrimeVue 0 基 → caomei 1 基换算。
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

        const createButton = wrapper.findAll('.caomei-button')
            .find((button) => button.attributes('data-label') === 'common.create')!
        await createButton.trigger('click')
        await nextTick()

        const dialog = wrapper.find('.dialog')
        expect(dialog.exists()).toBe(true)

        const inputs = wrapper.findAll('.caomei-input')
        expect(inputs).toHaveLength(2)
        // `InputText` → `CaomeiInput`：`id` 落在内层输入框，供 `<label for>` 关联。
        expect(inputs.map((input) => input.attributes('data-id'))).toEqual(['originalUrl', 'metadata_title'])
        // 初始无校验错误（`p-invalid` 类映射为 `:invalid` 布尔）。
        expect(inputs[0]!.attributes('data-invalid')).toBe('false')

        const select = wrapper.find('.caomei-select')
        expect(select.exists()).toBe(true)
        expect(select.findAll('option')).toHaveLength(3)
        expect(select.attributes('data-invalid')).toBe('false')

        // 浮层自身显式豁免，维持 PrimeVue Dialog；其内部在册族组件已迁移。
        expect(dialog.find('.caomei-input').exists()).toBe(true)
        expect(dialog.find('.caomei-select').exists()).toBe(true)
    })

    it('保存校验：缺失原始链接时把 CaomeiInput 标为 invalid 且不发请求', async () => {
        const wrapper = await mountComponent()

        const createButton = wrapper.findAll('.caomei-button')
            .find((button) => button.attributes('data-label') === 'common.create')!
        await createButton.trigger('click')
        await nextTick()

        fetchMock.mockClear()

        const saveButton = wrapper.findAll('.caomei-button')
            .find((button) => button.attributes('data-label') === 'common.save')!
        await saveButton.trigger('click')
        await nextTick()

        expect(fetchMock).not.toHaveBeenCalled()
        expect(wrapper.find('.caomei-input[data-id="originalUrl"]').attributes('data-invalid')).toBe('true')
    })

    it('删除确认：经全局 confirm 触发，accept 后调用删除接口', async () => {
        const wrapper = await mountComponent()

        const deleteButton = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')[2]!
        await deleteButton.trigger('click')

        expect(confirmRequireMock).toHaveBeenCalledTimes(1)
        const options = confirmRequireMock.mock.calls[0]![0] as { message: string, accept: () => Promise<void> }
        expect(options.message).toBe('pages.admin.external_links.messages.delete_confirm')

        fetchMock.mockClear()
        await options.accept()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/external-links/l1', { method: 'DELETE' })
    })

    it('统计弹窗：点击统计动作按行 id 请求统计接口并打开 Dialog', async () => {
        const wrapper = await mountComponent()

        fetchMock.mockClear()
        fetchMock.mockResolvedValue({ data: { shortCode: 'abc123', clickCount: 9, originalUrl: 'https://example.com/one', createdAt: '2026-02-01T00:00:00.000Z' } })

        const statsButton = wrapper.findAll('.stub-row')[0]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')[0]!
        await statsButton.trigger('click')
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/external-links/l1/stats')
        expect(wrapper.find('.stats-container').exists()).toBe(true)
        expect(wrapper.find('.stats-container').text()).toContain('abc123')
    })
})
