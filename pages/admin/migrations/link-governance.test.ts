import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminLinkGovernance from './link-governance.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/migrations/link-governance` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * Tag 语义色映射（`severity` → `tone`，含 `contrast` → `neutral` 的有损近似）、
 * 发起人回退链、摘要单元格、**服务端分页的页码基准切换（PrimeVue 0 基 → caomei 1 基）**、
 * 筛选应用 / 重置的页码归位、执行表单到请求体的映射、apply 按钮的启用门槛、
 * 报告详情渲染（作用域 / 摘要 / 差异项 / redirect seeds）。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 本页未在 B2 在册族内的 PrimeVue 组件（`Card` / `MultiSelect` / `Checkbox` / `ProgressSpinner`）
 * 与浮层自身（`Dialog`）显式豁免，维持 PrimeVue；其**内部**在册族组件随本路由迁移。
 */

const { fetchMock, formatDateTimeMock, showErrorToastMock, showSuccessToastMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    formatDateTimeMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
    showErrorToastMock: vi.fn(),
    showSuccessToastMock: vi.fn(),
}))

mockNuxtImport('useAppApi', () => () => ({ $appFetch: fetchMock }))
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))
mockNuxtImport('useI18nDate', () => () => ({ formatDateTime: formatDateTimeMock }))
mockNuxtImport('useRequestFeedback', () => () => ({
    showErrorToast: showErrorToastMock,
    showSuccessToast: showSuccessToastMock,
}))

vi.stubGlobal('definePageMeta', vi.fn())

const sampleReports: Record<string, unknown>[] = [
    {
        reportId: 'r1',
        createdAt: '2026-02-01T00:00:00.000Z',
        mode: 'dry-run',
        status: 'completed',
        requestedByName: 'Ada',
        requestedByEmail: 'ada@example.com',
        requestedByUserId: 'u1',
        summary: { total: 10, failed: 1, needsConfirmation: 2 },
        redirectSeedCount: 3,
    },
    {
        reportId: 'r2',
        createdAt: '2026-02-02T00:00:00.000Z',
        mode: 'apply',
        status: 'failed',
        requestedByEmail: 'bob@example.com',
        requestedByUserId: 'u2',
        summary: { total: 0, failed: 0, needsConfirmation: 0 },
        redirectSeedCount: 0,
    },
    {
        reportId: 'r3',
        createdAt: '2026-02-03T00:00:00.000Z',
        mode: 'apply',
        status: 'completed',
        requestedByUserId: 'u3',
        summary: { total: 1, failed: 0, needsConfirmation: 0 },
        redirectSeedCount: 1,
    },
]

