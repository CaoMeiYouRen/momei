import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AdminFriendLinks from './index.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/friend-links` 路由迁移后的结构与逻辑契约。
 *
 * 覆盖：页头两个动作按钮、三个表格的列定义与 `#cell-{key}` 插槽接线、`Tag` 语义色映射
 * （`severity` → `tone`）、动作集合的形态与可访问名、`AppUploader` → `AppUploaderV2`
 * 的消费处替换、浮层内表单控件的迁移（`InputText` → `CaomeiInput`、`Select` → `CaomeiSelect`）。
 * 真实渲染（DOM / 计算样式 / 空态文案）由 E2E 与截图识别层承担。
 */

const LINK_STATUS_TONES: Record<string, string> = { active: 'success', draft: 'primary' }
const HEALTH_STATUS_TONES: Record<string, string> = { healthy: 'success', unreachable: 'danger', checking: 'warning' }
const APPLICATION_STATUS_TONES: Record<string, string> = { approved: 'success', rejected: 'danger', archived: 'neutral' }

const { composableState, loadLinksMock } = vi.hoisted(() => ({
    composableState: {
        links: [] as Record<string, unknown>[],
        categories: [] as Record<string, unknown>[],
        applications: [] as Record<string, unknown>[],
        selectedApplication: null as Record<string, unknown> | null,
    },
    loadLinksMock: vi.fn(),
}))

vi.mock('@/composables/use-admin-friend-links-page', async () => {
    const vue = await import('vue')

    return {
        useAdminFriendLinksPage: () => ({
            tt: (key: string) => key,
            loading: vue.ref({ links: false, categories: false, applications: false }),
            saving: vue.ref(false),
            links: vue.ref(composableState.links),
            categories: vue.ref(composableState.categories),
            applications: vue.ref(composableState.applications),
            linkDialogVisible: vue.ref(false),
            categoryDialogVisible: vue.ref(false),
            reviewDialogVisible: vue.ref(false),
            editingLink: vue.ref(null),
            editingCategory: vue.ref(null),
            selectedApplication: vue.ref(composableState.selectedApplication),
            linkForm: vue.ref({ name: '', url: '', logo: null, rssUrl: '', contactEmail: '', categoryId: null, status: 'active', sortOrder: 0, description: '', isFeatured: false, isPinned: false, showRssFeed: false }),
            categoryForm: vue.ref({ name: '', slug: '', sortOrder: 0, description: '', isEnabled: true }),
            reviewForm: vue.ref({ reviewNote: '', linkData: { categoryId: null, sortOrder: 0, isFeatured: false, isPinned: false } }),
            linkStatusOptions: vue.ref([{ label: 'active', value: 'active' }]),
            // 与 composable 的 tone 词表一致（用查表避免嵌套三元）
            getLinkStatusTone: (status: string) => LINK_STATUS_TONES[status] ?? 'neutral',
            getHealthStatusTone: (status?: string) => HEALTH_STATUS_TONES[status ?? ''] ?? 'neutral',
            getApplicationStatusTone: (status: string) => APPLICATION_STATUS_TONES[status] ?? 'primary',
            formatDateTime: (value?: string | null) => (value ? `dt:${value}` : '-'),
            shouldSuggestReviewOrDisable: (row: Record<string, unknown>) => row.healthStatus === 'unreachable',
            loadLinks: loadLinksMock,
            openLinkDialog: vi.fn(),
            saveLink: vi.fn(),
            confirmDeleteLink: vi.fn(),
            openCategoryDialog: vi.fn(),
            saveCategory: vi.fn(),
            confirmDeleteCategory: vi.fn(),
            openReviewDialog: vi.fn(),
            submitReview: vi.fn(),
            confirmReviewOrDisable: vi.fn(),
        }),
    }
})

vi.mock('@/composables/use-upload', () => ({ UploadType: { IMAGE: 'image' } }))

vi.mock('@/types/friend-link', () => ({
    FriendLinkStatus: { ACTIVE: 'active', DRAFT: 'draft', DISABLED: 'disabled' },
    FriendLinkHealthStatus: { CHECKING: 'checking', HEALTHY: 'healthy', UNKNOWN: 'unknown', UNREACHABLE: 'unreachable' },
    FriendLinkApplicationStatus: { APPROVED: 'approved', ARCHIVED: 'archived', PENDING: 'pending', REJECTED: 'rejected' },
}))

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))

