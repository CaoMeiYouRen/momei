import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import CreatorStatsPanel from './creator-stats-panel.vue'

const translate = (key: string, _params?: Record<string, string | number>) => key

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: { value: 'zh-CN' },
            locales: { value: [{ code: 'zh-CN' }, { code: 'en-US' }] },
        }),
    }
})

const mockRefresh = vi.fn()

vi.mock('@/composables/use-creator-stats-page', () => ({
    useCreatorStatsPage: () => ({
        stats: {
            range: 30,
            timezone: 'UTC',
            generatedAt: '2026-05-10T00:00:00.000Z',
            publishing: {
                totalPublished: 10,
                draftCount: 3,
                trend: [{ periodStart: '2026-05-01', count: 5, periodEnd: '2026-05-07' }],
            },
            distribution: {
                wechatsync: {
                    overallSuccessRate: 0.8,
                    trend: [{ periodStart: '2026-05', total: 5, succeeded: 4, failed: 1 }],
                },
                hexoRepositorySync: {
                    overallSuccessRate: 0.9,
                    trend: [{ periodStart: '2026-05', total: 3, succeeded: 3, failed: 0 }],
                },
            },
            aggregationGranularity: 'week',
        },
        loading: false,
        selectedRange: { value: 30 },
        timezone: 'UTC',
        refresh: mockRefresh,
    }),
}))

describe('CreatorStatsPanel', () => {
    it('renders without error', async () => {
        const wrapper = await mountSuspended(CreatorStatsPanel, {
            props: { refreshSignal: 0 },
        })

        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('.admin-dashboard__panel').exists()).toBe(true)
    })

    it('calls refresh when refreshSignal changes (regression: template-ref refresh not a function)', async () => {
        mockRefresh.mockClear()

        const wrapper = await mountSuspended(CreatorStatsPanel, {
            props: { refreshSignal: 0 },
        })

        // useCreatorStatsPage 被 mock，其内部 onMounted 不触发 refresh。
        // 初始挂载后 refresh 不应被调用。
        expect(mockRefresh).toHaveBeenCalledTimes(0)

        // 改变 refreshSignal 触发组件 watch → refresh
        await wrapper.setProps({ refreshSignal: 1 })
        await nextTick()

        expect(mockRefresh).toHaveBeenCalledTimes(1)
    })

    it('does not call refresh when refreshSignal stays same', async () => {
        mockRefresh.mockClear()

        const wrapper = await mountSuspended(CreatorStatsPanel, {
            props: { refreshSignal: 5 },
        })

        expect(mockRefresh).toHaveBeenCalledTimes(0)

        await wrapper.setProps({ refreshSignal: 5 })
        await nextTick()

        // 相同值不触发 watch
        expect(mockRefresh).toHaveBeenCalledTimes(0)
    })

    it('renders range buttons', async () => {
        const wrapper = await mountSuspended(CreatorStatsPanel, {
            props: { refreshSignal: 0 },
        })

        const buttons = wrapper.findAll('.admin-dashboard__range-button')
        expect(buttons).toHaveLength(3)
    })

    it('renders metric cards when stats are loaded', async () => {
        const wrapper = await mountSuspended(CreatorStatsPanel, {
            props: { refreshSignal: 0 },
        })

        // CreatorMetricCard 组件被 mock 的 stats 填充，应有 4 个指标卡片
        const metrics = wrapper.findAll('.admin-dashboard__metrics--creator > *')
        expect(metrics.length).toBeGreaterThanOrEqual(1)
    })
})
