import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import KanbanView from './kanban-view.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：看板视图的列、计数 Tag 与卡片渲染。
 */

const stubs = {
    CaomeiTag: defineComponent({
        name: 'CaomeiTag',
        props: { tone: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('span', { class: 'caomei-tag', 'data-tone': props.tone }, slots.default?.()),
    }),
    CaomeiProgressSpinner: defineComponent({
        name: 'CaomeiProgressSpinner',
        setup: () => () => h('span', { class: 'caomei-spinner' }),
    }),
}

const card = {
    id: 'p-1',
    title: 'Hello',
    summary: null,
    status: 'draft',
    updatedAt: '2026-11-06T00:00:00.000Z',
    language: 'zh-CN',
    categoryName: 'Tech',
    pipelineStage: 'ideation',
}

const mountBoard = (loading = false) => mountSuspended(KanbanView, {
    props: { loading, kanbanData: { ideation: [card], writing: [], ready: [] } as never },
    global: { stubs },
})

describe('kanban-view 迁移契约', () => {
    it('渲染三列与每列计数 Tag', async () => {
        const wrapper = await mountBoard()
        const columns = wrapper.findAll('.kanban-view__column')

        expect(columns).toHaveLength(3)
        expect(wrapper.findAll('.caomei-tag').map((tag) => tag.text())).toEqual(['1', '0', '0'])
        expect(wrapper.findAll('.caomei-tag')[0]!.attributes('data-tone')).toBe('primary')
    })

    it('渲染卡片与空列提示', async () => {
        const wrapper = await mountBoard()

        expect(wrapper.findAll('.kanban-view__card')).toHaveLength(1)
        expect(wrapper.find('.kanban-view__card-title').text()).toBe('Hello')
        expect(wrapper.findAll('.kanban-view__empty').length).toBeGreaterThan(0)
    })

    it('加载态渲染 CaomeiProgressSpinner', async () => {
        const wrapper = await mountBoard(true)

        expect(wrapper.find('.caomei-spinner').exists()).toBe(true)
        expect(wrapper.find('.kanban-view__board').exists()).toBe(false)
    })
})
