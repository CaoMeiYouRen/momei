import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorConsolidatedReviewPanel from './post-editor-consolidated-review-panel.vue'
import type { AIReviewSuggestion, PerspectiveCheckItem } from '@/types/ai'

const reviewSuggestions: AIReviewSuggestion[] = [
    {
        type: 'grammar',
        severity: 'major',
        original: '原始句子',
        suggestion: '建议改写',
        replacement: '替换句子',
    },
]

const perspectiveResults: PerspectiveCheckItem[] = [
    {
        mode: 'editor',
        type: 'clarity',
        severity: 'minor',
        original: '原文片段',
        suggestion: '表达更清晰',
        reason: '读者更好理解',
    },
]

function mountPanel(props: Record<string, unknown> = {}) {
    return mountSuspended(PostEditorConsolidatedReviewPanel, {
        props: {
            visible: true,
            activeTab: 'review',
            reviewSuggestions,
            perspectiveResults,
            mode: 'editor',
            loading: { review: false, perspective: false },
            failedSections: [],
            ...props,
        },
        global: {
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('PostEditorConsolidatedReviewPanel', () => {
    it('渲染合并面板标题与两个 Tab 的条目计数', async () => {
        const wrapper = await mountPanel()

        expect(wrapper.text()).toContain('pages.admin.posts.ai.consolidated_panel_title')
        expect(wrapper.text()).toContain('pages.admin.posts.ai.consolidated_tab_review')
        expect(wrapper.text()).toContain('pages.admin.posts.ai.consolidated_tab_perspective')
        expect(wrapper.text()).toContain('(1)')
    })

    it('问题修正 Tab 展示原文、建议与替换文本', async () => {
        const wrapper = await mountPanel()

        const text = wrapper.text()
        expect(text).toContain('原始句子')
        expect(text).toContain('建议改写')
        expect(text).toContain('替换句子')
        expect(wrapper.find('.review-suggestion--major').exists()).toBe(true)
    })

    it('无问题时展示空态文案', async () => {
        const reviewWrapper = await mountPanel({ reviewSuggestions: [] })
        expect(reviewWrapper.text()).toContain('pages.admin.posts.ai.review_no_issues')

        const perspectiveWrapper = await mountPanel({ activeTab: 'perspective', perspectiveResults: [] })
        expect(perspectiveWrapper.text()).toContain('pages.admin.posts.ai.perspective_no_issues')
    })

    it('分段失败时展示错误提示而非旧结果', async () => {
        const reviewWrapper = await mountPanel({ failedSections: ['review'] })
        expect(reviewWrapper.text()).toContain('pages.admin.posts.ai.consolidated_review_failed')
        expect(reviewWrapper.text()).toContain('pages.admin.posts.ai.consolidated_tab_review (0)')
        expect(reviewWrapper.find('.review-suggestion').exists()).toBe(false)

        const perspectiveWrapper = await mountPanel({ activeTab: 'perspective', failedSections: ['perspective'] })
        expect(perspectiveWrapper.text()).toContain('pages.admin.posts.ai.consolidated_perspective_failed')
        expect(perspectiveWrapper.text()).toContain('pages.admin.posts.ai.consolidated_tab_perspective (0)')
        expect(perspectiveWrapper.find('.perspective-item').exists()).toBe(false)
    })

    it('加载中且无结果时展示加载文案', async () => {
        const reviewWrapper = await mountPanel({
            reviewSuggestions: [],
            loading: { review: true, perspective: false },
        })
        expect(reviewWrapper.text()).toContain('common.loading')

        const perspectiveWrapper = await mountPanel({
            activeTab: 'perspective',
            perspectiveResults: [],
            loading: { review: false, perspective: true },
        })
        expect(perspectiveWrapper.text()).toContain('common.loading')
    })

    it('隐藏态不进入可访问树（inert / aria-hidden）', async () => {
        const wrapper = await mountPanel({ visible: false })
        const panel = wrapper.find('.consolidated-panel')

        expect(panel.attributes('inert')).toBeDefined()
        expect(panel.attributes('aria-hidden')).toBe('true')
        expect(panel.classes()).not.toContain('consolidated-panel--visible')
    })

    it('渲染严重度与类型标签映射（问题修正 + 视角建议）', async () => {
        const reviewWrapper = await mountPanel({
            reviewSuggestions: [{ type: 'spelling', severity: 'critical', original: 'a', suggestion: 'b' }],
        })
        expect(reviewWrapper.text()).toContain('pages.admin.posts.ai.review_critical')
        expect(reviewWrapper.text()).toContain('pages.admin.posts.ai.review_type_spelling')

        const perspectiveWrapper = await mountPanel({
            activeTab: 'perspective',
            perspectiveResults: [{
                mode: 'reader',
                type: 'emotion',
                severity: 'major',
                suggestion: '更强共鸣',
                reason: '理由',
            }],
        })
        expect(perspectiveWrapper.text()).toContain('pages.admin.posts.ai.perspective_major')
        expect(perspectiveWrapper.text()).toContain('pages.admin.posts.ai.perspective_type_emotion')
    })

    it('切换视角模式与关闭面板时向外抛事件', async () => {
        const wrapper = await mountPanel({ activeTab: 'perspective' })

        const modeButtons = wrapper.findAll('.consolidated-panel__mode-tabs button')
        expect(modeButtons).toHaveLength(2)
        await modeButtons[1]!.trigger('click')
        await modeButtons[0]!.trigger('click')

        expect(wrapper.emitted('switch-mode')?.map((args) => args[0])).toEqual(['reader', 'editor'])

        await wrapper.find('.consolidated-panel__header button').trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('切换 Tab 时向外同步 activeTab', async () => {
        const wrapper = await mountPanel()

        const tabs = wrapper.findComponent({ name: 'CaomeiTabs' })
        expect(tabs.exists()).toBe(true)
        tabs.vm.$emit('update:modelValue', 'perspective')

        expect(wrapper.emitted('update:activeTab')?.at(-1)).toEqual(['perspective'])
    })
})
