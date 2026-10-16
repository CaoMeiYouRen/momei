import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { CaomeiDataTableStub, caomeiComponentStubs } from '../../../tests/helpers/caomei-component-stubs'
import AdminAiTaskList from './task-list.vue'
import type { AIAdminTaskListItem } from '@/types/ai'

/**
 * `/admin/ai` 任务列表（路由自有组件）的迁移契约用例。
 *
 * 覆盖「迁移不改语义」的落点：列定义与迁移前列组件一一对应、`Tag` 的可见文案与 `tone` 词表转换、
 * 图标由 primeicons 字体类换成 lucide 组件、`Avatar` 走共享壳过渡组件、行多选与受控分页契约。
 */

vi.mock('@/utils/shared/number', () => ({ formatDecimal: (value: unknown) => `decimal:${String(value)}` }))
vi.mock('@/utils/shared/ai-cost', () => ({ formatAICost: (value: unknown) => `cost:${String(value)}` }))

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
    locales: ref([{ code: 'zh-CN' }]),
}))
vi.stubGlobal('useI18nDate', () => ({ formatDateTime: (value: unknown) => `date:${String(value)}` }))

/* 只填用例断言用到的字段，其余按类型断言补齐（用例关注渲染契约，不复制完整类型形状）。 */
const rows = [
    {
        id: 'task-1',
        category: 'text_generation',
        type: 'tts',
        provider: 'openai',
        model: 'tts-1',
        user_name: 'Alice',
        user_email: 'alice@example.com',
        status: 'completed',
        quotaUnits: 12,
        actualCost: 0.5,
        chargeStatus: 'actual',
        createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
        id: 'task-2',
        category: null,
        type: 'unknown_type',
        provider: null,
        model: 'x',
        user_name: null,
        status: 'failed',
        quotaUnits: 0,
        actualCost: null,
        chargeStatus: null,
        createdAt: '2026-02-02T00:00:00.000Z',
    },
] as unknown as AIAdminTaskListItem[]

const mountList = async (overrides: Record<string, unknown> = {}) => {
    const wrapper = await mountSuspended(AdminAiTaskList, {
        props: {
            tasks: rows,
            total: 2,
            loading: false,
            pageSize: 10,
            page: 2,
            // 两个 `defineModel`（`selection` / `filters`）的默认值：不传会让组件内 `filters.search` 取空。
            selection: [],
            filters: { search: '', type: null, status: null },
            ...overrides,
        },
        global: { stubs: caomeiComponentStubs },
    })

    return { wrapper }
}

