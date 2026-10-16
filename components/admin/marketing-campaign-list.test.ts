import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { CaomeiDataTableStub, caomeiComponentStubs } from '../../tests/helpers/caomei-component-stubs'
import MarketingCampaignList from './marketing-campaign-list.vue'

/**
 * `/admin/marketing` 推送历史列表（路由自有组件）的迁移契约用例。
 *
 * 覆盖「迁移不改语义」的落点：列定义与迁移前 `Column` 一一对应、`@page` 由 0 基切 1 基后的
 * 受控分页与请求参数、状态 `Tag` 的 tone 与可见文案、图标由 primeicons 换成 lucide、
 * 行内动作按钮的形态与可访问名、刷新按钮由 `#header` 插槽移到表格之上、空态。
 */

/* `vi.hoisted`：`vi.mock` 工厂在静态 import 之前执行，顶层 `const` 此刻尚未初始化。 */
const { fetchMock, confirmRequire } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    confirmRequire: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => ({ require: confirmRequire }) }))

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
    locales: ref([{ code: 'zh-CN' }]),
}))
vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
/* 日期列沿用真实 `useI18nDate`（不可替换：Nuxt 自动导入的真实 composable 在用例内生效），
 * 故断言按真实输出（`YYYY-MM-DD`）。 */

const rows = [
    { id: 'c-1', title: '草稿推送', status: 'DRAFT', scheduledAt: null, sentAt: null },
    { id: 'c-2', title: '定时推送', status: 'SCHEDULED', scheduledAt: '2026-11-01T10:00:00.000Z', sentAt: null },
    { id: 'c-3', title: '已完成推送', status: 'COMPLETED', scheduledAt: null, sentAt: '2026-10-20T10:00:00.000Z' },
    { id: 'c-4', title: '发送中推送', status: 'SENDING', scheduledAt: null, sentAt: null },
]

const mountList = async (payload: { items?: unknown[], total?: number } = {}) => {
    fetchMock.mockResolvedValue({ data: { items: payload.items ?? rows, total: payload.total ?? rows.length } })

    const wrapper = await mountSuspended(MarketingCampaignList, {
        global: { stubs: caomeiComponentStubs },
    })

    // 首屏数据加载（`onMounted` → `loadData`）后的 flush：先等请求发出，再等状态更新落盘
    // （空列表用例没有 `.stub-row`，故不能用「行数 > 0」作为就绪条件）。
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await flushPromises()

    return wrapper
}

