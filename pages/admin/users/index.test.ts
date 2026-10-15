import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminUsers from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/users` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖「迁移后仍然成立、且与迁移无关」的页面契约：列定义与 `#cell-{key}` 插槽接线、
 * `Badge` 语义色映射（`severity` → `tone`）、动作集合的 tone 与可访问名、
 * `AppAvatar` → `AppAvatarV2` 的消费处替换、懒加载服务端分页的 1 基页码契约、
 * **服务端排序的 `@sort` 载荷归一**、筛选与删除确认。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 *
 * 排序自证：迁移前 PrimeVue 为 `lazy` + `@sort`（服务端排序），未绑定受控排序 prop；
 * caomei `@sort` 的 `sortOrder` 为字符串（`'asc' | 'desc' | ''`），PrimeVue 为数值（`1 | -1 | 0`），
 * 归一动作落在共享 composable 内。本用例断言页面**原样转发** caomei 载荷（页面侧不得各写包装）。
 */

const { authClientMock, formatDateMock, relativeTimeMock, useAdminListCalls, useAdminListState, onPageMock, onSortMock, onFilterChangeMock, refreshMock, confirmRequireMock, feedbackMocks } = vi.hoisted(() => ({
    authClientMock: {
        admin: {
            listUsers: vi.fn(),
            setRole: vi.fn(),
            unbanUser: vi.fn(),
            banUser: vi.fn(),
            impersonateUser: vi.fn(),
            removeUser: vi.fn(),
        },
    },
    formatDateMock: vi.fn((value?: string | null) => value ? `date:${value}` : '-'),
    relativeTimeMock: vi.fn((value?: string | null) => value ? `rel:${value}` : '-'),
    useAdminListCalls: [] as Record<string, unknown>[],
    useAdminListState: {
        rows: [] as Record<string, unknown>[],
        pagination: { page: 1, limit: 10, total: 0 },
    },
    onPageMock: vi.fn(),
    onSortMock: vi.fn(),
    onFilterChangeMock: vi.fn(),
    refreshMock: vi.fn(),
    confirmRequireMock: vi.fn(),
    feedbackMocks: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({ authClient: authClientMock }))

vi.mock('@/composables/use-admin-list', async () => {
    const vue = await import('vue')

    return {
        useAdminList: (options: Record<string, unknown>) => {
            useAdminListCalls.push(options)

            return {
                items: vue.ref(useAdminListState.rows),
                loading: vue.ref(false),
                pagination: vue.ref({ ...useAdminListState.pagination }),
                filters: vue.ref(options.initialFilters ?? {}),
                sort: vue.ref({ field: 'createdAt', order: 'desc' }),
                onPage: onPageMock,
                onSort: onSortMock,
                onFilterChange: onFilterChangeMock,
                refresh: refreshMock,
            }
        },
    }
})

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        d: formatDateMock,
        relativeTime: relativeTimeMock,
    }),
}))

vi.mock('@/composables/use-request-feedback', () => ({
    useRequestFeedback: () => feedbackMocks,
}))

vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => ({ require: confirmRequireMock }),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
}))

vi.stubGlobal('definePageMeta', vi.fn())

const sampleRows: Record<string, unknown>[] = [
    {
        id: 'u-1',
        name: 'Ada',
        email: 'ada@example.com',
        image: 'https://cdn.example.com/ada.png',
        role: 'admin',
        banned: false,
        createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
        id: 'u-2',
        name: 'Bob',
        email: 'bob@example.com',
        image: null,
        role: 'author',
        banned: true,
        createdAt: '2026-02-02T00:00:00.000Z',
    },
    {
        id: 'u-3',
        name: 'Cara',
        email: 'cara@example.com',
        image: null,
        role: 'user',
        banned: false,
        createdAt: '2026-02-03T00:00:00.000Z',
    },
    {
        id: 'u-4',
        name: 'Dana',
        email: 'dana@example.com',
        image: null,
        role: 'moderator',
        banned: false,
        createdAt: '2026-02-04T00:00:00.000Z',
    },
]

