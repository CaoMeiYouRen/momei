import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { type Component, defineComponent, h } from 'vue'
import PostAuditDialog from './post-audit-dialog.vue'
import PostAuditDialogV2 from './post-audit-dialog-v2.vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 审计详情浮层：**两版正文等价**测试。
 *
 * 背景：本族的择库方式是**消费处静态择库**，V1 / V2 会在迁移期并存；而 V2 为了替换在册族组件
 * （`Tag` / `Button`）**复刻了 V1 的正文标记**——这是一处已知的、以「V1 删除即消失」为出口的
 * 临时重复。本文件把「两版正文渲染出的内容一致」写成断言，使复刻漂移（改了 V1 忘了 V2）会被检出，
 * 而不是等到视觉层才发现。
 *
 * 断言的是**内容**（分值 / 区块标题 / 因子行数 / 建议 / 缓存时间），不比较 DOM 结构——
 * 结构差异是本族有意为之（`Tag` → `CaomeiTag`、页脚按钮承载方式不同）。
 */

mockNuxtImport('useI18nDate', () => () => ({
    formatDate: (value: string) => `date:${value}`,
}))

const DialogStub = defineComponent({
    name: 'Dialog',
    props: { visible: { type: Boolean, default: false }, header: { type: String, default: '' } },
    setup(props, { slots }) {
        return () => props.visible
            ? h('div', { class: 'dialog', 'data-header': props.header }, [slots.default?.(), slots.footer?.()])
            : null
    },
})

const ProgressBarStub = defineComponent({
    name: 'ProgressBar',
    props: { value: { type: Number, default: 0 } },
    setup: (props) => () => h('div', { class: 'bar', 'data-value': String(props.value) }),
})

const TagStub = defineComponent({
    name: 'Tag',
    props: { value: { type: String, default: '' } },
    setup: (props) => () => h('span', { class: 'tag' }, props.value),
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: 'neutral' } },
    setup: (_props, { slots }) => () => h('span', { class: 'tag' }, slots.default?.()),
})

const ButtonStub = defineComponent({
    name: 'Button',
    props: { label: { type: String, default: '' } },
    emits: ['click'],
    setup(props, { emit }) {
        return () => h('button', { class: 'p-button', 'data-label': props.label, onClick: () => emit('click') })
    },
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { loading: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            onClick: () => {
                if (!props.loading) {
                    emit('click')
                }
            },
        }, [slots.default?.()])
    },
})

const stubs = {
    Dialog: DialogStub,
    ProgressBar: ProgressBarStub,
    Tag: TagStub,
    CaomeiTag: CaomeiTagStub,
    Button: ButtonStub,
    CaomeiButton: CaomeiButtonStub,
}

const result = {
    score: 88,
    tier: 'good',
    cachedAt: '2026-10-15T00:00:00.000Z',
    readability: { score: 70, suggestions: ['建议一', '建议二'] },
    metaCompleteness: {
        score: 18,
        details: {
            title: { score: 20, key: 'k.title', params: {} },
            summary: { score: 16, key: 'k.summary', params: {} },
            coverImage: { score: 20, key: 'k.cover', params: {} },
            tags: { score: 12, key: 'k.tags', params: {} },
            category: { score: 20, key: 'k.category', params: {} },
        },
    },
} as unknown as PostAuditResult

