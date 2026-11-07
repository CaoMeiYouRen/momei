import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import DashboardPage from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin` 仪表盘的 Tabs / 语言范围选择 / 标签 tone / 排行卡结构。
 *
 * `/admin` 不进跨日视觉基线（指标窗口按运行时日期计算），故由本测试 + 浏览器探针承担。
 */

const { refreshMock, scopeHolder } = vi.hoisted(() => ({
    refreshMock: vi.fn(),
    scopeHolder: { value: null as null | { value: 'all' | 'public' } },
}))

const metric = (total: number) => ({ total, previousTotal: total - 1, delta: 1, deltaRate: 1 })

const taxonomy = (id: string, name: string) => ({
    id,
    clusterId: id,
    name,
    slug: id,
    language: 'zh-CN',
    postCount: 2,
    views: 10,
    commentCount: 1,
})

vi.mock('@/composables/use-admin-content-insights-page', async () => {
    const { ref: vueRef } = await import('vue')
    const scope = vueRef<'all' | 'public'>('all')
    scopeHolder.value = scope as unknown as { value: 'all' | 'public' }

    return {
        useAdminContentInsightsPage: () => ({
            dashboard: ref({
                selectedRange: 30,
                scope: 'all',
                contentLanguage: null,
                timezone: 'Asia/Shanghai',
                generatedAt: '2026-11-07T00:00:00.000Z',
                summaries: [{
                    days: 30,
                    metrics: { views: metric(100), comments: metric(20), posts: metric(5) },
                    currentWindow: { start: '2026-10-09', end: '2026-11-07' },
                    previousWindow: { start: '2026-09-09', end: '2026-10-08' },
                    trend: [],
                }],
                rankings: {
                    posts: [{
                        id: 'p1',
                        clusterId: 'p1',
                        title: 'Hello',
                        slug: 'hello',
                        language: 'zh-CN',
                        status: 'published',
                        visibility: 'public',
                        views: 12,
                        commentCount: 3,
                        publishedAt: '2026-11-01T00:00:00.000Z',
                        createdAt: '2026-11-01T00:00:00.000Z',
                        category: { id: 'c1', name: 'Tech', slug: 'tech', language: 'zh-CN' },
                    }],
                    tags: [taxonomy('t1', 'Vue')],
                    categories: [taxonomy('c1', 'Tech')],
                },
            }),
            loading: ref(false),
            selectedRange: ref(30),
            selectedSummary: ref({
                days: 30,
                metrics: { views: metric(100), comments: metric(20), posts: metric(5) },
                currentWindow: { start: '2026-10-09', end: '2026-11-07' },
                previousWindow: { start: '2026-09-09', end: '2026-10-08' },
                trend: [],
            }),
            scope,
            scopeOptions: ref([
                { label: '全部范围', value: 'all' },
                { label: '公开内容', value: 'public' },
            ]),
            timezone: ref('Asia/Shanghai'),
            refresh: refreshMock,
        }),
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
    }
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: '' } },
    setup: (props, { slots }) => () => h('span', { class: 'caomei-tag', 'data-tone': props.tone }, slots.default?.()),
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        id: { type: String, default: '' },
        modelValue: { type: String, default: '' },
        options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('div', { class: 'caomei-select', 'data-value': props.modelValue }, [
            ...(props.options as { label: string, value: string }[]).map((option) =>
                h('button', { class: 'select-option', 'data-value': option.value, onClick: () => emit('update:modelValue', option.value) }, option.label)),
        ])
    },
})

const CaomeiTabsStub = defineComponent({
    name: 'CaomeiTabs',
    props: {
        modelValue: { type: String, default: '' },
        unmountOnHide: { type: Boolean, default: true },
    },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
        return () => h('div', {
            class: 'caomei-tabs',
            'data-value': props.modelValue,
            'data-unmount': String(props.unmountOnHide),
        }, [
            slots.default?.(),
            h('button', { class: 'tabs-switch', onClick: () => emit('update:modelValue', 'creator') }, 'switch'),
        ])
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }, [slots.actions?.()]),
    }),
    CaomeiButton: defineComponent({
        name: 'CaomeiButton',
        props: { loading: { type: Boolean, default: false } },
        emits: ['click'],
        setup: (props, { slots, emit }) => () => h('button', {
            class: 'caomei-button',
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()]),
    }),
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
    CaomeiSelect: CaomeiSelectStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiProgressSpinner: defineComponent({ name: 'CaomeiProgressSpinner', setup: () => () => h('span', { class: 'caomei-spinner' }) }),
    CaomeiCard: defineComponent({
        name: 'CaomeiCard',
        setup: (_, { slots }) => () => h('div', { class: 'caomei-card' }, [slots.title?.(), slots.default?.()]),
    }),
    AdminDashboardMetricCard: defineComponent({
        name: 'AdminDashboardMetricCard',
        props: { label: { type: String, default: '' } },
        setup: (props) => () => h('div', { class: 'metric-card-stub', 'data-label': props.label }),
    }),
    CreatorStatsPanel: defineComponent({
        name: 'CreatorStatsPanel',
        props: { refreshSignal: { type: Number, default: 0 } },
        setup: (props) => () => h('div', { class: 'creator-panel-stub', 'data-refresh-signal': String(props.refreshSignal) }),
    }),
}

const mountPage = () => mountSuspended(DashboardPage, { global: { stubs } })

describe('admin 仪表盘迁移契约', () => {
    it('渲染两个页签且关闭内容卸载', async () => {
        const wrapper = await mountPage()
        const triggers = wrapper.findAll('.tab-trigger').map((item) => item.attributes('data-value'))

        expect(triggers).toEqual(['insights', 'creator'])
        expect(wrapper.find('.caomei-tabs').attributes('data-unmount')).toBe('false')
    })

    it('语言范围选择保留两个选项并按值回写', async () => {
        const wrapper = await mountPage()
        const select = wrapper.find('.caomei-select')

        expect(select.attributes('data-value')).toBe('all')
        expect(wrapper.findAll('.select-option').map((item) => item.attributes('data-value'))).toEqual(['all', 'public'])

        await wrapper.findAll('.select-option')[1]!.trigger('click')
        expect(scopeHolder.value?.value).toBe('public')
    })

    it('说明标签按语义使用 neutral / primary / warning tone', async () => {
        const wrapper = await mountPage()
        const notes = wrapper.find('.admin-dashboard__notes')
        const tones = notes.findAll('.caomei-tag').map((tag) => tag.attributes('data-tone'))

        expect(tones).toEqual(['neutral', 'primary', 'warning', 'neutral'])
    })

    it('渲染三张指标卡与三张排行卡，排行卡以 CaomeiCard 承载', async () => {
        const wrapper = await mountPage()

        expect(wrapper.findAll('.metric-card-stub')).toHaveLength(3)
        expect(wrapper.findAll('.admin-dashboard__ranking-card')).toHaveLength(3)
        expect(wrapper.findAll('.admin-dashboard__ranking-card.caomei-card')).toHaveLength(3)
        expect(wrapper.find('.admin-dashboard__ranking-meta .caomei-tag').text()).toBe('ZH-CN')
    })

    it('刷新按钮在创作页签下切换为 refreshSignal，在洞察页签调用 refresh', async () => {
        refreshMock.mockClear()
        const wrapper = await mountPage()

        await wrapper.find('.caomei-button').trigger('click')
        expect(refreshMock).toHaveBeenCalledTimes(1)

        await wrapper.find('.tabs-switch').trigger('click')
        expect(wrapper.find('.creator-panel-stub').attributes('data-refresh-signal')).toBe('0')

        await wrapper.find('.caomei-button').trigger('click')
        /* 创作页签下应自增 refreshSignal 而不是调用 insights 的 refresh。 */
        expect(wrapper.find('.creator-panel-stub').attributes('data-refresh-signal')).toBe('1')
        expect(refreshMock).toHaveBeenCalledTimes(1)
    })
})