const sampleDetail = {
    reportId: 'r1',
    mode: 'apply',
    status: 'completed',
    requestedByUserId: 'u1',
    scopes: ['asset-url', 'content-link'],
    summary: { total: 3, resolved: 1, rewritten: 1, failed: 0, needsConfirmation: 1 },
    items: [
        { contentId: 'c1', sourceValue: 'http://old/a.png', targetValue: 'http://new/a.png', scope: 'asset-url', status: 'rewritten' },
        { contentId: 'c2', sourceValue: 'http://old/b', targetValue: null, scope: 'post', status: 'needs-confirmation' },
        { contentId: 'c3', sourceValue: 'http://old/c', targetValue: 'http://new/c', scope: 'page', status: 'resolved' },
        { contentId: 'c4', sourceValue: 'http://old/d', targetValue: null, scope: 'tag', status: 'failed' },
        { contentId: 'c5', sourceValue: 'http://old/e', targetValue: 'http://old/e', scope: 'post', status: 'unchanged' },
    ],
    markdown: '# report',
    redirectSeeds: [
        { source: '/old', target: '/new', statusCode: 301, reason: 'legacy' },
    ],
}

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
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string }) => {
                const cellSlot = slots[`cell-${column.key}`]

                return h('span', { class: 'stub-td', 'data-key': column.key }, cellSlot ? cellSlot({ row, value: row[column.key], index, column }) : '')
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
                    // caomei `@page` 为 1 基。
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: 10, pageCount: 3 }),
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
        disabled: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            'data-variant': props.variant,
            'data-tone': props.tone,
            'data-size': props.size,
            'data-loading': String(props.loading),
            'data-disabled': String(props.disabled),
            // 忠实镜像真实组件：`disabled` / `loading` 时不派发 click（否则门槛用例会假通过）。
            onClick: () => {
                if (!props.disabled && !props.loading) {
                    emit('click')
                }
            },
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: {
        modelValue: { type: String, default: '' },
        id: { type: String, default: '' },
        placeholder: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-input',
            'data-id': props.id,
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
        placeholder: { type: String, default: '' },
        showClear: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            class: 'caomei-select',
            'data-placeholder': props.placeholder,
            'data-clearable': String(props.showClear),
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as Record<string, unknown>[]).map((option) => h('option', {
            value: String(option[props.optionValue]),
        }, String(option[props.optionLabel]))))
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String, showLanguageSwitcher: Boolean },
        setup: (props, { slots }) => () => h('div', { class: 'admin-header', 'data-title': props.title }, [
            slots.actions?.(),
        ]),
    }),
    Card: defineComponent({
        name: 'Card',
        setup: (_props, { slots }) => () => h('div', { class: 'card' }, slots.content?.()),
    }),
    MultiSelect: defineComponent({
        name: 'MultiSelect',
        props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'display', 'id'],
        setup: (props) => () => h('div', { class: 'multi-select', 'data-id': props.id }),
    }),
    Checkbox: defineComponent({
        name: 'Checkbox',
        props: ['modelValue', 'binary', 'id'],
        emits: ['update:modelValue'],
        setup: (props, { emit }) => () => h('input', {
            class: 'checkbox',
            type: 'checkbox',
            id: props.id,
            checked: Boolean(props.modelValue),
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked),
        }),
    }),
    ProgressSpinner: defineComponent({
        name: 'ProgressSpinner',
        setup: () => () => h('div', { class: 'progress-spinner' }),
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
}

/** 让 `$appFetch` 按 URL 分派：报告列表 / 报告详情 / dry-run / apply。 */
function mockFetch({ reports = sampleReports, total = sampleReports.length, detail = sampleDetail } = {}) {
    fetchMock.mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/reports/')) {
            return { data: detail }
        }
        if (typeof url === 'string' && (url.endsWith('/dry-run') || url.endsWith('/apply'))) {
            return { data: { ...detail, reportId: 'r-new' } }
        }

        return { data: { items: reports, total } }
    })
}