async function mountDialog(component: Component, props: Record<string, unknown> = {}) {
    const wrapper = await mountSuspended(component, {
        props: { visible: true, result, aiPending: false, reAuditing: false, ...props },
        global: { stubs },
    })

    return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountDialog>>

/** 抽取「内容层」可比对的部分（不含组件来源相关结构）。 */
function contentSnapshot(wrapper: Wrapper) {
    return {
        score: wrapper.find('.audit-score').text(),
        sectionTitles: wrapper.findAll('.audit-section-title').map((node) => node.text()),
        factorRows: wrapper.findAll('.audit-detail-row').length,
        detailScores: wrapper.findAll('.audit-detail-score').map((node) => node.text()),
        suggestions: wrapper.findAll('.audit-suggestions li').map((node) => node.text()),
        cachedAt: wrapper.find('.audit-cached-at').text(),
        bars: wrapper.findAll('.bar').map((node) => node.attributes('data-value')),
    }
}

describe('审计详情浮层：两版正文等价', () => {
    it('正文内容逐项一致（分值 / 区块标题 / 因子行 / 建议 / 缓存时间 / 进度条）', async () => {
        const legacy = await mountDialog(PostAuditDialog)
        const caomei = await mountDialog(PostAuditDialogV2)

        // 非空锚：数组类字段在两侧同时缺失时会退化为 `[] == []` 的恒等比较，
        // 故先断言「两侧都确实渲染出内容」，再断言等价。
        const snapshot = contentSnapshot(legacy)
        expect(snapshot.factorRows).toBe(5)
        expect(snapshot.sectionTitles.length).toBeGreaterThan(0)
        expect(snapshot.detailScores).toHaveLength(6)
        expect(snapshot.suggestions).toHaveLength(2)
        expect(snapshot.bars).toHaveLength(7)

        expect(contentSnapshot(caomei)).toEqual(snapshot)
    })

    it('AI 待生成态：两版都渲染待生成提示，且建议区显示 pending 文案', async () => {
        const legacy = await mountDialog(PostAuditDialog, {
            result: { ...result, readability: { score: 0, suggestions: [] } } as unknown as PostAuditResult,
            aiPending: true,
        })
        const caomei = await mountDialog(PostAuditDialogV2, {
            result: { ...result, readability: { score: 0, suggestions: [] } } as unknown as PostAuditResult,
            aiPending: true,
        })

        expect(caomei.find('.audit-pending').text()).toBe(legacy.find('.audit-pending').text())
        expect(caomei.find('.audit-detail-msg').text()).toBe(legacy.find('.audit-detail-msg').text())
    })

    it('result 为空时两版都不渲染正文', async () => {
        const legacy = await mountDialog(PostAuditDialog, { result: null })
        const caomei = await mountDialog(PostAuditDialogV2, { result: null })

        expect(legacy.find('.audit-overall').exists()).toBe(false)
        expect(caomei.find('.audit-overall').exists()).toBe(false)
    })

    it('visible=false 时两版都不渲染', async () => {
        expect((await mountDialog(PostAuditDialog, { visible: false })).find('.dialog').exists()).toBe(false)
        expect((await mountDialog(PostAuditDialogV2, { visible: false })).find('.dialog').exists()).toBe(false)
    })

    it('浮层标题与页脚可见文案两版一致（V1 走 label、V2 走默认插槽）', async () => {
        const legacy = await mountDialog(PostAuditDialog)
        const caomei = await mountDialog(PostAuditDialogV2)

        // V1 的 Dialog 标题来自 `header` prop；两版都取自同一 i18n 键
        expect(caomei.find('.dialog').attributes('data-header')).toBe(legacy.find('.dialog').attributes('data-header'))

        const footerTexts = (wrapper: Wrapper) => wrapper.findAll('button')
            .map((button) => button.text() || button.attributes('data-label'))
        expect(footerTexts(caomei)).toEqual(footerTexts(legacy))
    })

    it('页脚两版都派发 close / re-audit（承载方式不同，行为一致）', async () => {
        for (const component of [PostAuditDialog, PostAuditDialogV2]) {
            const wrapper = await mountDialog(component)
            const buttons = wrapper.findAll('button')

            expect(buttons).toHaveLength(2)
            await buttons[0]!.trigger('click')
            await buttons[1]!.trigger('click')

            expect(wrapper.emitted('re-audit')).toHaveLength(1)
            expect(wrapper.emitted('close')).toHaveLength(1)
        }
    })
})
