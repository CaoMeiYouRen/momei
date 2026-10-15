import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import PostAuditDialogV2 from './post-audit-dialog-v2.vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 过渡组件 `PostAuditDialogV2`（caomei-ui 版）的单元契约。
 *
 * 本族采用**消费处静态择库**（见组件内注释）。浮层壳 `Dialog` 与 `ProgressBar` 属显式豁免 /
 * 非本批在册族，必须**保持 PrimeVue**；仅内部的 `Button` / `Tag` 迁移到 caomei-ui。
 */

mockNuxtImport('useI18nDate', () => () => ({
    formatDate: (value: string) => `date:${value}`,
}))

const DialogStub = defineComponent({
    name: 'Dialog',
    props: {
        visible: { type: Boolean, default: false },
        header: { type: String, default: '' },
        modal: { type: Boolean, default: false },
        style: { type: Object, default: () => ({}) },
    },
    emits: ['update:visible'],
    setup(props, { slots }) {
        return () => props.visible
            ? h('div', { class: 'p-dialog', 'data-header': props.header, 'data-width': String(props.style.width) }, [
                h('div', { class: 'p-dialog-content' }, slots.default?.()),
                h('div', { class: 'p-dialog-footer' }, slots.footer?.()),
            ])
            : null
    },
})

const ProgressBarStub = defineComponent({
    name: 'ProgressBar',
    props: { value: { type: Number, default: 0 } },
    setup: (props) => () => h('div', { class: 'p-progressbar', 'data-value': String(props.value) }),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        variant: { type: String, default: '' },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            type: 'button',
            'data-label': props.label,
            'data-variant': props.variant,
            'data-loading': String(props.loading),
            onClick: () => {
                if (!props.loading) {
                    emit('click')
                }
            },
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: 'neutral' } },
    setup: (props, { slots }) => () => h('span', {
        class: 'caomei-tag',
        'data-tone': props.tone,
    }, [slots.icon?.(), slots.default?.()]),
})

const stubs = {
    Dialog: DialogStub,
    ProgressBar: ProgressBarStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiTag: CaomeiTagStub,
}

const baseResult = {
    score: 88,
    tier: 'good',
    cachedAt: '2026-10-15T00:00:00.000Z',
    readability: { score: 70, suggestions: ['缩短句子'] },
    metaCompleteness: {
        score: 18,
        details: {
            title: { score: 20, key: 'pages.admin.posts.audit.messages.title', params: {} },
            summary: { score: 16, key: 'pages.admin.posts.audit.messages.summary', params: {} },
            coverImage: { score: 20, key: 'pages.admin.posts.audit.messages.cover', params: {} },
            tags: { score: 12, key: 'pages.admin.posts.audit.messages.tags', params: {} },
            category: { score: 20, key: 'pages.admin.posts.audit.messages.category', params: {} },
        },
    },
} as unknown as PostAuditResult

async function mountDialog(props: Record<string, unknown> = {}) {
    const wrapper = await mountSuspended(PostAuditDialogV2, {
        props: {
            visible: true,
            result: baseResult,
            aiPending: false,
            reAuditing: false,
            ...props,
        },
        global: { stubs },
    })

    return wrapper
}

describe('PostAuditDialogV2', () => {
    it('浮层壳仍为 PrimeVue Dialog，宽度与标题按 V1 口径透传', async () => {
        const wrapper = await mountDialog()

        const dialog = wrapper.find('.p-dialog')
        expect(dialog.exists()).toBe(true)
        expect(dialog.attributes('data-width')).toBe('540px')
        expect(dialog.attributes('data-header')).toBe('pages.admin.posts.audit.dialog_title')
    })

    it('visible=false 时不渲染内容', async () => {
        const wrapper = await mountDialog({ visible: false })

        expect(wrapper.find('.p-dialog').exists()).toBe(false)
    })

    it('页脚按钮：可见文案落默认插槽（非 label），变体为 secondary / ghost', async () => {
        const wrapper = await mountDialog()

        const buttons = wrapper.findAll('.caomei-button')
        expect(buttons).toHaveLength(2)

        const [reAudit, close] = buttons
        // `label` 只映射可访问名；可见文案必须来自默认插槽
        expect(reAudit!.attributes('data-label')).toBe('')
        expect(reAudit!.attributes('data-variant')).toBe('secondary')
        expect(reAudit!.text()).toBe('pages.admin.posts.audit.re_audit')

        expect(close!.attributes('data-label')).toBe('')
        expect(close!.attributes('data-variant')).toBe('ghost')
        // `common` 命名空间在测试环境已注册，按真实词条解析
        expect(close!.text()).toBe('关闭')
    })

    it('页脚按钮派发 re-audit / close', async () => {
        const wrapper = await mountDialog()
        const [reAudit, close] = wrapper.findAll('.caomei-button')

        await reAudit!.trigger('click')
        await close!.trigger('click')

        expect(wrapper.emitted('re-audit')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('重新审计中页脚按钮进入 loading（不派发点击）', async () => {
        const wrapper = await mountDialog({ reAuditing: true })
        const [reAudit] = wrapper.findAll('.caomei-button')

        expect(reAudit!.attributes('data-loading')).toBe('true')
        await reAudit!.trigger('click')
        expect(wrapper.emitted('re-audit')).toBeUndefined()
    })

    it('总分 Tag 色调随 tier：good → success', async () => {
        const wrapper = await mountDialog()
        const toneTag = wrapper.findAll('.caomei-tag')[0]!

        expect(toneTag.attributes('data-tone')).toBe('success')
        expect(toneTag.text()).toBe('pages.admin.posts.audit.tier_good')
    })

    it('tier 非 good 时 Tag 色调为 warning（V1 的 warn → warning）', async () => {
        const wrapper = await mountDialog({
            result: { ...baseResult, tier: 'needs_improvement' } as unknown as PostAuditResult,
        })

        const toneTag = wrapper.findAll('.caomei-tag')[0]!
        expect(toneTag.attributes('data-tone')).toBe('warning')
    })

    it('AI 待生成态渲染 primary Tag 与旋转图标', async () => {
        const wrapper = await mountDialog({ aiPending: true })

        const pending = wrapper.find('.audit-pending .caomei-tag')
        expect(pending.attributes('data-tone')).toBe('primary')
        expect(pending.find('.audit-spin').exists()).toBe(true)
    })

    it('ProgressBar 仍为 PrimeVue（不在本批在册族）', async () => {
        const wrapper = await mountDialog()

        // 总分条 + 5 个元数据因子条 + 可读性条
        expect(wrapper.findAll('.p-progressbar')).toHaveLength(7)
        expect(wrapper.findAll('.p-progressbar')[0]!.attributes('data-value')).toBe('88')
    })

    it('缓存时间经 useI18nDate 渲染', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.find('.audit-cached-at').text()).toContain('date:2026-10-15T00:00:00.000Z')
    })

    it('result 为空时不渲染正文，但页脚仍可用', async () => {
        const wrapper = await mountDialog({ result: null })

        expect(wrapper.find('.audit-overall').exists()).toBe(false)
        expect(wrapper.findAll('.caomei-button')).toHaveLength(2)
    })
})