async function mountComponent() {
    mockFetch()

    const wrapper = await mountSuspended(AdminLinkGovernance, {
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

/** 报告列表的查询参数（`$appFetch` 的第二个入参）。 */
function listQueries() {
    return fetchMock.mock.calls
        .filter(([url]) => typeof url === 'string' && url.endsWith('/reports'))
        .map(([, options]) => (options as { query?: Record<string, unknown> } | undefined)?.query)
}

describe('AdminLinkGovernance page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('渲染页头与刷新按钮（可见文案来自默认插槽）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-header').attributes('data-title')).toBe('pages.admin.link_governance.title')

        const refreshButton = findButtonByText(wrapper, 'common.refresh')
        expect(refreshButton.attributes('data-variant')).toBe('secondary')
        expect(refreshButton.attributes('data-icon-only')).toBe('false')
    })

    it('渲染 caomei 数据表与详情浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.dialog').exists()).toBe(false)
    })

    it('声明本页在册列定义（createdAt / mode / status / requestedBy / summary / redirects / actions），动作列右对齐', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'createdAt',
            'mode',
            'status',
            'requestedBy',
            'summary',
            'redirects',
            'actions',
        ])
        expect(headers.at(-1)!.attributes('data-align')).toBe('right')
    })

    it('列插槽按 row 渲染：创建时间 / 模式 / 状态 / 发起人回退链 / 摘要 / Redirect Seeds', async () => {
        const wrapper = await mountComponent()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(3)

        // 创建时间经 `formatDateTime`。
        expect(rows[0]!.find('[data-key="createdAt"]').text()).toBe('date:2026-02-01T00:00:00.000Z')

        // 模式 / 状态文案经 i18n key 翻译（测试内 `t` 原样返回 key）。
        expect(rows[0]!.find('[data-key="mode"]').text()).toBe('pages.admin.link_governance.modes.dry-run')
        expect(rows[1]!.find('[data-key="status"]').text()).toBe('pages.admin.link_governance.statuses.failed')

        // 发起人：name → email → userId 的回退链。
        expect(rows[0]!.find('[data-key="requestedBy"]').text()).toContain('Ada')
        expect(rows[0]!.find('[data-key="requestedBy"]').text()).toContain('ada@example.com')
        expect(rows[1]!.find('[data-key="requestedBy"]').text()).toContain('bob@example.com')
        expect(rows[2]!.find('[data-key="requestedBy"]').text()).toContain('u3')

        // 摘要单元格：total / failed / needs_confirmation 三行。
        const summaryText = rows[0]!.find('[data-key="summary"]').text()
        expect(summaryText).toContain('pages.admin.link_governance.summary.total: 10')
        expect(summaryText).toContain('pages.admin.link_governance.summary.failed: 1')
        expect(summaryText).toContain('pages.admin.link_governance.summary.needs_confirmation: 2')

        // Redirect Seeds 列取 `redirectSeedCount`。
        expect(rows[0]!.find('[data-key="redirects"]').text()).toBe('3')
    })

    it('Tag tone 映射：模式 dry-run→primary / apply→success，状态 failed→danger / 其它→success', async () => {
        const wrapper = await mountComponent()

        const toneOf = (rowIndex: number, key: string) => wrapper.findAll('.stub-row')[rowIndex]!
            .find(`[data-key="${key}"] .tag`)
            .attributes('data-tone')

        expect(toneOf(0, 'mode')).toBe('primary')
        expect(toneOf(1, 'mode')).toBe('success')
        expect(toneOf(1, 'status')).toBe('danger')
        expect(toneOf(0, 'status')).toBe('success')
    })

    it('服务端分页：受控 1 基页码 + 1 基 @page 直接采用（迁移前为 0 基 +1）', async () => {
        const wrapper = await mountComponent()

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('lazy')).toBe(true)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('page')).toBe(1)
        expect(table.props('rows')).toBe(10)
        expect(table.props('totalRecords')).toBe(3)

        fetchMock.mockClear()
        await wrapper.find('.stub-next-page').trigger('click')
        await nextTick()

        // `@page` 载荷为 1 基（page: 2）→ 直接写回 `page`（不做 +1），并按新页码重新取数。
        expect(wrapper.findComponent(CaomeiDataTableStub).props('page')).toBe(2)
        expect(listQueries().at(-1)).toMatchObject({ page: 2, limit: 10 })
    })

    it('筛选：应用后页码归位为 1，并把 mode / status 作为查询参数；重置清空筛选', async () => {
        const wrapper = await mountComponent()

        const selects = wrapper.findAll('.caomei-select')
        // DOM 顺序：执行区的校验模式 / 报告格式在前，筛选区的 mode / status 在后（均带 `show-clear`）。
        expect(selects).toHaveLength(4)
        expect(selects[0]!.attributes('data-clearable')).toBe('false')
        expect(selects[2]!.attributes('data-clearable')).toBe('true')
        expect(selects[2]!.attributes('data-placeholder')).toBe('pages.admin.link_governance.filters.mode')

        await selects[2]!.setValue('apply')
        await selects[3]!.setValue('failed')
        await nextTick()

        fetchMock.mockClear()
        await findButtonByText(wrapper, 'pages.admin.link_governance.filters.apply').trigger('click')
        await nextTick()

        expect(listQueries().at(-1)).toMatchObject({ page: 1, mode: 'apply', status: 'failed' })

        fetchMock.mockClear()
        await findButtonByText(wrapper, 'pages.admin.link_governance.filters.reset').trigger('click')
        await nextTick()

        const resetQuery = listQueries().at(-1)!
        expect(resetQuery.page).toBe(1)
        expect(resetQuery.mode).toBeUndefined()
        expect(resetQuery.status).toBeUndefined()
    })

    it('执行表单映射到请求体：dry-run 提交 scopes / filters / options', async () => {
        const wrapper = await mountComponent()

        const domainInput = wrapper.findAll('.caomei-input')[0]!
        await domainInput.setValue('legacy.example.com, old-cdn.example.com')
        // 注意：`<input type="text">` 按 HTML 规范会剥除换行，故换行分隔无法经单行输入产生；
        // 逗号分隔才是该字段的真实可输入形态（`delimiters: /[\n,]/` 的换行分支由纯函数单测覆盖）。
        const prefixInput = wrapper.findAll('.caomei-input')[1]!
        await prefixInput.setValue('/assets, /uploads/legacy')
        await nextTick()

        fetchMock.mockClear()
        mockFetch()

        await findButtonByText(wrapper, 'pages.admin.link_governance.actions.dry_run').trigger('click')
        await nextTick()

        const call = fetchMock.mock.calls.find(([url]) => typeof url === 'string' && url.endsWith('/dry-run'))
        expect(call).toBeTruthy()
        const body = (call![1] as { body: Record<string, any> }).body
        expect(body.scopes).toEqual(['asset-url'])
        expect(body.filters.contentTypes).toEqual(['post'])
        expect(body.filters.domains).toEqual(['legacy.example.com', 'old-cdn.example.com'])
        expect(body.filters.pathPrefixes).toEqual(['/assets', '/uploads/legacy'])
        expect(body.options).toMatchObject({ reportFormat: 'markdown', validationMode: 'static', allowRelativeLinks: false })
        // 未确认 apply 前，dry-run 请求不得携带 reviewedDryRunReportId。
        expect(body.options.reviewedDryRunReportId).toBeUndefined()
        expect(showSuccessToastMock).toHaveBeenCalledWith('pages.admin.link_governance.messages.dry_run_success')
    })

    it('apply 按钮门槛：需同时满足「已确认 apply」与「已有 dry-run 报告」', async () => {
        const wrapper = await mountComponent()
        const applyButton = () => findButtonByText(wrapper, 'pages.admin.link_governance.actions.apply_now')

        // ① 两条件均不满足 → 禁用。
        expect(applyButton().attributes('data-disabled')).toBe('true')

        // ② 仅勾选「确认 apply」（此时尚无 dry-run 报告）→ 仍禁用。
        //    该断言用于**隔离 reviewedDryRunReportId 分支**：若门槛漏掉该条件，此步会失败。
        const applyConfirm = wrapper.findAll('.checkbox').at(-1)!
        expect((applyConfirm.element as HTMLInputElement).id).toBe('link-governance-apply-confirmed')
        await applyConfirm.setValue(true)
        await nextTick()
        expect(applyButton().attributes('data-disabled')).toBe('true')

        // ③ 完成 dry-run（确认仍勾选）→ 两条件齐备 → 启用。
        await findButtonByText(wrapper, 'pages.admin.link_governance.actions.dry_run').trigger('click')
        await nextTick()
        expect(applyButton().attributes('data-disabled')).toBe('false')

        // ④ 点击 apply → 请求体携带 reviewedDryRunReportId。
        fetchMock.mockClear()
        mockFetch()
        await applyButton().trigger('click')
        await nextTick()

        const call = fetchMock.mock.calls.find(([url]) => typeof url === 'string' && url.endsWith('/apply'))
        expect(call).toBeTruthy()
        const body = (call![1] as { body: Record<string, any> }).body
        expect(body.options.reviewedDryRunReportId).toBe('r-new')
    })

    it('查看详情：按 reportId 拉取详情并打开浮层（作用域 / 摘要 / 差异项 tone / redirect seeds）', async () => {
        const wrapper = await mountComponent()

        await findButtonByText(wrapper, 'pages.admin.link_governance.actions.view').trigger('click')
        await nextTick()
        await nextTick()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/migrations/link-governance/reports/r1')
        const dialog = wrapper.find('.dialog')
        expect(dialog.exists()).toBe(true)

        // 作用域 Tag 为 neutral（迁移前 `severity="secondary"`）。
        const scopeTags = dialog.findAll('.admin-link-governance__scope-list .tag')
        expect(scopeTags.map((tag) => tag.text())).toEqual(['asset-url', 'content-link'])
        expect(scopeTags.every((tag) => tag.attributes('data-tone') === 'neutral')).toBe(true)

        // 摘要四项。
        const summaryText = dialog.find('.admin-link-governance__summary-grid').text()
        expect(summaryText).toContain('pages.admin.link_governance.summary.resolved')
        expect(summaryText).toContain('pages.admin.link_governance.summary.rewritten')
        expect(summaryText).toContain('pages.admin.link_governance.summary.needs_confirmation')

        // 差异项状态 tone：rewritten→primary、needs-confirmation→warning、resolved→success、failed→danger、unchanged→success。
        const itemTones = dialog.findAll('.admin-link-governance__diff-item')
            .map((item) => item.findAll('.tag')[1]!.attributes('data-tone'))
        expect(itemTones).toEqual(['primary', 'warning', 'success', 'danger', 'success'])

        // redirect seeds：状态码 primary（迁移前 `severity="info"`）、原因 neutral（`secondary`）。
        const seedTags = dialog.findAll('.admin-link-governance__redirect-item .tag')
        expect(seedTags[0]!.text()).toBe('301')
        expect(seedTags[0]!.attributes('data-tone')).toBe('primary')
        expect(seedTags[1]!.attributes('data-tone')).toBe('neutral')

        // 浮层页脚按钮渲染默认插槽文案。
        expect(findButtonByText(wrapper, 'pages.admin.link_governance.actions.export_json').text())
            .toContain('pages.admin.link_governance.actions.export_json')
        expect(findButtonByText(wrapper, 'common.close').text()).toContain('common.close')
    })

    it('空列表时渲染空态插槽', async () => {
        mockFetch({ reports: [], total: 0 })
        const wrapper = await mountSuspended(AdminLinkGovernance, {
            global: { stubs, mocks: { $t: (key: string) => key } },
        })
        await nextTick()

        expect(wrapper.find('.stub-empty').exists()).toBe(true)
        expect(wrapper.find('.admin-link-governance__empty').text()).toBe('pages.admin.link_governance.empty')
    })

    it('列表加载失败时走统一错误提示', async () => {
        fetchMock.mockRejectedValue(new Error('boom'))
        await mountSuspended(AdminLinkGovernance, {
            global: { stubs, mocks: { $t: (key: string) => key } },
        })
        await nextTick()
        await nextTick()

        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.link_governance.messages.load_failed',
        })
    })

    it('详情加载失败时关闭浮层并提示', async () => {
        const wrapper = await mountComponent()

        fetchMock.mockImplementation(async (url: string) => {
            if (typeof url === 'string' && url.includes('/reports/')) {
                throw new Error('detail boom')
            }

            return { data: { items: sampleReports, total: sampleReports.length } }
        })

        await findButtonByText(wrapper, 'pages.admin.link_governance.actions.view').trigger('click')
        await nextTick()
        await nextTick()

        expect(showErrorToastMock).toHaveBeenCalledWith(expect.any(Error), {
            fallbackKey: 'pages.admin.link_governance.messages.detail_failed',
        })
        expect(wrapper.find('.dialog').exists()).toBe(false)
    })

    it('未在册族的 PrimeVue 组件仍保留（Card / MultiSelect / Checkbox / ProgressSpinner）', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.findAll('.card')).toHaveLength(2)
        expect(wrapper.findAll('.multi-select')).toHaveLength(2)
        expect(wrapper.findAll('.checkbox')).toHaveLength(2)
    })
})
