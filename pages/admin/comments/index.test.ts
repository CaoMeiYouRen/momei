import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import AdminCommentsPage from './index.vue'
import { CommentStatus, type Comment } from '@/types/comment'

/**
 * 单元层（迁移方案 §8.2 ①）：B2 试点页 `/admin/comments` 的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、Tag 语义色映射
 * （`severity` → `tone`）、行内动作按钮集合、分页事件（caomei `page` 为 1 基）、筛选模型映射
 * （`null` = 全部状态 → `Select` 哨兵值往返）。沿用本仓库既有页面测试的组件 stub 约定，
 * 真实渲染（DOM / 计算样式）由 E2E 与截图识别层承担。
 */

const { fetchMock, openDeleteDialogMock, resetDeleteDialogMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    openDeleteDialogMock: vi.fn(),
    resetDeleteDialogMock: vi.fn(),
}))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useDeleteDialogState', async () => {
    const vue = await import('vue')

    return () => ({
        visible: vue.ref(false),
        item: vue.ref<Comment | null>(null),
        openDeleteDialog: openDeleteDialogMock,
        resetDeleteDialog: resetDeleteDialogMock,
    })
})
mockNuxtImport('useI18nDate', () => () => ({ formatDate: (value: string) => `date:${value}` }))
// 去抖立即执行，便于断言调用次数与参数
mockNuxtImport('useDebounceFn', () => (fn: (...args: unknown[]) => unknown) => fn)

const comments: Comment[] = [
    {
        id: 'c1',
        postId: 'p1',
        authorId: null,
        parentId: null,
        content: '第一条评论',
        authorName: '甲',
        authorEmail: 'a@example.com',
        authorUrl: null,
        status: CommentStatus.PUBLISHED,
        isSticked: false,
        likes: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        post: { id: 'p1', title: '示例文章' },
    },
    {
        id: 'c2',
        postId: 'p1',
        authorId: null,
        parentId: null,
        content: '第二条评论',
        authorName: '乙',
        authorUrl: null,
        status: CommentStatus.SPAM,
        isSticked: false,
        likes: 0,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    },
]

const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        totalRecords: { type: Number, default: 0 },
        rows: { type: Number, default: 10 },
        page: { type: Number, default: 1 },
    },
    emits: ['page'],
    setup(props, { slots, emit }) {
        // 注意：`props.data` / `props.columns` 必须在 render 函数内读取——挂载时数据尚未返回，
        // 若在 setup 阶段捕获会拿到空数组且永不更新。
        return () => {
            const typedColumns = props.columns as { key: string, header?: string }[]
            const typedRows = props.data as Record<string, unknown>[]

            return h('div', { class: 'caomei-data-table' }, [
                h('div', { class: 'stub-headers' }, typedColumns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                }, column.header))),
                ...typedRows.map((row, index) => h('div', { class: 'stub-row' }, typedColumns.map((column) => h('span', {
                    class: 'stub-td',
                    'data-key': column.key,
                }, slots[`cell-${column.key}`]?.({ row, value: row[column.key], index, column }))))),
                typedRows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
                h('button', {
                    class: 'stub-next-page',
                    onClick: () => emit('page', { page: (props.page ?? 1) + 1, rows: props.rows, first: 0, pageCount: 2 }),
                }, 'next'),
            ])
        }
    },
})

const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: 'neutral' } },
    setup(props, { slots }) {
        return () => h('span', { class: `caomei-tag caomei-tag--${props.tone}` }, slots.default?.())
    },
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' } },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            onClick: () => emit('click'),
        }, slots.icon?.())
    },
})

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: { modelValue: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { slots, emit }) {
        return () => h('span', { class: 'caomei-input' }, [
            slots.prefix?.(),
            h('input', {
                value: props.modelValue,
                onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
            }),
        ])
    },
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: {
        modelValue: { type: [String, Number], default: null },
        options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            class: 'caomei-select',
            value: props.modelValue ?? '',
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as { label: string, value: unknown }[]).map((option) => h('option', {
            value: String(option.value),
        }, option.label)))
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String, showLanguageSwitcher: Boolean },
        setup: (props) => () => h('div', {
            class: 'admin-header',
            'data-title': props.title,
            'data-language-switcher': String(props.showLanguageSwitcher),
        }),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        setup: () => () => h('div', { class: 'confirm-delete-dialog' }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
}

async function mountPage() {
    const wrapper = await mountSuspended(AdminCommentsPage, {
        global: {
            mocks: { $t: (key: string) => key },
            stubs,
        },
    })
    // 两次 flush：第一次触发 onMounted（发起请求），第二次等请求 promise 的续延写回 items。
    await flushPromises()
    await flushPromises()

    return wrapper
}

function apiQueryOf(callIndex: number) {
    return fetchMock.mock.calls[callIndex]?.[1]?.query
}

beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ code: 200, data: { items: comments, total: comments.length } })
    openDeleteDialogMock.mockReset()
    resetDeleteDialogMock.mockReset()
})

