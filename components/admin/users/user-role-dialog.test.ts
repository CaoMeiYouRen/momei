import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UserRoleDialog from './user-role-dialog.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/users` 路由自有角色弹窗的迁移后契约。
 *
 * `Dialog` 属浮层显式豁免（方案 §5.5）保持 PrimeVue；在册族部分为 `Select` → `CaomeiSelect`、
 * `Button` ×2 → `CaomeiButton`（`severity="secondary" text` → `variant="ghost" tone="neutral"`，
 * 可见文案落默认插槽；保存按钮 `:label` + `:loading` → 默认插槽 + `:loading`）。
 */

const { authClientMock, feedbackMocks } = vi.hoisted(() => ({
    authClientMock: { admin: { setRole: vi.fn() } },
    feedbackMocks: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({ authClient: authClientMock }))
vi.mock('@/composables/use-request-feedback', () => ({ useRequestFeedback: () => feedbackMocks }))

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: { modelValue: { type: String, default: '' }, options: { type: Array, default: () => [] }, optionLabel: String, optionValue: String },
    emits: ['update:modelValue'],
    setup: (props) => () => h('span', {
        class: 'caomei-select',
        'data-model': props.modelValue,
        'data-option-count': String((props.options as unknown[]).length),
    }),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { variant: { type: String, default: '' }, tone: { type: String, default: '' }, loading: Boolean },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            class: 'caomei-button',
            'data-variant': props.variant,
            'data-tone': props.tone,
            'data-loading': String(props.loading),
            onClick: () => emit('click'),
        }, slots.default?.())
    },
})

const stubs = {
    Dialog: defineComponent({
        name: 'Dialog',
        props: { visible: Boolean, header: String },
        setup: (props, { slots }) => () => h('div', { class: 'dialog-stub', 'data-header': props.header }, [slots.default?.(), slots.footer?.()]),
    }),
    CaomeiSelect: CaomeiSelectStub,
    CaomeiButton: CaomeiButtonStub,
}

async function mountComponent(user: Record<string, unknown> | null = { id: 'u-1', name: 'Ada', role: 'author' }) {
    // 真实流转为「关闭 → 打开」：组件内 `watch(() => props.visible)` 只在变化时回填角色，
    // 故此处以 `visible: false` 挂载后再置为 `true`，避免掩盖该既有行为。
    const wrapper = await mountSuspended(UserRoleDialog, {
        props: { visible: false, user: user as never },
        global: { stubs, mocks: { $t: (key: string) => key } },
    })
    await wrapper.setProps({ visible: true })
    await nextTick()

    return wrapper
}

describe('UserRoleDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authClientMock.admin.setRole.mockResolvedValue({ error: null })
    })

    it('保持 PrimeVue Dialog（浮层豁免）并在页脚渲染两个 CaomeiButton', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.dialog-stub').attributes('data-header')).toBe('pages.admin.users.edit_role')
        const buttons = wrapper.findAll('.caomei-button')
        expect(buttons).toHaveLength(2)
        // 取消：迁移前 `severity="secondary" text` → `variant="ghost"` + `tone="neutral"`
        expect(buttons[0]!.attributes('data-variant')).toBe('ghost')
        expect(buttons[0]!.attributes('data-tone')).toBe('neutral')
        expect(buttons[0]!.text()).toBe('common.cancel')
        // 保存：迁移前默认 severity → 默认 tone，可见文案落默认插槽
        expect(buttons[1]!.attributes('data-variant')).toBe('')
        expect(buttons[1]!.text()).toBe('common.save')
    })

    it('选择器迁移为 CaomeiSelect 且回填当前用户角色', async () => {
        const wrapper = await mountComponent({ id: 'u-1', name: 'Ada', role: 'author' })

        const select = wrapper.find('.caomei-select')
        expect(select.attributes('data-model')).toBe('author')
        expect(select.attributes('data-option-count')).toBe('3')
    })

    it('保存调用 setRole 并抛出 success + 关闭浮层', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.caomei-button')[1]!.trigger('click')
        await nextTick()

        expect(authClientMock.admin.setRole).toHaveBeenCalledWith({ userId: 'u-1', role: 'author' })
        expect(feedbackMocks.showSuccessToast).toHaveBeenCalledWith('pages.admin.users.feedback.update_role_success')
        expect(wrapper.emitted().success).toBeTruthy()
        expect(wrapper.emitted()['update:visible']!.at(-1)).toEqual([false])
    })

    it('保存失败抛出错误提示且不关闭浮层', async () => {
        authClientMock.admin.setRole.mockResolvedValue({ error: { message: 'boom' } })
        const wrapper = await mountComponent()

        await wrapper.findAll('.caomei-button')[1]!.trigger('click')
        await nextTick()

        expect(feedbackMocks.showErrorToast).toHaveBeenCalled()
        expect(wrapper.emitted().success).toBeFalsy()
    })
})