const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        paginator: { type: Boolean, default: false },
        rows: { type: Number, default: 0 },
        lazy: { type: Boolean, default: false },
        page: { type: Number, default: undefined },
        totalRecords: { type: Number, default: undefined },
        rowKey: { type: String, default: '' },
        // 声明受控排序 prop 以便断言「页面未绑定」（迁移前同样未绑定）
        sortField: { type: String, default: undefined },
        sortOrder: { type: String, default: undefined },
    },
    emits: ['page', 'sort'],
    setup(props, { slots, emit }) {
        return () => {
            const columns = props.columns as { key: string, header?: string, align?: string, sortable?: boolean }[]
            const rows = props.data as Record<string, unknown>[]
            // 明确处理未知类型，避免 `String(value)` 对对象产生 `[object Object]`（ESLint `no-base-to-string`）
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
            }
            const renderCell = (row: Record<string, unknown>, index: number, column: { key: string }) => {
                const cellSlot = slots[`cell-${column.key}`]
                const content = cellSlot ? cellSlot({ row, value: row[column.key], index, column }) : defaultCell(row[column.key])

                return h('span', { class: 'stub-td', 'data-key': column.key }, content)
            }

            return h('div', { class: 'caomei-data-table' }, [
                h('div', { class: 'stub-headers' }, columns.map((column) => h('span', {
                    class: 'stub-th',
                    'data-key': column.key,
                    'data-align': column.align ?? '',
                    'data-sortable': String(column.sortable ?? false),
                }, column.header))),
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => renderCell(row, index, column)))),
                h('button', {
                    class: 'stub-next-page',
                    onClick: () => emit('page', { page: 2, rows: props.rows, first: props.rows, pageCount: 3 }),
                }, 'next'),
                // caomei `@sort` 载荷：`sortOrder` 为字符串（PrimeVue 为数值）
                h('button', {
                    class: 'stub-sort-asc',
                    onClick: () => emit('sort', { sortField: 'name', sortOrder: 'asc' }),
                }, 'sort-asc'),
                h('button', {
                    class: 'stub-sort-desc',
                    onClick: () => emit('sort', { sortField: 'createdAt', sortOrder: 'desc' }),
                }, 'sort-desc'),
            ])
        }
    },
})