describe('管理端评论列表（B2 试点页）', () => {
    it('渲染共享页头并传递标题与语言切换开关', async () => {
        const wrapper = await mountPage()

        const header = wrapper.find('.admin-header')
        expect(header.exists()).toBe(true)
        expect(header.attributes('data-title')).toBe('pages.admin.comments.title')
        expect(header.attributes('data-language-switcher')).toBe('true')
    })

    it('初次加载按默认分页与空筛选请求，且渲染在册列定义', async () => {
        const wrapper = await mountPage()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(apiQueryOf(0)).toEqual({ page: 1, limit: 20, keyword: undefined, status: undefined })

        const keys = wrapper.findAll('.stub-th').map((node) => node.attributes('data-key'))
        expect(keys).toEqual(['status', 'author', 'content', 'post', 'createdAt', 'actions'])
    })

    it('列插槽按 row 渲染：作者、内容、日期与文章链接', async () => {
        const wrapper = await mountPage()

        const rows = wrapper.findAll('.stub-row')
        expect(rows).toHaveLength(2)

        expect(rows[0]!.find('[data-key="author"]').text()).toContain('甲')
        expect(rows[0]!.find('[data-key="author"]').text()).toContain('a@example.com')
        expect(rows[0]!.find('[data-key="content"]').text()).toContain('第一条评论')
        expect(rows[0]!.find('[data-key="createdAt"]').text()).toContain('date:2026-01-01T00:00:00.000Z')
        expect(rows[0]!.find('[data-key="post"]').text()).toContain('示例文章')
    })

    it('状态 Tag 使用 tone 语义色（severity → tone 映射）', async () => {
        const wrapper = await mountPage()

        const rows = wrapper.findAll('.stub-row')

        expect(rows[0]!.find('[data-key="status"]').find('.caomei-tag').classes()).toContain('caomei-tag--success')
        expect(rows[1]!.find('[data-key="status"]').find('.caomei-tag').classes()).toContain('caomei-tag--danger')
    })

    it('行内动作按状态收敛（已发布无「通过」、垃圾无「拒绝」、均有删除）', async () => {
        const wrapper = await mountPage()

        const rows = wrapper.findAll('.stub-row')
        const labelsOf = (rowIndex: number) => rows[rowIndex]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')
            .map((button) => button.attributes('data-label'))

        // 已发布行：仅「拒绝 + 删除」；垃圾行：仅「通过 + 删除」（label 为不可见可访问名）
        expect(labelsOf(0)).toEqual(['pages.admin.comments.reject', 'common.delete'])
        expect(labelsOf(1)).toEqual(['pages.admin.comments.approve', 'common.delete'])
    })

    it('分页事件为 1 基页码：触发后按新页码重新请求', async () => {
        const wrapper = await mountPage()

        await wrapper.find('.stub-next-page').trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(apiQueryOf(1)).toEqual({ page: 2, limit: 20, keyword: undefined, status: undefined })
    })

    it('筛选模型映射：全部状态以哨兵承载并在边界还原为 null', async () => {
        const wrapper = await mountPage()

        const select = wrapper.find('.caomei-select')

        await select.setValue(String(CommentStatus.PENDING))
        await flushPromises()
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(apiQueryOf(1)).toEqual({ page: 1, limit: 20, keyword: undefined, status: CommentStatus.PENDING })

        await select.setValue('__all__')
        await flushPromises()
        // 断言调用次数，避免「未触发请求时 query 为 undefined」造成的空转通过
        expect(fetchMock).toHaveBeenCalledTimes(3)
        expect(apiQueryOf(2)).toEqual({ page: 1, limit: 20, keyword: undefined, status: undefined })
    })

    it('空态渲染空态插槽内容', async () => {
        fetchMock.mockResolvedValue({ code: 200, data: { items: [], total: 0 } })
        const wrapper = await mountPage()

        expect(wrapper.find('.stub-empty').exists()).toBe(true)
    })

    it('点击「通过」调用状态更新接口并就地更新行数据', async () => {
        const wrapper = await mountPage()

        // 第二条为垃圾评论：动作集合为「通过 + 删除」，首个按钮即通过
        const approveButton = wrapper.findAll('.stub-row')[1]!
            .find('[data-key="actions"]')
            .findAll('.caomei-button')[0]!

        await approveButton.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/comments/c2', expect.objectContaining({
            method: 'PUT',
            body: { status: CommentStatus.PUBLISHED },
        }))
        expect(wrapper.findAll('.stub-row')[1]!.find('[data-key="status"]').find('.caomei-tag').classes()).toContain('caomei-tag--success')
    })

    it('请求失败时记录错误且不抛出（页面保持可渲染）', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())
        fetchMock.mockRejectedValue(new Error('Network error'))

        const wrapper = await mountPage()

        expect(consoleSpy).toHaveBeenCalledWith('Failed to load comments:', expect.any(Error))
        expect(wrapper.findAll('.stub-row')).toHaveLength(0)
        expect(wrapper.find('.stub-empty').exists()).toBe(true)

        consoleSpy.mockRestore()
    })
})
