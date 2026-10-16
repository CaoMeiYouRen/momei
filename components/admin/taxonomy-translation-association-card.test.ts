import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { caomeiComponentStubs } from '../../tests/helpers/caomei-component-stubs'
import AssociationCard from './taxonomy-translation-association-card.vue'

/**
 * 路由自有子组件（`admin-taxonomy-page.vue` 的翻译关联卡片）契约用例。
 *
 * 为什么单独用例：宿主页面的用例把该卡片整体桩掉，对「卡片内候选按钮的可见文案」的断言
 * 会验到桩而不是实现——而「`CaomeiButton` 的 `label` 只映射可访问名、可见文本必须落默认插槽」
 * 是本迁移批次已经踩过的真实退化类型（见迁移方案 §6.2 执行提示 3），故此处对真实组件断言。
 */
const candidates = [
    { id: 'cat-en', name: 'Technology', language: 'en-US' },
    { id: 'cat-ja', name: '技術', language: 'ja-JP' },
]

const mountCard = (props: Record<string, unknown>) => mountSuspended(AssociationCard, {
    props: {
        clusterId: 'tech-group',
        usesSlugFallback: false,
        sameLanguageConflict: null,
        linkedPeers: [],
        relatedCandidates: [],
        ...props,
    },
    global: { stubs: caomeiComponentStubs },
})

describe('TaxonomyTranslationAssociationCard', () => {
    it('候选按钮：可见文案落默认插槽（`CaomeiButton` 的 `label` 只是可访问名）', async () => {
        const wrapper = await mountCard({ relatedCandidates: candidates })
        const buttons = wrapper.findAll('.taxonomy-translation-association__actions .caomei-button')

        expect(buttons.map((button) => button.text())).toEqual(['[en-US] Technology', '[ja-JP] 技術'])
    })

    it('候选按钮：点击抛 `open-candidate` 且携带候选对象', async () => {
        const wrapper = await mountCard({ relatedCandidates: candidates })

        await wrapper.findAll('.taxonomy-translation-association__actions .caomei-button')[1]?.trigger('click')

        expect(wrapper.emitted('open-candidate')?.[0]).toEqual([candidates[1]])
    })

    it('同语言冲突：带 `--warn` 修饰类并渲染冲突明细', async () => {
        const wrapper = await mountCard({
            sameLanguageConflict: { id: 'cat-zh', name: '技术', language: 'zh-CN' },
            relatedCandidates: [],
        })

        expect(wrapper.find('.taxonomy-translation-association--warn').exists()).toBe(true)
        expect(wrapper.text()).toContain('技术')
    })

    it('无相关候选：不渲染候选按钮（但冲突提示仍渲染）', async () => {
        const wrapper = await mountCard({
            sameLanguageConflict: { id: 'cat-zh', name: '技术', language: 'zh-CN' },
        })

        expect(wrapper.findAll('.taxonomy-translation-association__actions .caomei-button')).toHaveLength(0)
    })
})
