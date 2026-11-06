import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import TaskDetailContent from './task-detail-content.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：AI 任务详情内容的渲染契约。
 *
 * 覆盖：状态 / 计费 Tag 的 tone 映射、复制按钮可访问名、错误消息、AI 图片包装数量。
 * 真实浮层与像素由 E2E / parity 承担。
 */

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }),
}))

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: '' } },
    setup: (props, { slots }) => () => h('span', { class: 'caomei-tag', 'data-tone': props.tone }, slots.default?.()),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' }, iconOnly: { type: Boolean, default: false } },
    emits: ['click'],
    setup: (props, { slots, emit }) => () => h('button', {
        class: 'caomei-button',
        'data-label': props.label,
        'data-icon-only': String(props.iconOnly),
        onClick: () => emit('click'),
    }, [slots.icon?.()]),
})

const CaomeiMessageStub = defineComponent({
    name: 'CaomeiMessage',
    props: { tone: { type: String, default: '' } },
    setup: (props, { slots }) => () => h('div', { class: 'caomei-message', 'data-tone': props.tone }, slots.default?.()),
})

const CaomeiImageStub = defineComponent({
    name: 'CaomeiImage',
    props: { src: { type: String, default: '' }, preview: { type: Boolean, default: false } },
    setup: (props) => () => h('span', { class: 'caomei-image', 'data-src': props.src }),
})

const stubs = {
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiMessage: CaomeiMessageStub,
    CaomeiImage: CaomeiImageStub,
    AdminAiDetailMetric: defineComponent({
        name: 'AdminAiDetailMetric',
        props: { label: { type: String, default: '' }, value: { type: [String, Number], default: '' } },
        setup: (props) => () => h('span', { class: 'detail-metric' }, `${props.label}=${props.value}`),
    }),
}

const baseTask = {
    id: 'task-1',
    category: 'text',
    type: 'image_generation',
    status: 'completed',
    provider: 'openai',
    model: 'whisper-1',
    chargeStatus: 'estimated',
    user_name: 'Ada',
    user_email: 'ada@example.com',
    estimatedCost: 1,
    actualCost: 2,
    estimatedQuotaUnits: 10,
    quotaUnits: 20,
    failureStage: null,
    durationMs: 1200,
    payload: '{"a":1}',
    usageSnapshot: null,
    error: 'boom',
    audioDuration: 10,
    audioSize: 2048,
    textLength: 100,
    language: 'zh',
    result: '{"images":[{"url":"https://example.com/1.png"},{"url":"https://example.com/2.png"}]}',
}

const mountContent = (task: Record<string, unknown>) => mountSuspended(TaskDetailContent, {
    props: { task: task as never },
    global: { stubs },
})

describe('task-detail-content 迁移契约', () => {
    it('状态与计费 Tag 按顺序使用对应 tone', async () => {
        const wrapper = await mountContent(baseTask)
        const tones = wrapper.findAll('.caomei-tag').map((tag) => tag.attributes('data-tone'))

        /* 顺序：category(neutral) / status(completed→success) / charge(estimated→warning)。 */
        expect(tones).toEqual(['neutral', 'success', 'warning'])
    })

    it('失败与处理中状态映射为 danger / primary', async () => {
        const failed = await mountContent({ ...baseTask, status: 'failed' })
        expect(failed.findAll('.caomei-tag')[1]!.attributes('data-tone')).toBe('danger')

        const processing = await mountContent({ ...baseTask, status: 'processing' })
        expect(processing.findAll('.caomei-tag')[1]!.attributes('data-tone')).toBe('primary')
    })

    it('复制按钮为 icon-only 且带可访问名', async () => {
        const wrapper = await mountContent(baseTask)
        const copy = wrapper.find('.caomei-button')

        expect(copy.attributes('data-icon-only')).toBe('true')
        expect(copy.attributes('data-label')).toBe('pages.admin.ai.task_detail.copy_task_id')
    })

    it('错误信息使用 danger Message', async () => {
        const wrapper = await mountContent(baseTask)
        const message = wrapper.find('.caomei-message')

        expect(message.attributes('data-tone')).toBe('danger')
        expect(message.text()).toContain('boom')
    })

    it('AI 生成图片按结果数量渲染包装', async () => {
        const wrapper = await mountContent(baseTask)

        expect(wrapper.findAll('.ai-task-image')).toHaveLength(2)
        expect(wrapper.findAll('.caomei-image')).toHaveLength(2)
    })
})
