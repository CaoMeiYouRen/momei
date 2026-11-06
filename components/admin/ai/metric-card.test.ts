import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { List } from '@lucide/vue'
import MetricCard from './metric-card.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：指标卡把图标放进 `#extra` 插槽。
 *
 * `CaomeiCard` 的 `#title` 是宽度塌缩的 flex 子项，图标若放 `#title` 内会贴住标签、
 * 无法右对齐（2026-11-06 审计 B1）。本用例锁住「图标走 `#extra`」这一结构契约。
 */

describe('MetricCard', () => {
    it('图标渲染在 #extra 插槽，标签渲染在 #title', async () => {
        const wrapper = await mountSuspended(MetricCard, {
            props: { label: 'Total tasks', value: 12, icon: List },
        })

        expect(wrapper.find('.caomei-card__extra svg').exists()).toBe(true)
        expect(wrapper.find('.card-title').text()).toBe('Total tasks')
        expect(wrapper.find('.card-value').text()).toBe('12')
    })
})
