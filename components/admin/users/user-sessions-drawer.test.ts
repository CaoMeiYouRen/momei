import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UserSessionsDrawer from './user-sessions-drawer.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/users` 路由自有会话抽屉的迁移后契约。
 *
 * `Drawer` 属浮层显式豁免（方案 §5.5）保持 PrimeVue；在册族部分为 `Badge` → `CaomeiBadge`
 * （`severity="info"` → `tone="primary"`）、`Button` ×2 → `CaomeiButton`（icon-only 下线按钮
 * 补可访问名；一键下线为 danger + 可见文案落默认插槽）。`ProgressSpinner` 与 `useConfirm` 不在在册族。
 */

const { authClientMock, feedbackMocks, confirmRequireMock } = vi.hoisted(() => ({
    authClientMock: {
        admin: {
            listUserSessions: vi.fn(),
            revokeUserSession: vi.fn(),
            revokeUserSessions: vi.fn(),
        },
    },
    feedbackMocks: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
    confirmRequireMock: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({ authClient: authClientMock }))
vi.mock('@/composables/use-request-feedback', () => ({ useRequestFeedback: () => feedbackMocks }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => ({ require: confirmRequireMock }) }))
vi.mock('@/composables/use-i18n-date', () => ({ useI18nDate: () => ({ d: (value: string) => `d:${value}` }) }))

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))

const CaomeiBadgeStub = defineComponent({
    name: 'CaomeiBadge',
    props: { value: { type: String, default: '' }, tone: { type: String, default: '' } },
    setup: (props) => () => h('span', { class: 'caomei-badge', 'data-tone': props.tone }, props.value),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        iconOnly: Boolean,
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        rounded: Boolean,
        size: { type: String, default: '' },
        loading: Boolean,
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-label': props.label,
            'data-icon-only': String(props.iconOnly),
            'data-variant': props.variant,
            'data-tone': props.tone,
            'data-rounded': String(props.rounded),
            'data-size': props.size,
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, [slots.icon?.(), slots.default?.()])
    },
})

const stubs = {
    Drawer: defineComponent({
        name: 'Drawer',
        props: { visible: Boolean, position: String },
        setup: (props, { slots }) => () => h('div', { class: 'drawer-stub', 'data-position': props.position }, [slots.header?.(), slots.default?.()]),
    }),
    ProgressSpinner: defineComponent({ name: 'ProgressSpinner', setup: () => () => h('div', { class: 'progress-spinner-stub' }) }),
    CaomeiBadge: CaomeiBadgeStub,
    CaomeiButton: CaomeiButtonStub,
}

const sessionFixture = [
    { token: 'tok-1', userAgent: 'Mozilla/5.0 (iPhone)', ipAddress: '1.2.3.4', updatedAt: '2026-02-01', expiresAt: '2026-03-01' },
    { token: 'tok-2', userAgent: 'Mozilla/5.0 (Windows NT)', ipAddress: '5.6.7.8', updatedAt: '2026-02-02', expiresAt: '2026-03-02' },
]

async function mountComponent() {
    // 真实流转为「关闭 → 打开」：组件内 `watch(() => props.visible)` 只在变化时拉取会话。
    const wrapper = await mountSuspended(UserSessionsDrawer, {
        props: { visible: false, user: { id: 'u-1', name: 'Ada' } as never },
        global: { stubs, mocks: { $t: (key: string) => key } },
    })
    await wrapper.setProps({ visible: true })
    await nextTick()
    await nextTick()

    return wrapper
}

describe('UserSessionsDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authClientMock.admin.listUserSessions.mockResolvedValue({ data: { sessions: sessionFixture }, error: null })
        authClientMock.admin.revokeUserSession.mockResolvedValue({ error: null })
        authClientMock.admin.revokeUserSessions.mockResolvedValue({ error: null })
    })

    it('保持 PrimeVue Drawer 并迁移标题 Badge 为 CaomeiBadge（info → primary）', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.drawer-stub').attributes('data-position')).toBe('right')
        const badge = wrapper.find('.caomei-badge')
        expect(badge.exists()).toBe(true)
        expect(badge.attributes('data-tone')).toBe('primary')
        expect(badge.text()).toBe('Ada')
    })

    it('打开时拉取会话并按设备渲染卡片与下线按钮', async () => {
        const wrapper = await mountComponent()

        expect(authClientMock.admin.listUserSessions).toHaveBeenCalledWith({ userId: 'u-1' })
        expect(wrapper.findAll('.session-card')).toHaveLength(2)
        expect(wrapper.text()).toContain('iPhone')
        expect(wrapper.text()).toContain('Windows')

        // 每张卡片一个 icon-only 下线按钮（迁移前 `severity="danger" size="small" rounded text`）
        const revokeButtons = wrapper.findAll('.session-card .caomei-button')
        expect(revokeButtons).toHaveLength(2)
        expect(revokeButtons[0]!.attributes('data-tone')).toBe('danger')
        expect(revokeButtons[0]!.attributes('data-size')).toBe('sm')
        expect(revokeButtons[0]!.attributes('data-icon-only')).toBe('true')
        // icon-only 按钮必须补可访问名（迁移前无 label）
        expect(revokeButtons[0]!.attributes('data-label')).toBe('pages.admin.users.revoke_session')
    })

    it('单会话下线调用 revokeUserSession 并重新拉取', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.session-card .caomei-button')[0]!.trigger('click')
        await nextTick()

        expect(authClientMock.admin.revokeUserSession).toHaveBeenCalledWith({ sessionToken: 'tok-1' })
        expect(authClientMock.admin.listUserSessions).toHaveBeenCalledTimes(2)
    })

    it('一键下线为 danger + 可见文案落默认插槽，并经 PrimeVue useConfirm 确认', async () => {
        const wrapper = await mountComponent()

        const revokeAll = wrapper.findAll('.caomei-button').at(-1)!
        expect(revokeAll.attributes('data-tone')).toBe('danger')
        expect(revokeAll.attributes('data-label')).toBe('')
        expect(revokeAll.text()).toBe('pages.admin.users.revoke_all')

        await revokeAll.trigger('click')
        await nextTick()
        expect(confirmRequireMock).toHaveBeenCalledTimes(1)

        // 执行确认回调
        const accept = confirmRequireMock.mock.calls[0]![0].accept as () => Promise<void>
        await accept()
        expect(authClientMock.admin.revokeUserSessions).toHaveBeenCalledWith({ userId: 'u-1' })
        expect(wrapper.emitted()['update:visible']!.at(-1)).toEqual([false])
    })

    it('无活跃会话时渲染空态且不显示一键下线按钮', async () => {
        authClientMock.admin.listUserSessions.mockResolvedValue({ data: { sessions: [] }, error: null })
        const wrapper = await mountComponent()

        expect(wrapper.find('.sessions-empty').text()).toBe('pages.admin.users.no_active_sessions')
        expect(wrapper.findAll('.caomei-button')).toHaveLength(0)
    })
})
