import fs from 'node:fs'
import path from 'node:path'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import CalendarPage from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：内容日历页的 Tabs 与语言选择接线。
 *
 * 语言选项包含「全部语言」（生产值为 null），caomei `Select` 会丢弃 null 值选项，
 * 页面侧映射为非空哨兵 `'__all__'` 并在回写时还原——空字符串会触发 reka `SelectItem`
 * 断言，故哨兵必须非空。本测试锁住该契约。
 */

const { setContentLanguageMock } = vi.hoisted(() => ({ setContentLanguageMock: vi.fn() }))

vi.mock('@/composables/use-admin-i18n', async () => {
    const vue = await import('vue')
    return {
        useAdminI18n: () => ({
            contentLanguage: vue.ref(null),
            setContentLanguage: setContentLanguageMock,
            availableLocales: vue.ref([
                { label: '全部语言', value: null },
                { label: '简体中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
            ]),
        }),
    }
})

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }),
}))

vi.mock('@/i18n/config/locale-runtime-loader', () => ({
    ensureLocaleMessageModules: vi.fn().mockResolvedValue(undefined),
}))

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('div', { class: 'caomei-select', 'data-options': String((props.options as unknown[]).length), 'data-value': props.modelValue }, [
            ...(props.options as { label: string, value: string }[]).map((option) =>
                h('button', { class: 'select-option', 'data-value': option.value, onClick: () => emit('update:modelValue', option.value) }, option.label)),
        ])
    },
})

const CaomeiTabsStub = defineComponent({
    name: 'CaomeiTabs',
    props: { modelValue: { type: String, default: '' }, unmountOnHide: { type: Boolean, default: true } },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
        return () => h('div', {
            class: 'caomei-tabs',
            'data-value': props.modelValue,
            'data-unmount': String(props.unmountOnHide),
        }, [
            slots.default?.(),
            h('button', { class: 'tabs-switch', onClick: () => emit('update:modelValue', 'kanban') }, 'switch'),
        ])
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }),
    }),
    CaomeiSelect: CaomeiSelectStub,
    CaomeiTabs: CaomeiTabsStub,
    CaomeiTabList: defineComponent({ name: 'CaomeiTabList', setup: (_, { slots }) => () => h('div', { class: 'tab-list' }, slots.default?.()) }),
    CaomeiTabTrigger: defineComponent({
        name: 'CaomeiTabTrigger',
        props: { value: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('button', { class: 'tab-trigger', 'data-value': props.value }, slots.default?.()),
    }),
    CaomeiTabContent: defineComponent({
        name: 'CaomeiTabContent',
        props: { value: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('div', { class: 'tab-content', 'data-value': props.value }, slots.default?.()),
    }),
    CalendarView: defineComponent({ name: 'CalendarView', setup: () => () => h('div', { class: 'calendar-view-stub' }) }),
    KanbanView: defineComponent({ name: 'KanbanView', setup: () => () => h('div', { class: 'kanban-view-stub' }) }),
}

const mountPage = (overrideStubs: Record<string, unknown> = {}) => mountSuspended(CalendarPage, {
    global: { stubs: { ...stubs, ...overrideStubs } },
})

describe('admin/calendar 页迁移契约', () => {
    it('语言选项保留「全部语言」哨兵项，回写时还原为 null', async () => {
        const wrapper = await mountPage()
        const select = wrapper.find('.caomei-select')

        expect(select.attributes('data-options')).toBe('3')
        expect(select.attributes('data-value')).toBe('__all__')

        expect(wrapper.findAll('.select-option').map((item) => item.attributes('data-value'))[0]).toBe('__all__')
        await wrapper.findAll('.select-option')[0]!.trigger('click')
        expect(setContentLanguageMock).toHaveBeenCalledWith(null)

        await wrapper.findAll('.select-option')[2]!.trigger('click')
        expect(setContentLanguageMock).toHaveBeenCalledWith('en-US')
    })

    it('真实 CaomeiSelect 渲染「全部语言」触发器', async () => {
        const wrapper = await mountPage({ CaomeiSelect: false })

        expect(wrapper.text()).toContain('全部语言')
    })

    it('哨兵必须非空（源码守卫：空串会触发 reka SelectItem 断言）', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'pages/admin/calendar/index.vue'), 'utf8')

        expect(source).toContain("const ALL_LANGUAGES_SENTINEL = '__all__'")
        expect(source).not.toContain("?? ''")
    })

    it('渲染两个页签且 Tabs 关闭内容卸载', async () => {
        const wrapper = await mountPage()
        const tabs = wrapper.find('.caomei-tabs')

        expect(tabs.attributes('data-value')).toBe('calendar')
        expect(tabs.attributes('data-unmount')).toBe('false')
        expect(wrapper.findAll('.tab-trigger').map((item) => item.attributes('data-value'))).toEqual(['calendar', 'kanban'])
    })

    it('切页签更新 activeTab', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.tabs-switch').trigger('click')

        expect(wrapper.find('.caomei-tabs').attributes('data-value')).toBe('kanban')
    })
})