describe('AdminAiTaskList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('列定义与迁移前 PrimeVue 列一一对应（11 个数据列；选择列由 selection-mode 内建）', async () => {
        const { wrapper } = await mountList()
        const keys = (wrapper.findComponent(CaomeiDataTableStub).props('columns') as { key: string }[]).map((column) => column.key)

        expect(keys).toEqual([
            'category', 'type', 'provider', 'model', 'user', 'status',
            'quotaUnits', 'actualCost', 'chargeStatus', 'createdAt', 'actions',
        ])
    })

    it('行多选 + 受控分页契约：selection-mode / row-key / page / rows / lazy', async () => {
        const { wrapper } = await mountList()
        const table = wrapper.findComponent(CaomeiDataTableStub)

        expect(table.props('selectionMode')).toBe('multiple')
        expect(table.props('rowKey')).toBe('id')
        expect(table.props('page')).toBe(2)
        expect(table.props('rows')).toBe(10)
        expect(table.props('lazy')).toBe(true)
        expect(table.props('totalRecords')).toBe(2)
    })

    it('分类标签：`CaomeiTag` 用默认插槽承载可见文案（该组件无 value prop）；空值回落 `-`', async () => {
        const { wrapper } = await mountList()
        const cells = wrapper.findAll('.stub-td[data-key="category"]')

        expect(cells[0]?.text()).toBe('pages.admin.ai.types.text_generation')
        expect(cells[1]?.text()).toBe('-')
    })

    it('类型列：图标由 primeicons 字体类换成 lucide 组件（保留文案；未知类型回落默认图标）', async () => {
        const { wrapper } = await mountList()
        const cells = wrapper.findAll('.stub-td[data-key="type"]')

        expect(cells[0]?.find('svg').exists()).toBe(true)
        expect(cells[0]?.text()).toContain('pages.admin.ai.types.tts')
        // 第二行 type 为 `unknown_type`：命中 `?? AlignLeft` 兜底分支（去兜底会渲染空图标位）。
        expect(cells[1]?.find('svg').exists()).toBe(true)
    })

    it('供应商标签：`secondary` + `outlined` → `tone="neutral"` + `variant="outline"`；可见文案落默认插槽', async () => {
        const { wrapper } = await mountList()
        const tag = wrapper.find('.stub-td[data-key="provider"] .caomei-tag')

        expect(tag.attributes('data-tone')).toBe('neutral')
        expect(tag.attributes('data-variant')).toBe('outline')
        // `CaomeiTag` 无 `value` prop：误用 `:value` 会静默丢文案，故逐格断言文本。
        expect(tag.text()).toBe('openai')
    })

    it('状态标签：severity → tone 逐档转换（completed→success / failed→danger）；可见文案落默认插槽', async () => {
        const { wrapper } = await mountList()
        const tags = wrapper.findAll('.stub-td[data-key="status"] .caomei-tag')

        expect(tags.map((tag) => tag.attributes('data-tone'))).toEqual(['success', 'danger'])
        expect(tags.map((tag) => tag.text())).toEqual([
            'pages.admin.ai.statuses.completed',
            'pages.admin.ai.statuses.failed',
        ])
    })

    it('费用状态标签：actual→success；可见文案落默认插槽；空值回落 `-`', async () => {
        const { wrapper } = await mountList()
        const cells = wrapper.findAll('.stub-td[data-key="chargeStatus"]')

        expect(cells[0]?.find('.caomei-tag').attributes('data-tone')).toBe('success')
        expect(cells[0]?.find('.caomei-tag').text()).toBe('pages.admin.ai.charge_statuses.actual')
        expect(cells[1]?.text()).toBe('-')
    })

    it('作者列：走共享壳过渡组件 `AppAvatarV2`（组件内按路由择库）', async () => {
        const { wrapper } = await mountList()
        const cell = wrapper.find('.stub-td[data-key="user"]')

        expect(cell.findComponent({ name: 'AppAvatarV2' }).exists()).toBe(true)
        expect(cell.text()).toContain('Alice')
    })

    it('行内动作：`icon-only` 按钮补 `:label` 可访问名（迁移前无可访问名）', async () => {
        const { wrapper } = await mountList()
        const buttons = wrapper.findAll('.stub-row')[0]?.findAll('.stub-td[data-key="actions"] .caomei-button') ?? []

        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        // 模板内的 `$t` 走真实 i18n 实例，故期望值同源取自 `vm.$t`。
        expect(buttons.map((button) => button.attributes('data-label'))).toEqual([$t('pages.admin.ai.task_detail.title'), $t('common.delete')])
    })

    it('批量删除：`outlined` + `danger` → `variant="secondary"` + `tone="danger"`，`:disabled` 随选区联动', async () => {
        const { wrapper } = await mountList()
        const filterButtons = wrapper.findAll('.filters-actions .caomei-button')

        expect(filterButtons[0]?.attributes('data-variant')).toBe('secondary')
        expect(filterButtons[0]?.attributes('data-tone')).toBe('danger')
        expect(filterButtons[0]?.attributes('disabled')).toBeDefined()
        // 迁移前该按钮为纯图标且无可访问名：`:label` 是本次补齐的可访问名，按精确值加钉（`toBeTruthy` 放不过空串但不拦错值）。
        expect(filterButtons[0]?.attributes('data-label')).toBe((wrapper.vm as unknown as { $t: (key: string) => string }).$t('common.delete'))
    })

    it('刷新按钮：caomei `DataTable` 无 `#header` 插槽，改置于表格之上且仍为单个右对齐图标按钮', async () => {
        const { wrapper } = await mountList()

        const refresh = wrapper.find('.table-header .caomei-button')

        expect(refresh.exists()).toBe(true)
        expect(refresh.attributes('data-label')).toBe((wrapper.vm as unknown as { $t: (key: string) => string }).$t('common.refresh'))
        // 表格之上（DOM 顺序在 DataTable 之前）——`#header` 插槽在 caomei 侧不存在，须避免静默丢失入口。
        const html = wrapper.html()
        expect(html.indexOf('table-header')).toBeLessThan(html.indexOf('caomei-data-table'))
    })

    it('筛选区：`CaomeiInput` 承接搜索（`#prefix` 图标）+ 两个 `CaomeiSelect`（`show-clear`）', async () => {
        const { wrapper } = await mountList()
        const selectStubs = wrapper.findAllComponents({ name: 'CaomeiSelect' })

        expect(wrapper.find('.filters-search .caomei-input svg').exists()).toBe(true)
        expect(selectStubs.length).toBe(2)
        expect(selectStubs[0]?.attributes('data-show-clear')).toBe('true')
    })
})
