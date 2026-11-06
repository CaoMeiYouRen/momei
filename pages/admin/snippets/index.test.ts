import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import AdminSnippets from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/snippets` 迁移后的结构与分页契约。
 *
 * 覆盖：聚合按钮的禁用条件、空态渲染、卡片列表接线，以及 `CaomeiPaginator` 的 1 基页码
 * 到 `useAdminList.onPage({ page, rows })` 的转换（迁移前为 PrimeVue 0 基 `first`）。
 * 真实渲染与像素由 parity 与 E2E 承担。
 */

const { listState, onPageMock, capturedOptions } = vi.hoisted(() => ({
    listState: {
        items: [] as Record<string, unknown>[],
        total: 0,
        limit: 12,
        loading: false,
    },
    onPageMock: vi.fn(),
    capturedOptions: { value: null as Record<string, unknown> | null },
}))

vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            capturedOptions.value = options
            return {
                items: vue.ref(listState.items),
                pagination: vue.computed(() => ({ total: listState.total, limit: listState.limit })),
                loading: vue.ref(listState.loading),
                refresh: vi.fn(),
                onPage: onPageMock,
            }
        },
    }
})

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return { ...actual, useToast: () => ({ show: vi.fn() }) }
})

vi.mock('@/utils/shared/date', () => ({ formatDate: (value: string) => `d:${value}` }))

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        iconOnly: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            disabled: props.disabled,
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const CaomeiCheckboxStub = defineComponent({
    name: 'CaomeiCheckbox',
    props: { modelValue: { type: Array, default: () => [] }, value: { type: [String, Number], default: '' } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            type: 'checkbox',
            class: 'caomei-checkbox',
            'data-value': String(props.value),
            onChange: () => emit('update:modelValue', [...props.modelValue, props.value]),
        })
    },
})

const CaomeiPaginatorStub = defineComponent({
    name: 'CaomeiPaginator',
    props: { page: { type: Number, default: 1 }, itemsPerPage: { type: Number, default: 10 }, total: { type: Number, default: 0 } },
    emits: ['update:page'],
    setup(props, { emit }) {
        return () => h('button', {
            class: 'caomei-paginator',
            'data-page': String(props.page),
            'data-total': String(props.total),
            onClick: () => emit('update:page', props.page + 1),
        })
    },
})

const PassThroughStub = (name: string) => defineComponent({
    name,
    setup: (_, { slots }) => () => h('div', { class: `${name}-stub` }, [slots.default?.()]),
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }, [slots.actions?.()]),
    }),
    SnippetCard: defineComponent({
        name: 'SnippetCard',
        props: { snippet: { type: Object, required: true } },
        setup: (props) => () => h('div', { class: 'snippet-card-stub', 'data-id': (props.snippet as { id?: string })?.id }),
    }),
    SnippetQuickCapture: PassThroughStub('SnippetQuickCapture'),
    SnippetBookmarklet: PassThroughStub('SnippetBookmarklet'),
    SnippetAggregateDialog: PassThroughStub('SnippetAggregateDialog'),
    SnippetEditDialog: PassThroughStub('SnippetEditDialog'),
    ConfirmDeleteDialog: PassThroughStub('ConfirmDeleteDialog'),
    AppTooltip: defineComponent({
        name: 'AppTooltip',
        props: { content: { type: String, default: '' } },
        setup: (props, { slots }) => () => h('span', { class: 'app-tooltip', 'data-content': props.content }, [slots.default?.()]),
    }),
    CaomeiButton: CaomeiButtonStub,
    CaomeiCheckbox: CaomeiCheckboxStub,
    CaomeiPaginator: CaomeiPaginatorStub,
}

const mountPage = () => mountSuspended(AdminSnippets, { global: { stubs } })

describe('admin/snippets 页迁移契约', () => {
    beforeEach(() => {
        listState.items = []
        listState.total = 0
        listState.limit = 12
        listState.loading = false
        onPageMock.mockClear()
    })

    it('空列表渲染空态，不渲染分页器', async () => {
        const wrapper = await mountPage()

        expect(wrapper.find('.empty-main-text').exists()).toBe(true)
        expect(wrapper.find('.caomei-paginator').exists()).toBe(false)
    })

    it('无选中片段时聚合按钮禁用', async () => {
        const wrapper = await mountPage()
        const aggregates = wrapper.findAll('.caomei-button').filter((button) => button.text().includes('pages.admin.snippets.aggregate'))

        expect(aggregates).toHaveLength(1)
        expect(aggregates[0]!.attributes('disabled')).toBeDefined()
    })

    it('选中片段后聚合按钮启用', async () => {
        listState.items = [{ id: 's-1', content: 'a', status: 'inbox', source: 'web', media: [] }]
        listState.total = 1
        const wrapper = await mountPage()

        await wrapper.find('.caomei-checkbox').trigger('change')
        await nextTick()

        const aggregate = wrapper.findAll('.caomei-button').find((button) => button.text().includes('pages.admin.snippets.aggregate'))
        expect(aggregate!.attributes('disabled')).toBeUndefined()
    })

    it('分页器 1 基页码转换为 onPage({ page, rows })', async () => {
        listState.items = [{ id: 's-1', content: 'a', status: 'inbox', source: 'web', media: [] }]
        listState.total = 36
        const wrapper = await mountPage()

        expect(capturedOptions.value?.pageIndexBase).toBe(1)
        expect(wrapper.find('.caomei-paginator').attributes('data-page')).toBe('1')
        await wrapper.find('.caomei-paginator').trigger('click')

        expect(onPageMock).toHaveBeenCalledWith({ page: 2, rows: 12 })
    })

    it('页码报告使用当前页与总页数', async () => {
        listState.items = [{ id: 's-1', content: 'a', status: 'inbox', source: 'web', media: [] }]
        listState.total = 36
        const wrapper = await mountPage()

        expect(wrapper.find('.pagination-report').text()).toBe('1 / 3')
    })
})