describe('MarketingCampaignList', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        confirmRequire.mockReset()
    })

    it('列定义与迁移前的 4 个 Column 一一对应，动作列用 caomei 原生 `align: "right"`', async () => {
        const wrapper = await mountList()
        const columns = wrapper.findComponent(CaomeiDataTableStub).props('columns') as { key: string, align?: string }[]

        expect(columns.map((column) => column.key)).toEqual(['title', 'status', 'publishedAt', 'actions'])
        // 迁移前靠 `:deep(.p-column-header-content) { justify-content: flex-end }`（PrimeVue 内部类，caomei 侧不存在）。
        expect(columns.find((column) => column.key === 'actions')?.align).toBe('right')
        expect(columns.every((column) => column.key === 'actions' || !column.align)).toBe(true)
    })

    it('受控分页契约：page / rows / total-records / lazy / paginator', async () => {
        const wrapper = await mountList({ total: 42 })
        const table = wrapper.findComponent(CaomeiDataTableStub)

        expect(table.props('page')).toBe(1)
        expect(table.props('rows')).toBe(10)
        expect(table.props('totalRecords')).toBe(42)
        expect(table.props('lazy')).toBe(true)
        expect(table.props('paginator')).toBe(true)
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns', { query: { page: 1, limit: 10 } })
    })

    it('`@page` 载荷为 1 基（caomei 语义）：翻页请求按载荷原值，不再 `+1` 抬升', async () => {
        const wrapper = await mountList()
        fetchMock.mockClear()

        await wrapper.find('.stub-next-page').trigger('click')
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

        // 桩的 `@page` 载荷固定为 `{ page: 2 }`；迁移前 PrimeVue 为 0 基需 `+1`，caomei 为 1 基故直取。
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns', { query: { page: 2, limit: 10 } })
        expect(wrapper.findComponent(CaomeiDataTableStub).props('page')).toBe(2)
    })

    it('状态标签：tone 逐档转换（DRAFT→neutral / SCHEDULED→warning / COMPLETED→success / SENDING→primary）', async () => {
        const wrapper = await mountList()
        const tones = wrapper.findAll('.stub-td[data-key="status"] .caomei-tag').map((tag) => tag.attributes('data-tone'))

        expect(tones).toEqual(['neutral', 'warning', 'success', 'primary'])
    })

    it('状态标签：可见文案落默认插槽（`CaomeiTag` 无 `value` prop）', async () => {
        const wrapper = await mountList()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }
        const texts = wrapper.findAll('.stub-td[data-key="status"] .caomei-tag').map((tag) => tag.text())

        expect(texts).toEqual([
            $t('pages.admin.marketing.status.draft'),
            $t('pages.admin.marketing.status.scheduled'),
            $t('pages.admin.marketing.status.completed'),
            $t('pages.admin.marketing.status.sending'),
        ])
    })

    it('状态图标：`pi pi-spin pi-spinner` → lucide + 本地旋转动画；`pi pi-calendar` → lucide 日历', async () => {
        const wrapper = await mountList()
        const tags = wrapper.findAll('.stub-td[data-key="status"] .caomei-tag')

        // SENDING（第 4 行）与 SCHEDULED（第 2 行）带图标，其余为纯文本。
        expect(tags[0]?.find('svg').exists()).toBe(false)
        expect(tags[1]?.find('svg').exists()).toBe(true)
        expect(tags[3]?.find('svg').exists()).toBe(true)
        expect(tags[3]?.find('.marketing-campaign-list__status-icon--spin').exists()).toBe(true)
        expect(tags[1]?.find('.marketing-campaign-list__status-icon--spin').exists()).toBe(false)
    })

    it('时间列：SCHEDULED 显示 scheduledAt，其余显示 sentAt，两者皆无回落 `-`', async () => {
        const wrapper = await mountList()
        const cells = wrapper.findAll('.stub-td[data-key="publishedAt"]')

        expect(cells[0]?.text()).toBe('-')
        expect(cells[1]?.text()).toBe('2026-11-01')
        expect(cells[2]?.text()).toBe('2026-10-20')
    })

    it('行内动作：`icon-only` + `size="sm"`，并按状态裁剪（发送中无删除、草稿有发送、定时有取消）', async () => {
        const wrapper = await mountList()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }
        const buttonsOf = (index: number) => wrapper.findAll('.stub-row')[index]?.findAll('.caomei-button') ?? []
        const labelsOf = (index: number) => buttonsOf(index).map((button) => button.attributes('data-label'))

        expect(labelsOf(0)).toEqual([
            $t('pages.admin.marketing.actions.send_now'),
            $t('common.edit'),
            $t('pages.admin.marketing.actions.delete'),
        ])
        expect(labelsOf(1)).toEqual([
            $t('pages.admin.marketing.actions.cancel_scheduled'),
            $t('common.edit'),
            $t('pages.admin.marketing.actions.delete'),
        ])
        // 发送中：无删除按钮（迁移前 `v-if="status !== 'SENDING'"`）。
        expect(labelsOf(3)).toEqual([$t('common.edit')])
        expect(buttonsOf(0).every((button) => button.attributes('data-icon-only') === 'true')).toBe(true)
        expect(buttonsOf(0).every((button) => button.attributes('data-size') === 'sm')).toBe(true)
    })

    it('行内动作：`severity` → `variant` / `tone` 逐档映射（success / warn / secondary / danger）', async () => {
        const wrapper = await mountList()
        const buttonsOf = (index: number) => wrapper.findAll('.stub-row')[index]?.findAll('.caomei-button') ?? []

        expect(buttonsOf(0).map((button) => [button.attributes('data-variant'), button.attributes('data-tone')])).toEqual([
            ['', 'success'],
            ['secondary', 'neutral'],
            ['', 'danger'],
        ])
        expect(buttonsOf(1)[0]?.attributes('data-tone')).toBe('warning')
    })

    it('刷新按钮：caomei `DataTable` 无 `#header` 插槽，改置于表格之上且补可访问名', async () => {
        const wrapper = await mountList()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }
        const refresh = wrapper.find('.marketing-campaign-list__header .caomei-button')

        expect(refresh.exists()).toBe(true)
        expect(refresh.attributes('data-label')).toBe($t('common.refresh'))
        expect(refresh.attributes('data-icon-only')).toBe('true')
        expect(refresh.attributes('data-variant')).toBe('ghost')
        // 表格之上（DOM 顺序在 DataTable 之前）——该插槽在 caomei 侧不存在，须避免静默丢失入口。
        const html = wrapper.html()
        expect(html.indexOf('marketing-campaign-list__header')).toBeLessThan(html.indexOf('caomei-data-table'))
        // 表头带内**唯一**一个刷新入口（迁移前由 `#header` 插槽承载）。
        expect(wrapper.findAll('.marketing-campaign-list__header .caomei-button')).toHaveLength(1)
    })

    it('发送 / 取消 / 删除：三条写路径的请求与 `changed` 事件接线', async () => {
        const wrapper = await mountList()
        fetchMock.mockClear()

        // 行 0 为 DRAFT → 发送；行 1 为 SCHEDULED → 取消。
        await wrapper.findAll('.stub-row')[0]?.findAll('.caomei-button')[0]?.trigger('click')
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns/c-1/send', { method: 'POST' }))

        fetchMock.mockClear()
        await wrapper.findAll('.stub-row')[1]?.findAll('.caomei-button')[0]?.trigger('click')
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns/c-2/cancel', { method: 'POST' }))
        await vi.waitFor(() => expect(wrapper.emitted('changed')).toBeTruthy())
    })

    it('删除：先经 `useConfirm().require` 确认，`accept` 后才发 DELETE 并触发 `changed`', async () => {
        const wrapper = await mountList()

        // 行 0 的最后一个按钮是删除（发送 / 编辑 / 删除）。
        await wrapper.findAll('.stub-row')[0]?.findAll('.caomei-button')[2]?.trigger('click')

        expect(confirmRequire).toHaveBeenCalledTimes(1)
        const options = confirmRequire.mock.calls[0]?.[0] as { message: string, header: string, accept: () => Promise<void> }
        expect(options.message).toBeTruthy()
        expect(options.header).toBeTruthy()

        fetchMock.mockClear()
        await options.accept()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns/c-1', { method: 'DELETE' })
        expect(wrapper.emitted('changed')).toBeTruthy()
    })

    it('处理中：同行的动作按钮进入 `loading` + `disabled`（防重复提交）', async () => {
        const wrapper = await mountList()
        // 挂起发送请求（Promise 永不 settle）：处理中态应落在按钮上（迁移前为 `:loading` + `:disabled` 同一表达式）。
        fetchMock.mockImplementation(() => new Promise<void>(() => undefined))

        await wrapper.findAll('.stub-row')[0]?.findAll('.caomei-button')[0]?.trigger('click')
        await wrapper.vm.$nextTick()

        const buttons = wrapper.findAll('.stub-row')[0]?.findAll('.caomei-button') ?? []
        expect(buttons[0]?.attributes('data-loading')).toBe('true')
        expect(buttons[0]?.attributes('data-disabled')).toBe('true')
        // 编辑 / 删除按钮同受 `:disabled` 约束（迁移前的 `isProcessing` 语义）。
        expect(buttons[1]?.attributes('data-disabled')).toBe('true')
    })

    it('标题与空态：标题保留 `campaign_list` 文案；空列表渲染 `no_data`', async () => {
        const wrapper = await mountList({ items: [], total: 0 })
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(wrapper.find('.marketing-campaign-list__title').text()).toBe($t('pages.admin.marketing.campaign_list'))
        expect(wrapper.find('.stub-empty').text()).toBe($t('common.no_data'))
    })
})