const CaomeiBadgeStub = defineComponent({
    name: 'CaomeiBadge',
    props: { value: { type: String, default: '' }, tone: { type: String, default: '' } },
    setup: (props) => () => h('span', { class: 'badge', 'data-tone': props.tone, 'data-value': props.value }, props.value),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        rounded: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
        size: { type: String, default: '' },
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-tone': props.tone,
            'data-variant': props.variant,
            'data-icon-only': String(props.iconOnly),
            'data-rounded': String(props.rounded),
            'data-loading': String(props.loading),
            'data-size': props.size,
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const AppAvatarV2Stub = defineComponent({
    name: 'AppAvatarV2',
    inheritAttrs: false,
    props: {
        image: { type: String, default: '' },
        email: { type: String, default: '' },
        name: { type: String, default: '' },
        size: { type: String, default: '' },
        shape: { type: String, default: '' },
    },
    setup: (props) => () => h('span', {
        class: 'app-avatar-v2',
        'data-image': props.image,
        'data-email': props.email,
        'data-name': props.name,
        'data-size': props.size,
        'data-shape': props.shape,
    }),
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }, [slots.actions?.()]),
    }),
    AdminUsersUserFilters: defineComponent({
        name: 'AdminUsersUserFilters',
        props: { filters: Object },
        emits: ['update:filters', 'change'],
        setup: (props, { emit }) => () => h('div', {
            class: 'user-filters-stub',
            'data-filters': JSON.stringify(props.filters),
            onClick: () => emit('change'),
        }),
    }),
    AdminUsersUserRoleDialog: defineComponent({
        name: 'AdminUsersUserRoleDialog',
        props: { visible: Boolean, user: Object },
        emits: ['update:visible', 'success'],
        setup: (props) => () => h('div', { class: 'role-dialog-stub', 'data-visible': String(props.visible), 'data-user': props.user ? String((props.user as Record<string, unknown>).id) : '' }),
    }),
    AdminUsersUserBanDialog: defineComponent({
        name: 'AdminUsersUserBanDialog',
        props: { visible: Boolean, user: Object },
        emits: ['update:visible', 'success'],
        setup: (props) => () => h('div', { class: 'ban-dialog-stub', 'data-visible': String(props.visible), 'data-user': props.user ? String((props.user as Record<string, unknown>).id) : '' }),
    }),
    AdminUsersUserSessionsDrawer: defineComponent({
        name: 'AdminUsersUserSessionsDrawer',
        props: { visible: Boolean, user: Object },
        emits: ['update:visible'],
        setup: (props) => () => h('div', { class: 'sessions-drawer-stub', 'data-visible': String(props.visible), 'data-user': props.user ? String((props.user as Record<string, unknown>).id) : '' }),
    }),
    ConfirmDeleteDialog: defineComponent({
        name: 'ConfirmDeleteDialog',
        props: { visible: Boolean, title: String, message: String },
        emits: ['confirm'],
        setup: (props, { emit }) => () => h('div', {
            class: 'confirm-delete-dialog',
            'data-visible': String(props.visible),
            'data-message': props.message ?? '',
            onClick: () => emit('confirm'),
        }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiBadge: CaomeiBadgeStub,
    CaomeiButton: CaomeiButtonStub,
    AppAvatarV2: AppAvatarV2Stub,
}

async function mountComponent(
    rows: Record<string, unknown>[] = sampleRows,
    pagination = { page: 1, limit: 10, total: rows.length },
) {
    useAdminListState.rows = rows.map((row) => ({ ...row }))
    useAdminListState.pagination = { ...pagination }

    const wrapper = await mountSuspended(AdminUsers, {
        global: {
            stubs,
            mocks: { $t: (key: string) => key },
        },
    })
    await nextTick()

    return wrapper
}

describe('AdminUsers page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAdminListCalls.length = 0
        authClientMock.admin.unbanUser.mockResolvedValue({ error: null })
        authClientMock.admin.removeUser.mockResolvedValue({ error: null })
    })

    it('渲染页头与刷新按钮（secondary 变体，可见文本落默认插槽）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-page-header').attributes('data-title')).toBe('pages.admin.users.title')

        const refresh = wrapper.findAll('.caomei-button').find((button) => button.text().includes('common.refresh'))
        expect(refresh).toBeTruthy()
        expect(refresh!.attributes('data-variant')).toBe('secondary')
        expect(refresh!.attributes('data-icon-only')).toBe('false')
    })

    it('渲染 caomei 数据表与全部浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.caomei-data-table').exists()).toBe(true)
        expect(wrapper.find('.role-dialog-stub').exists()).toBe(true)
        expect(wrapper.find('.ban-dialog-stub').exists()).toBe(true)
        expect(wrapper.find('.sessions-drawer-stub').exists()).toBe(true)
        expect(wrapper.find('.confirm-delete-dialog').exists()).toBe(true)
    })

    it('声明在册列定义（name / role / banned / createdAt / actions）与可排序列', async () => {
        const wrapper = await mountComponent()

        const headers = wrapper.findAll('.stub-th')
        expect(headers.map((node) => node.attributes('data-key'))).toEqual([
            'name',
            'role',
            'banned',
            'createdAt',
            'actions',
        ])
        // 迁移前 `sortable` 列为 name / role / createdAt（服务端排序接线）
        expect(headers.map((node) => node.attributes('data-sortable'))).toEqual(['true', 'true', 'false', 'true', 'false'])
        // 迁移前动作列 `class="text-left"` 是 PrimeVue 默认对齐，迁移后不显式声明
        expect(headers.every((node) => node.attributes('data-align') === '')).toBe(true)
    })

    it('用户列渲染 AppAvatarV2（size=normal）与姓名 / 邮箱', async () => {
        const wrapper = await mountComponent()

        const cell = wrapper.findAll('.stub-row')[0]!.find('[data-key="name"]')
        const avatar = cell.find('.app-avatar-v2')
        expect(avatar.attributes('data-image')).toBe('https://cdn.example.com/ada.png')
        expect(avatar.attributes('data-name')).toBe('Ada')
        expect(avatar.attributes('data-email')).toBe('ada@example.com')
        expect(avatar.attributes('data-shape')).toBe('circle')
        expect(avatar.attributes('data-size')).toBe('normal')
        expect(cell.find('.user-info__name').text()).toBe('Ada')
        expect(cell.find('.user-info__email').text()).toBe('ada@example.com')
    })

    it('角色 Badge 的 severity → tone 映射（admin→danger / author→primary / user→neutral / 其他→neutral）', async () => {
        const wrapper = await mountComponent()

        const badges = wrapper.findAll('.stub-row').map((row) => row.find('[data-key="role"] .badge'))
        expect(badges.map((badge) => badge.attributes('data-tone'))).toEqual(['danger', 'primary', 'neutral', 'neutral'])
        expect(badges[0]!.attributes('data-value')).toBe('pages.admin.users.roles.admin')
    })

    it('状态 Badge 随 banned 翻转 tone（banned→danger / active→success）', async () => {
        const wrapper = await mountComponent()

        const badges = wrapper.findAll('.stub-row').map((row) => row.find('[data-key="banned"] .badge'))
        expect(badges[0]!.attributes('data-tone')).toBe('success')
        expect(badges[0]!.attributes('data-value')).toBe('pages.admin.users.active')
        expect(badges[1]!.attributes('data-tone')).toBe('danger')
        expect(badges[1]!.attributes('data-value')).toBe('pages.admin.users.banned')
    })

    it('创建时间列同时经 d 与 relativeTime，并保留视觉遮罩属性', async () => {
        const wrapper = await mountComponent()

        const cell = wrapper.findAll('.stub-row')[0]!.find('[data-key="createdAt"]')
        expect(cell.find('.user-created-at').attributes('data-visual-mask')).toBeDefined()
        expect(cell.find('.user-created-at__date').text()).toBe('date:2026-02-01T00:00:00.000Z')
        expect(cell.find('.user-created-at__relative').text()).toBe('rel:2026-02-01T00:00:00.000Z')
    })

    it('动作列渲染 5 个 icon-only ghost 按钮，tone 与可访问名按行状态决定', async () => {
        const wrapper = await mountComponent()

        const activeRowActions = wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')
        expect(activeRowActions).toHaveLength(5)
        expect(activeRowActions.map((button) => button.attributes('data-tone'))).toEqual([
            'primary', // 修改角色（迁移前 severity="info"）
            'warning', // 封禁（未封禁）
            'neutral', // 查看会话（迁移前 severity="secondary"）
            'primary', // 模拟登录（迁移前 severity="help"）
            'danger', // 删除
        ])
        for (const button of activeRowActions) {
            expect(button.attributes('data-icon-only')).toBe('true')
            expect(button.attributes('data-variant')).toBe('ghost')
            expect(button.attributes('data-rounded')).toBe('true')
            // caomei `label` 为不可见可访问名：icon-only 按钮必须提供
            expect(button.attributes('data-label')).toBeTruthy()
        }

        const bannedRowActions = wrapper.findAll('.stub-row')[1]!.findAll('[data-key="actions"] .caomei-button')
        expect(bannedRowActions[1]!.attributes('data-tone')).toBe('success')
        expect(bannedRowActions[1]!.attributes('data-label')).toBe('pages.admin.users.unban_user')
    })

    it('点击修改角色按钮打开角色浮层并携带该行', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[0]!.trigger('click')
        await nextTick()

        const dialog = wrapper.find('.role-dialog-stub')
        expect(dialog.attributes('data-visible')).toBe('true')
        expect(dialog.attributes('data-user')).toBe('u-1')
    })

    it('点击封禁按钮打开封禁浮层；对已封禁用户则直接解封', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[1]!.trigger('click')
        await nextTick()
        expect(wrapper.find('.ban-dialog-stub').attributes('data-visible')).toBe('true')

        await wrapper.findAll('.stub-row')[1]!.findAll('[data-key="actions"] .caomei-button')[1]!.trigger('click')
        await nextTick()
        expect(authClientMock.admin.unbanUser).toHaveBeenCalledWith({ userId: 'u-2' })
        expect(refreshMock).toHaveBeenCalled()
    })

    it('点击会话按钮打开会话抽屉', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[2]!.trigger('click')
        await nextTick()

        const drawer = wrapper.find('.sessions-drawer-stub')
        expect(drawer.attributes('data-visible')).toBe('true')
        expect(drawer.attributes('data-user')).toBe('u-1')
    })

    it('点击模拟登录按钮走 PrimeVue useConfirm（浮层豁免，本批未迁移）', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[3]!.trigger('click')
        await nextTick()

        expect(confirmRequireMock).toHaveBeenCalledTimes(1)
        expect(confirmRequireMock.mock.calls[0]![0]).toMatchObject({
            message: 'pages.admin.users.confirm_impersonate',
            header: 'common.confirmation',
        })
    })

    it('点击删除按钮打开删除确认浮层并带上用户名', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[4]!.trigger('click')
        await nextTick()

        const dialog = wrapper.find('.confirm-delete-dialog')
        expect(dialog.attributes('data-visible')).toBe('true')
        expect(dialog.attributes('data-message')).toBe('pages.admin.users.confirm_delete')
    })

    it('懒加载服务端分页：向 useAdminList 声明 pageIndexBase: 1 与初始排序', async () => {
        await mountComponent()
        expect(useAdminListCalls).toHaveLength(1)
        expect(useAdminListCalls[0]!.pageIndexBase).toBe(1)
        expect(useAdminListCalls[0]!.initialSort).toEqual({ field: 'createdAt', order: 'desc' })
    })

    it('懒加载服务端分页：把 1 基当前页作为受控值回传给 caomei DataTable，且不绑定受控排序 prop', async () => {
        const wrapper = await mountComponent(sampleRows, { page: 3, limit: 10, total: 30 })

        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('lazy')).toBe(true)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('page')).toBe(3)
        expect(table.props('rows')).toBe(10)
        expect(table.props('totalRecords')).toBe(30)
        expect(table.props('rowKey')).toBe('id')
        // 迁移前同样未绑定受控排序 prop（`initialSort` 只作用于请求参数），此处保持同一形态
        expect(table.props('sortField')).toBeUndefined()
        expect(table.props('sortOrder')).toBeUndefined()
    })

    it('表格抛出的 1 基 @page 与 caomei 字符串排序载荷均被原样转发', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.stub-next-page').trigger('click')
        await nextTick()
        expect(onPageMock).toHaveBeenCalledTimes(1)
        expect(onPageMock.mock.calls[0]![0]).toMatchObject({ page: 2, rows: 10 })

        await wrapper.find('.stub-sort-asc').trigger('click')
        await nextTick()
        // caomei `@sort` 载荷为字符串（`'asc' | 'desc' | ''`）；归一由共享 composable 承担
        expect(onSortMock).toHaveBeenCalledWith({ sortField: 'name', sortOrder: 'asc' })

        await wrapper.find('.stub-sort-desc').trigger('click')
        await nextTick()
        expect(onSortMock).toHaveBeenLastCalledWith({ sortField: 'createdAt', sortOrder: 'desc' })
    })

    it('筛选组件变更事件转发到 onFilterChange', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.user-filters-stub').trigger('click')
        await nextTick()

        expect(onFilterChangeMock).toHaveBeenCalled()
    })

    it('删除确认后调用 removeUser 并刷新列表', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.stub-row')[0]!.findAll('[data-key="actions"] .caomei-button')[4]!.trigger('click')
        await nextTick()
        await wrapper.find('.confirm-delete-dialog').trigger('click')
        await nextTick()

        expect(authClientMock.admin.removeUser).toHaveBeenCalledWith({ userId: 'u-1' })
        expect(refreshMock).toHaveBeenCalled()
    })
})
