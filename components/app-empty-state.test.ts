import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import AppEmptyState from './app-empty-state.vue'

/**
 * 共享空态契约（[界面自检清单 U1](../docs/design/ui-review-checklist.md)）：
 * 图标 + 说明 + 主操作；未传文案时不渲染空段落，未传 `action` 插槽时不渲染操作区。
 */
const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    setup: (_props, { slots }) => () => h('button', { class: 'caomei-button' }, slots.default?.()),
})

describe('AppEmptyState', () => {
    it('渲染图标、标题、说明与主操作', async () => {
        const wrapper = await mountSuspended(AppEmptyState, {
            props: {
                title: '暂无分类',
                description: '创建第一个分类，为文章建立主题入口。',
            },
            slots: {
                action: () => h(CaomeiButtonStub, () => '新建分类'),
            },
        })

        expect(wrapper.find('.app-empty-state__icon svg').exists()).toBe(true)
        expect(wrapper.find('.app-empty-state__title').text()).toBe('暂无分类')
        expect(wrapper.find('.app-empty-state__description').text()).toBe('创建第一个分类，为文章建立主题入口。')
        expect(wrapper.find('.app-empty-state__action button').text()).toBe('新建分类')
    })

    it('缺省文案与操作时不渲染对应节点（图标仍保留）', async () => {
        const wrapper = await mountSuspended(AppEmptyState)

        expect(wrapper.find('.app-empty-state__icon svg').exists()).toBe(true)
        expect(wrapper.find('.app-empty-state__title').exists()).toBe(false)
        expect(wrapper.find('.app-empty-state__description').exists()).toBe(false)
        expect(wrapper.find('.app-empty-state__action').exists()).toBe(false)
    })
})
