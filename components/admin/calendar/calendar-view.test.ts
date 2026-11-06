import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import CalendarView from './calendar-view.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：月历视图的工具栏与网格结构。
 *
 * 日期网格不进入跨日视觉基线（参考态不可跨日复现），由本测试锁定结构契约。
 */

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' }, iconOnly: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const stubs = {
    CaomeiButton: CaomeiButtonStub,
    CaomeiSelectButton: defineComponent({
        name: 'CaomeiSelectButton',
        props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
        setup: (props) => () => h('div', { class: 'caomei-select-button', 'data-options': String((props.options as unknown[]).length), 'data-value': props.modelValue }),
    }),
    CaomeiProgressSpinner: defineComponent({
        name: 'CaomeiProgressSpinner',
        setup: () => () => h('span', { class: 'caomei-spinner' }),
    }),
}

const mountView = (loading = false) => mountSuspended(CalendarView, {
    props: { loading, calendarPosts: [] },
    global: { stubs },
})

describe('calendar-view 迁移契约', () => {
    it('工具栏渲染上一 / 下一周期与今天按钮', async () => {
        const wrapper = await mountView()
        const labels = wrapper.findAll('.caomei-button').map((button) => button.attributes('data-label'))

        const iconButtons = wrapper.findAll('.caomei-button').filter((button) => button.attributes('data-icon-only') === 'true')

        expect(iconButtons).toHaveLength(2)
        expect(new Set(labels.filter(Boolean)).size).toBe(2)
        expect(wrapper.text()).toContain('pages.admin.calendar.today_btn')
    })

    it('视图切换使用 SelectButton 的两个选项', async () => {
        const wrapper = await mountView()
        const selectButton = wrapper.find('.caomei-select-button')

        expect(selectButton.exists()).toBe(true)
        expect(selectButton.attributes('data-options')).toBe('2')
    })

    it('加载态渲染 CaomeiProgressSpinner，就绪态渲染月份网格', async () => {
        const loading = await mountView(true)
        expect(loading.find('.caomei-spinner').exists()).toBe(true)

        const ready = await mountView(false)
        expect(ready.findAll('.calendar-view__cell').length).toBeGreaterThan(0)
    })
})
