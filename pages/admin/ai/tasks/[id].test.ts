import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import TaskDetailPage from './[id].vue'

/**
 * 单元层（迁移方案 §8.2 ①）：AI 任务详情页的三态渲染契约。
 *
 * 覆盖：pending / error / task 三个 `v-if` 分支、`CaomeiCard` 包装与内容组件接线。
 */

const { fetchState } = vi.hoisted(() => ({
    fetchState: { pending: false, error: null as unknown, data: null as unknown },
}))

mockNuxtImport('useFetch', async () => {
    const vue = await import('vue')
    return () => ({
        data: vue.computed(() => fetchState.data),
        pending: vue.ref(fetchState.pending),
        error: vue.computed(() => fetchState.error),
    })
})

mockNuxtImport('useHead', () => vi.fn())

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    emits: ['click'],
    setup: (_, { slots, emit }) => () => h('button', { class: 'caomei-button', onClick: () => emit('click') }, [slots.icon?.(), slots.default?.()]),
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }, [slots.actions?.()]),
    }),
    CaomeiButton: CaomeiButtonStub,
    CaomeiProgressSpinner: defineComponent({ name: 'CaomeiProgressSpinner', setup: () => () => h('span', { class: 'caomei-spinner' }) }),
    CaomeiMessage: defineComponent({
        name: 'CaomeiMessage',
        props: { tone: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('div', { class: 'caomei-message', 'data-tone': props.tone }, slots.default?.()),
    }),
    CaomeiCard: defineComponent({
        name: 'CaomeiCard',
        setup: (_, { slots }) => () => h('div', { class: 'caomei-card' }, [slots.title?.(), slots.default?.()]),
    }),
    AdminAiTaskDetailContent: defineComponent({
        name: 'AdminAiTaskDetailContent',
        props: { task: { type: Object, required: true } },
        setup: (props) => () => h('div', { class: 'task-detail-content-stub', 'data-id': (props.task as { id?: string })?.id }),
    }),
}

const mountPage = () => mountSuspended(TaskDetailPage, { global: { stubs } })

describe('admin/ai/tasks/[id] 三态渲染', () => {
    beforeEach(() => {
        fetchState.pending = false
        fetchState.error = null
        fetchState.data = null
    })

    it('pending 时渲染加载态', async () => {
        fetchState.pending = true
        const wrapper = await mountPage()

        expect(wrapper.find('.ai-task-detail-page__state').exists()).toBe(true)
        expect(wrapper.find('.caomei-spinner').exists()).toBe(true)
    })

    it('错误时渲染 danger Message', async () => {
        fetchState.error = { data: { message: 'Task not found' } }
        const wrapper = await mountPage()
        const message = wrapper.find('.caomei-message')

        expect(message.attributes('data-tone')).toBe('danger')
        expect(message.text()).toContain('Task not found')
    })

    it('有数据时用 CaomeiCard 包装内容组件', async () => {
        fetchState.data = { data: { item: { id: 'task-1' }, costDisplay: null } }
        const wrapper = await mountPage()

        expect(wrapper.find('.caomei-card').exists()).toBe(true)
        expect(wrapper.find('.task-detail-content-stub').attributes('data-id')).toBe('task-1')
    })
})
