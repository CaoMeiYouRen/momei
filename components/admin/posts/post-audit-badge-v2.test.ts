import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import PostAuditBadgeV2 from './post-audit-badge-v2.vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 过渡组件 `PostAuditBadgeV2`（caomei-ui 版）的单元契约。
 *
 * 本族采用**消费处静态择库**（见组件内注释）：本组件只负责 caomei 渲染，
 * 由 B2 目标路由 `/admin/posts` 在自身迁移批次使用（本批只交付壳）；因此测试聚焦三态渲染、语义色映射与事件载荷。
 */

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        rounded: { type: Boolean, default: false },
        variant: { type: String, default: '' },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            type: 'button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            'data-rounded': String(props.rounded),
            'data-variant': props.variant,
            onClick: () => emit('click'),
        }, [slots.icon?.()])
    },
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: 'neutral' } },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('span', {
            class: 'caomei-tag',
            'data-tone': props.tone,
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const stubs = { CaomeiButton: CaomeiButtonStub, CaomeiTag: CaomeiTagStub }

function makeResult(tier: PostAuditResult['tier']): PostAuditResult {
    return {
        tier,
        score: tier === 'good' ? 90 : 40,
        cachedAt: '2026-10-15T00:00:00.000Z',
        readability: { score: 80, suggestions: [] },
        metaCompleteness: { score: 18, details: {} },
    } as unknown as PostAuditResult
}

describe('PostAuditBadgeV2', () => {
    it('无审计结果时渲染纯图标按钮，并补齐可访问名', async () => {
        const wrapper = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: null, loading: false },
            global: { stubs },
        })

        const button = wrapper.find('.caomei-button')
        expect(button.attributes('data-icon-only')).toBe('true')
        expect(button.attributes('data-variant')).toBe('ghost')
        expect(button.attributes('data-rounded')).toBe('true')
        // V1 的纯图标按钮只有 tooltip，无可见文案 / 可访问名。
        // 注：`pages.admin.posts.*` 词条在本测试环境未注册（懒加载命名空间），`$t` 原样返回 key。
        expect(button.attributes('data-label')).toBe('pages.admin.posts.audit.run_audit')
        expect(wrapper.find('.caomei-tag').exists()).toBe(false)
    })

    it('点击纯图标按钮派发 run-audit', async () => {
        const wrapper = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: null, loading: false },
            global: { stubs },
        })

        await wrapper.find('.caomei-button').trigger('click')

        expect(wrapper.emitted('run-audit')).toHaveLength(1)
    })

    it('加载态渲染 primary 色调 Tag 与进行中文案', async () => {
        const wrapper = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: null, loading: true },
            global: { stubs },
        })

        expect(wrapper.find('.caomei-button').exists()).toBe(false)
        const tag = wrapper.find('.caomei-tag')
        // V1 的 `severity="info"` → caomei `tone="primary"`
        expect(tag.attributes('data-tone')).toBe('primary')
        expect(tag.text()).toBe('pages.admin.posts.audit.running')
        expect(tag.find('.post-audit-badge__spin').exists()).toBe(true)
    })

    it('有结果时按 tier 映射色调：good → success，needs-improvement → warning', async () => {
        const good = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: makeResult('good'), loading: false },
            global: { stubs },
        })
        const goodTag = good.find('.caomei-tag')
        expect(goodTag.attributes('data-tone')).toBe('success')
        expect(goodTag.text()).toBe('pages.admin.posts.audit.tier_good')

        const bad = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: makeResult('needs_improvement'), loading: false },
            global: { stubs },
        })
        const badTag = bad.find('.caomei-tag')
        // V1 的 `severity="warn"` → caomei `tone="warning"`
        expect(badTag.attributes('data-tone')).toBe('warning')
        expect(badTag.text()).toBe('pages.admin.posts.audit.tier_needs_improvement')
    })

    it('点击结果 Tag 派发 show-detail 并携带结果对象', async () => {
        const result = makeResult('good')
        const wrapper = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: result, loading: false },
            global: { stubs },
        })

        await wrapper.find('.caomei-tag').trigger('click')

        expect(wrapper.emitted('show-detail')?.[0]).toEqual([result])
    })

    it('结果 Tag 带可点击指针样式类（替代 V1 的 :pt 内联样式）', async () => {
        const wrapper = await mountSuspended(PostAuditBadgeV2, {
            props: { auditResult: makeResult('good'), loading: false },
            global: { stubs },
        })

        expect(wrapper.find('.caomei-tag').classes()).toContain('post-audit-badge')
    })
})
