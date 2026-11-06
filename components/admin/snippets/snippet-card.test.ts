import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import SnippetCard from './snippet-card.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：片段卡片的渲染契约。
 *
 * 覆盖：状态 `Tag` 的 tone 映射与文本、三个 icon-only 按钮的可访问名、markdown 内容、
 * 媒体图片数量与转换链接。真实像素由 parity 承担。
 */

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: '' }, size: { type: String, default: '' } },
    setup: (props, { slots }) => () => h('span', {
        class: 'caomei-tag',
        'data-tone': props.tone,
        'data-size': props.size,
    }, slots.default?.()),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        tone: { type: String, default: '' },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            'data-tone': props.tone,
            onClick: () => emit('click'),
        }, [slots.icon?.()])
    },
})

const CaomeiImageStub = defineComponent({
    name: 'CaomeiImage',
    props: { src: { type: String, default: '' }, preview: { type: Boolean, default: false } },
    setup: (props) => () => h('span', { class: 'caomei-image', 'data-src': props.src }),
})

const stubs = {
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiImage: CaomeiImageStub,
    AppTooltip: defineComponent({
        name: 'AppTooltip',
        props: { content: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('span', { class: 'app-tooltip', 'data-content': props.content }, [slots.default?.()]),
    }),
}

const baseSnippet = {
    id: 's-1',
    content: '**hello** world',
    status: 'inbox',
    source: 'web',
    createdAt: '2026-11-06T00:00:00.000Z',
    media: [] as string[],
    post: null as { id: string, title?: string } | null,
}

const mountCard = (snippet: Record<string, unknown>) => mountSuspended(SnippetCard, {
    props: { snippet: snippet as never },
    global: { stubs },
})

describe('snippet-card 迁移契约', () => {
    it('状态 Tag 使用 tone 映射与本地化文本', async () => {
        const wrapper = await mountCard(baseSnippet)
        const tag = wrapper.find('.caomei-tag')

        expect(tag.attributes('data-tone')).toBe('warning')
        expect(tag.text()).toContain('pages.admin.snippets.inbox')
        expect(tag.attributes('data-size')).toBe('sm')
    })

    it('三个 icon-only 按钮均带可访问名', async () => {
        const wrapper = await mountCard(baseSnippet)
        const buttons = wrapper.findAll('.caomei-button')
        const labels = buttons.map((button) => button.attributes('data-label'))

        expect(buttons).toHaveLength(3)
        expect(buttons.every((button) => button.attributes('data-icon-only') === 'true')).toBe(true)
        expect(labels.every((label) => typeof label === 'string' && label.length > 0)).toBe(true)
        expect(labels[0]).toBe('pages.admin.snippets.convert_to_post')
    })

    it('渲染 markdown 内容与来源图标', async () => {
        const wrapper = await mountCard(baseSnippet)

        expect(wrapper.find('.snippet-card__content').html()).toContain('<strong>hello</strong>')
        expect(wrapper.find('.snippet-card__source svg').exists()).toBe(true)
    })

    it('有媒体时渲染同数量图片，有 post 时渲染转换链接', async () => {
        const wrapper = await mountCard({
            ...baseSnippet,
            status: 'converted',
            media: ['https://example.com/a.png', 'https://example.com/b.png'],
            post: { id: 'p-1', title: 'Converted Post' },
        })

        expect(wrapper.findAll('.caomei-image')).toHaveLength(2)
        expect(wrapper.find('.snippet-card__post-link').text()).toContain('Converted Post')
        expect(wrapper.find('.caomei-tag').attributes('data-tone')).toBe('success')
    })
})
