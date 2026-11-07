import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { Eye } from '@lucide/vue'
import MetricCard from './metric-card.vue'
import type { AdminContentInsightsMetric } from '@/types/admin-content-insights'

/**
 * 单元层（迁移方案 §8.2 ①）：仪表盘指标卡的 tone 映射与图标契约。
 *
 * `/admin` 不进跨日视觉基线（指标窗口按运行时日期计算），故本测试锁定结构契约。
 */

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
    }
})

const metric = (delta: number, deltaRate: number | null = null): AdminContentInsightsMetric => ({
    total: 100,
    previousTotal: 90,
    delta,
    deltaRate,
})

const mountCard = (delta: number) => mountSuspended(MetricCard, {
    props: { label: '浏览量', icon: Eye, metric: metric(delta) },
})

describe('dashboard metric-card 迁移契约', () => {
    it('正向差值使用 success tone 并显示 + 前缀', async () => {
        const wrapper = await mountCard(10)
        const tag = wrapper.find('.caomei-tag')

        expect(tag.classes()).toContain('caomei-tag--success')
        expect(tag.text()).toBe('+10')
    })

    it('负向差值使用 warning tone', async () => {
        const wrapper = await mountCard(-3)

        expect(wrapper.find('.caomei-tag').classes()).toContain('caomei-tag--warning')
        expect(wrapper.find('.caomei-tag').text()).toBe('-3')
    })

    it('零差值使用 neutral tone', async () => {
        const wrapper = await mountCard(0)

        expect(wrapper.find('.caomei-tag').classes()).toContain('caomei-tag--neutral')
    })

    it('图标以组件形式渲染为 svg，卡片根节点为 CaomeiCard', async () => {
        const wrapper = await mountCard(1)

        expect(wrapper.classes()).toContain('caomei-card')
        expect(wrapper.find('.dashboard-metric-card__icon-wrap svg').exists()).toBe(true)
        expect(wrapper.find('.dashboard-metric-card__value').text()).toBe('100')
    })
})