const sampleLinks: Record<string, unknown>[] = [
    { id: 'l-1', name: 'Ada Blog', url: 'https://ada.example.com', category: { name: 'Tech' }, status: 'active', healthStatus: 'healthy', isFeatured: true, isPinned: false, sortOrder: 1, lastCheckedAt: '2026-03-01T00:00:00.000Z' },
    { id: 'l-2', name: 'Bob Blog', url: 'https://bob.example.com', category: null, status: 'draft', healthStatus: 'unreachable', isFeatured: false, isPinned: true, sortOrder: 2, lastCheckedAt: null },
]

const sampleCategories: Record<string, unknown>[] = [
    { id: 'c-1', name: 'Tech', slug: 'tech', sortOrder: 1, isEnabled: true },
    { id: 'c-2', name: 'Life', slug: 'life', sortOrder: 2, isEnabled: false },
]

const sampleApplications: Record<string, unknown>[] = [
    { id: 'a-1', name: 'Cara Blog', contactEmail: 'cara@example.com', submittedIp: '1.2.3.4', createdAt: '2026-03-02T00:00:00.000Z', status: 'pending' },
]

const CaomeiDataTableStub = defineComponent({
    name: 'CaomeiDataTable',
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
    },
    setup(props, { slots }) {
        return () => {
            const columns = props.columns as { key: string, header?: string }[]
            const rows = props.data as Record<string, unknown>[]
            const defaultCell = (value: unknown) => {
                if (value === null || value === undefined) {
                    return ''
                }

                return typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
            }

            return h('div', { class: 'caomei-data-table', 'data-keys': columns.map((column) => column.key).join(',') }, [
                ...rows.map((row, index) => h('div', { class: 'stub-row' }, columns.map((column) => {
                    const cellSlot = slots[`cell-${column.key}`]
                    const content = cellSlot ? cellSlot({ row, value: row[column.key], index, column }) : defaultCell(row[column.key])
                    return h('span', { class: 'stub-td', 'data-key': column.key }, content)
                }))),
                rows.length === 0 ? h('div', { class: 'stub-empty' }, slots.empty?.()) : null,
            ])
        }
    },
})

/**
 * caomei `Tag` **没有 `value` prop**（只有 `tone` / `variant` / `size` / `rounded` / …），
 * 可见文案只来自默认插槽。故本桩**不声明 `value`**，并渲染 `slots.default`——
 * 与库契约一致，避免「桩自造 prop」掩盖真实回归（`Button` 的可见文案陷阱同型，见迁移方案 §6.2）。
 */
