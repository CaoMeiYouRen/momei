import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { caomeiComponentStubs } from '../../../tests/helpers/caomei-component-stubs'
import AdminAiPage from './index.vue'
import type { AIAdminTaskListItem } from '@/types/ai'

/**
 * `/admin/ai` 页面用例：钉住「调用点」的迁移期契约。
 *
 * 为什么必须单独存在：`pageIndexBase` 的归一逻辑在 composable 内已有断言，但**页面调用点**
 * 是否真的传了 `pageIndexBase: 1` 无人兜底——漏传会让 1 基载荷被二次抬升（翻页整体错位），
 * 而门禁 parity 只截第 1 页、E2E 不翻页，全部现存检查都不会红。
 * 同批口径的 `/admin/users`、`/admin/subscribers`、`/admin/waitlist`、`/admin/posts` 均有同类断言。
 */

const pageOptions = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[] }))

vi.mock('@/composables/use-admin-ai-page', async () => {
    const vue = await import('vue')

    return {
        useAdminAiPage: (options: Record<string, unknown> = {}) => {
            pageOptions.calls.push(options)

            return {
                activeTab: vue.ref('stats'),
                stats: vue.ref(null),
                loadingStats: vue.ref(false),
                costDisplay: vue.ref(null),
                tasks: vue.ref<AIAdminTaskListItem[]>([]),
                totalTasks: vue.ref(0),
                loadingTasks: vue.ref(false),
                selectedTasks: vue.ref([]),
                page: vue.ref(1),
                pageSize: vue.ref(10),
                filters: vue.ref({ search: '', type: null, status: null }),
                detailsVisible: vue.ref(false),
                loadingTaskDetails: vue.ref(false),
                taskDetailsError: vue.ref(null),
                selectedTask: vue.ref(null),
                loadTasks: vi.fn(),
                onPage: vi.fn(),
                onFilterChange: vi.fn(),
                showDetails: vi.fn(),
                confirmDelete: vi.fn(),
                confirmBulkDelete: vi.fn(),
            }
        },
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key, locale: ref('zh-CN'), locales: ref([{ code: 'zh-CN' }]) }),
    }
})

vi.stubGlobal('definePageMeta', vi.fn())

/* caomei 组件走共享桩（`CaomeiTabContent` 桩渲染全部面板，便于同时断言两个页签的内容）；
 * 页面自有子组件用轻量桩。 */
const global = {
    stubs: {
        ...caomeiComponentStubs,
        AdminPageHeader: { template: '<div class="admin-header" />', props: ['title'] },
        AdminAiStatsOverview: { template: '<div class="stats-overview" />' },
        AdminAiTaskList: {
            template: '<div class="task-list" :data-page="page" />',
            props: ['tasks', 'total', 'loading', 'page', 'pageSize', 'costDisplay', 'selection', 'filters'],
        },
        AdminAiTaskDetailsDialog: { template: '<div class="details-dialog" />' },
        ConfirmDialog: { template: '<div class="confirm-dialog" />' },
    },
}

describe('AdminAiPage', () => {
    beforeEach(() => {
        pageOptions.calls = []
        vi.clearAllMocks()
    })

    it('调用点声明 pageIndexBase: 1（caomei DataTable 的 1 基页码，漏传会二次抬升）', async () => {
        await mountSuspended(AdminAiPage, { global })

        expect(pageOptions.calls[0]).toMatchObject({ pageIndexBase: 1 })
    })

    it('任务列表以受控 `:page` 接线（与 composable 的 page 状态同源）', async () => {
        const wrapper = await mountSuspended(AdminAiPage, { global })

        expect(wrapper.find('.task-list').attributes('data-page')).toBe('1')
    })

    it('页签容器由 caomei `CaomeiTabs` 承接，且页签项为 `CaomeiTabTrigger`（迁移后不再渲染 PrimeVue `Tabs`）', async () => {
        const wrapper = await mountSuspended(AdminAiPage, { global })

        expect(wrapper.find('.caomei-tabs').exists()).toBe(true)
        expect(wrapper.findAll('.caomei-tab-trigger')).toHaveLength(2)
        expect(wrapper.html()).not.toContain('p-tabview')
    })

    it('子组件透传：统计面板与任务列表同页签容器内渲染', async () => {
        const wrapper = await mountSuspended(AdminAiPage, { global })

        expect(wrapper.find('.stats-overview').exists()).toBe(true)
        expect(wrapper.find('.task-list').exists()).toBe(true)
    })
})