const CaomeiTagStub = defineComponent({
    name: 'CaomeiTag',
    props: { tone: { type: String, default: '' } },
    setup: (props, { slots }) => () => h('span', { class: 'caomei-tag', 'data-tone': props.tone }, slots.default?.()),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: { type: Boolean, default: false },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        rounded: { type: Boolean, default: false },
        size: { type: String, default: '' },
        loading: { type: Boolean, default: false },
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
            'data-size': props.size,
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const stubs = {
    AdminPageHeader: defineComponent({
        name: 'AdminPageHeader',
        props: { title: String },
        setup: (props, { slots }) => () => h('div', { class: 'admin-page-header', 'data-title': props.title }, [slots.actions?.()]),
    }),
    Dialog: defineComponent({
        name: 'Dialog',
        props: { visible: Boolean, header: String },
        setup: (props, { slots }) => () => h('div', { class: 'dialog-stub', 'data-header': props.header }, [slots.default?.(), slots.footer?.()]),
    }),
    ConfirmDialog: defineComponent({ name: 'ConfirmDialog', setup: () => () => h('div', { class: 'confirm-dialog-stub' }) }),
    Toast: defineComponent({ name: 'Toast', setup: () => () => h('div', { class: 'toast-stub' }) }),
    InputNumber: defineComponent({ name: 'InputNumber', setup: () => () => h('div', { class: 'input-number-stub' }) }),
    Textarea: defineComponent({ name: 'Textarea', setup: () => () => h('div', { class: 'textarea-stub' }) }),
    Checkbox: defineComponent({ name: 'Checkbox', setup: () => () => h('div', { class: 'checkbox-stub' }) }),
    AppUploaderV2: defineComponent({
        name: 'AppUploaderV2',
        inheritAttrs: false,
        props: { modelValue: { type: String, default: null }, type: { type: String, default: '' }, placeholder: { type: String, default: '' }, accept: { type: String, default: '' } },
        setup: (props, { attrs }) => () => h('div', {
            class: 'app-uploader-v2',
            'data-type': props.type,
            'data-accept': props.accept,
            'data-id': (attrs.id as string) ?? '',
        }),
    }),
    CaomeiInput: defineComponent({
        name: 'CaomeiInput',
        props: { modelValue: { type: String, default: '' } },
        setup: (props) => () => h('input', { class: 'caomei-input', value: props.modelValue }),
    }),
    CaomeiSelect: defineComponent({
        name: 'CaomeiSelect',
        props: { modelValue: { type: [String, Number], default: undefined }, options: { type: Array, default: () => [] } },
        setup: (props) => () => h('span', { class: 'caomei-select', 'data-option-count': String((props.options as unknown[]).length) }),
    }),
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiTag: CaomeiTagStub,
    CaomeiButton: CaomeiButtonStub,
}

async function mountComponent() {
    const wrapper = await mountSuspended(AdminFriendLinks, {
        global: { stubs, mocks: { $t: (key: string) => key } },
    })
    await nextTick()

    return wrapper
}

describe('AdminFriendLinks page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        composableState.links = sampleLinks.map((row) => ({ ...row }))
        composableState.categories = sampleCategories.map((row) => ({ ...row }))
        composableState.applications = sampleApplications.map((row) => ({ ...row }))
        composableState.selectedApplication = null
    })

    it('渲染页头与两个动作按钮（次要与主色，可见文案落默认插槽）', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.find('.admin-page-header').attributes('data-title')).toBe('pages.admin.friend_links.title')

        const buttons = wrapper.find('.admin-friend-links__header-actions').findAll('.caomei-button')
        expect(buttons).toHaveLength(2)
        expect(buttons[0]!.attributes('data-variant')).toBe('secondary')
        expect(buttons[0]!.text()).toBe('pages.admin.friend_links.create_category')
        expect(buttons[1]!.attributes('data-variant')).toBe('')
        expect(buttons[1]!.text()).toBe('pages.admin.friend_links.create_link')
        expect(buttons.every((button) => button.attributes('data-icon-only') === 'false')).toBe(true)
    })

    it('渲染三个 caomei 数据表与两个豁免浮层', async () => {
        const wrapper = await mountComponent()
        expect(wrapper.findAll('.caomei-data-table')).toHaveLength(3)
        expect(wrapper.find('.confirm-dialog-stub').exists()).toBe(true)
        expect(wrapper.find('.toast-stub').exists()).toBe(true)
        expect(wrapper.findAll('.dialog-stub')).toHaveLength(3)
    })

    it('友链表声明 10 列（含分类 / 推荐 / 置顶 / 动作等无 field 列的插槽语义 key）', async () => {
        const wrapper = await mountComponent()
        const tables = wrapper.findAll('.caomei-data-table')
        expect(tables[0]!.attributes('data-keys')).toBe('name,url,category,status,healthStatus,isFeatured,isPinned,sortOrder,lastCheckedAt,actions')
        expect(tables[1]!.attributes('data-keys')).toBe('name,slug,sortOrder,isEnabled,actions')
        expect(tables[2]!.attributes('data-keys')).toBe('name,contactEmail,submittedIp,createdAt,status,actions')
    })

    it('友链表单元格：外链 / 分类回退 / 时间格式化走默认取值与插槽', async () => {
        const wrapper = await mountComponent()
        const rows = wrapper.findAll('.caomei-data-table')[0]!.findAll('.stub-row')

        const link = rows[0]!.find('[data-key="url"] a')
        expect(link.attributes('href')).toBe('https://ada.example.com')
        expect(link.attributes('rel')).toBe('noopener noreferrer')
        expect(rows[0]!.find('[data-key="category"]').text()).toBe('Tech')
        expect(rows[1]!.find('[data-key="category"]').text()).toBe('pages.links.uncategorized')
        expect(rows[0]!.find('[data-key="lastCheckedAt"]').text()).toBe('dt:2026-03-01T00:00:00.000Z')
        // 无 `field` 的 `sortOrder` 列走默认取值
        expect(rows[0]!.find('[data-key="sortOrder"]').text()).toBe('1')
    })

    it('Tag 语义色：链接状态 / 健康状态 / 推荐 / 置顶均按 caomei tone 输出', async () => {
        const wrapper = await mountComponent()
        const rows = wrapper.findAll('.caomei-data-table')[0]!.findAll('.stub-row')

        // tone 与**可见文案**（caomei `Tag` 无 `value` prop，文案只来自默认插槽）
        const statusTag1 = rows[0]!.find('[data-key="status"] .caomei-tag')
        expect(statusTag1.attributes('data-tone')).toBe('success')
        expect(statusTag1.text()).toBe('pages.admin.friend_links.statuses.active')

        const statusTag2 = rows[1]!.find('[data-key="status"] .caomei-tag')
        expect(statusTag2.attributes('data-tone')).toBe('primary')
        expect(statusTag2.text()).toBe('pages.admin.friend_links.statuses.draft')

        const healthTag = rows[1]!.find('[data-key="healthStatus"] .caomei-tag')
        expect(healthTag.attributes('data-tone')).toBe('danger')
        expect(healthTag.text()).toBe('pages.admin.friend_links.health_statuses.unreachable')

        expect(rows[0]!.find('[data-key="isFeatured"] .caomei-tag').text()).toBe('common.yes')
        expect(rows[1]!.find('[data-key="isFeatured"] .caomei-tag').text()).toBe('common.no')
        expect(rows[0]!.find('[data-key="isFeatured"] .caomei-tag').attributes('data-tone')).toBe('success')
        expect(rows[1]!.find('[data-key="isPinned"] .caomei-tag').attributes('data-tone')).toBe('primary')
    })

    it('分类表 Tag 随 isEnabled 翻转 tone，申请表的 tone 与时间列按插槽渲染', async () => {
        const wrapper = await mountComponent()
        const categoryRows = wrapper.findAll('.caomei-data-table')[1]!.findAll('.stub-row')
        const enabledTag = categoryRows[0]!.find('[data-key="isEnabled"] .caomei-tag')
        expect(enabledTag.attributes('data-tone')).toBe('success')
        expect(enabledTag.text()).toBe('pages.admin.friend_links.enabled')
        const disabledTag = categoryRows[1]!.find('[data-key="isEnabled"] .caomei-tag')
        expect(disabledTag.attributes('data-tone')).toBe('neutral')
        expect(disabledTag.text()).toBe('pages.admin.friend_links.disabled')

        const applicationRow = wrapper.findAll('.caomei-data-table')[2]!.find('.stub-row')!
        expect(applicationRow.find('[data-key="createdAt"]').text()).toBe('dt:2026-03-02T00:00:00.000Z')
        const applicationTag = applicationRow.find('[data-key="status"] .caomei-tag')
        expect(applicationTag.attributes('data-tone')).toBe('primary')
        expect(applicationTag.text()).toBe('pages.admin.friend_links.application_statuses.pending')
    })

    it('友链动作列：条件性的「建议复核」按钮 + 编辑 / 删除 icon-only 按钮', async () => {
        const wrapper = await mountComponent()
        const rows = wrapper.findAll('.caomei-data-table')[0]!.findAll('.stub-row')

        // 第 1 行健康 → 无「建议复核」按钮，仅编辑 + 删除
        const row1Buttons = rows[0]!.find('[data-key="actions"]').findAll('.caomei-button')
        expect(row1Buttons).toHaveLength(2)
        expect(row1Buttons[0]!.attributes('data-tone')).toBe('primary')
        expect(row1Buttons[0]!.attributes('data-icon-only')).toBe('true')
        expect(row1Buttons[0]!.attributes('data-label')).toBe('pages.admin.friend_links.edit_link')
        expect(row1Buttons[1]!.attributes('data-tone')).toBe('danger')

        // 第 2 行不可达 → 多出「建议复核」按钮（ghost + warning + sm，可见文案落默认插槽）
        const row2Buttons = rows[1]!.find('[data-key="actions"]').findAll('.caomei-button')
        expect(row2Buttons).toHaveLength(3)
        expect(row2Buttons[0]!.attributes('data-variant')).toBe('ghost')
        expect(row2Buttons[0]!.attributes('data-tone')).toBe('warning')
        expect(row2Buttons[0]!.attributes('data-size')).toBe('sm')
        expect(row2Buttons[0]!.attributes('data-icon-only')).toBe('false')
        expect(row2Buttons[0]!.text()).toBe('pages.admin.friend_links.suggest_review_or_disable')
    })

    it('分类表与申请表的动作列各为 2 / 1 个 icon-only 按钮且带可访问名', async () => {
        const wrapper = await mountComponent()
        const categoryRow = wrapper.findAll('.caomei-data-table')[1]!.find('.stub-row')!
        const categoryButtons = categoryRow.find('[data-key="actions"]').findAll('.caomei-button')
        expect(categoryButtons).toHaveLength(2)
        expect(categoryButtons.map((button) => button.attributes('data-label'))).toEqual([
            'pages.admin.friend_links.edit_category',
            'pages.admin.friend_links.delete_category',
        ])

        const applicationRow = wrapper.findAll('.caomei-data-table')[2]!.find('.stub-row')!
        const applicationButtons = applicationRow.find('[data-key="actions"]').findAll('.caomei-button')
        expect(applicationButtons).toHaveLength(1)
        expect(applicationButtons[0]!.attributes('data-label')).toBe('pages.admin.friend_links.review_application')
        expect(applicationButtons[0]!.attributes('data-icon-only')).toBe('true')
    })

    it('区块标题的刷新按钮为 icon-only ghost 且带可访问名', async () => {
        const wrapper = await mountComponent()
        const refresh = wrapper.find('.admin-friend-links__section-header .caomei-button')
        expect(refresh.attributes('data-icon-only')).toBe('true')
        expect(refresh.attributes('data-variant')).toBe('ghost')
        expect(refresh.attributes('data-label')).toBe('common.refresh')

        await refresh.trigger('click')
        expect(loadLinksMock).toHaveBeenCalled()
    })

    it('空列表渲染各自的空态文案（`#empty` 插槽）', async () => {
        composableState.links = []
        composableState.categories = []
        composableState.applications = []
        const wrapper = await mountComponent()

        const empties = wrapper.findAll('.stub-empty')
        expect(empties).toHaveLength(3)
        expect(empties[0]!.text()).toContain('pages.admin.friend_links.empty_links')
        expect(empties[1]!.text()).toContain('pages.admin.friend_links.empty_categories')
        expect(empties[2]!.text()).toContain('pages.admin.friend_links.empty_applications')
    })

    it('浮层保持 PrimeVue，内部表单控件迁移为 CaomeiInput / CaomeiSelect', async () => {
        // 审阅弹窗正文由 `v-if="selectedApplication"` 守卫，故先提供选中申请以覆盖其表单控件
        composableState.selectedApplication = { id: 'a-1', name: 'Cara Blog' }
        const wrapper = await mountComponent()

        // 6 个 InputText → CaomeiInput（友链表单 4：名称 / 网址 / RSS / 联系邮箱；分类表单 2：名称 / slug）
        expect(wrapper.findAll('.caomei-input')).toHaveLength(6)
        // 3 个 Select（友链分类 / 友链状态 / 审阅分类）
        expect(wrapper.findAll('.caomei-select')).toHaveLength(3)
        // 非在册族表单控件保持 PrimeVue
        expect(wrapper.findAll('.input-number-stub')).toHaveLength(3)
        expect(wrapper.findAll('.textarea-stub')).toHaveLength(3)
        // 复选框（非在册族）：友链表单 3 + 分类表单 1 + 审阅弹窗 2
        expect(wrapper.findAll('.checkbox-stub')).toHaveLength(6)
    })

    it('友链表单的 logo 字段使用共享壳过渡组件 AppUploaderV2（按路由择库）', async () => {
        const wrapper = await mountComponent()
        const uploader = wrapper.find('.app-uploader-v2')
        expect(uploader.exists()).toBe(true)
        expect(uploader.attributes('data-id')).toBe('link-logo')
        expect(uploader.attributes('data-type')).toBe('image')
        expect(uploader.attributes('data-accept')).toBe('image/*')
    })

    it('浮层页脚按钮：取消为 ghost+neutral，保存 / 拒绝 / 通过按 tone 输出且可见文案落默认插槽', async () => {
        const wrapper = await mountComponent()
        const footers = wrapper.findAll('.dialog-stub')

        const linkFooterButtons = footers[0]!.findAll('.caomei-button')
        expect(linkFooterButtons).toHaveLength(2)
        expect(linkFooterButtons[0]!.attributes('data-variant')).toBe('ghost')
        expect(linkFooterButtons[0]!.attributes('data-tone')).toBe('neutral')
        expect(linkFooterButtons[0]!.text()).toBe('common.cancel')
        expect(linkFooterButtons[1]!.text()).toBe('common.save')

        const reviewFooterButtons = footers[2]!.findAll('.caomei-button')
        expect(reviewFooterButtons).toHaveLength(3)
        expect(reviewFooterButtons[1]!.attributes('data-tone')).toBe('danger')
        expect(reviewFooterButtons[1]!.text()).toBe('pages.admin.friend_links.reject')
        expect(reviewFooterButtons[2]!.attributes('data-tone')).toBe('success')
        expect(reviewFooterButtons[2]!.text()).toBe('pages.admin.friend_links.approve')
    })
})
