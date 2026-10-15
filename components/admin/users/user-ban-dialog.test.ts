import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import UserBanDialog from './user-ban-dialog.vue'

/**
 * 单元层（迁移方案 §8.2 ①）：`/admin/users` 路由自有封禁弹窗的迁移后契约。
 *
 * `Dialog` 属浮层显式豁免（方案 §5.5）保持 PrimeVue；在册族部分为 `InputText` → `CaomeiInput`、
 * `Select` → `CaomeiSelect`、`Button` ×2 → `CaomeiButton`（取消 ghost+neutral / 封禁 danger）。
 */

const { authClientMock, feedbackMocks } = vi.hoisted(() => ({
    authClientMock: { admin: { banUser: vi.fn() } },
    feedbackMocks: { showErrorToast: vi.fn(), showSuccessToast: vi.fn() },
}))

vi.mock('@/lib/auth-client', () => ({ authClient: authClientMock }))
vi.mock('@/composables/use-request-feedback', () => ({ useRequestFeedback: () => feedbackMocks }))

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key, locale: ref('zh-CN') }))

const CaomeiInputStub = defineComponent({
    name: 'CaomeiInput',
    props: { modelValue: { type: String, default: '' }, placeholder: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'caomei-input',
            value: props.modelValue,
            placeholder: props.placeholder,
            onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
    },
})

const CaomeiSelectStub = defineComponent({
    name: 'CaomeiSelect',
    props: { modelValue: { type: [Number, String], default: undefined }, options: { type: Array, default: () => [] } },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('span', {
            class: 'caomei-select',
            'data-model': props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue),
            'data-options': (props.options as { value: unknown }[]).map((option) => String(option.value)).join(','),
            onClick: () => emit('update:modelValue', 60 * 60 * 24),
        })
    },
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
    CaomeiInput: CaomeiInputStub,
    CaomeiSelect: CaomeiSelectStub,
    CaomeiButton: CaomeiButtonStub,
}

async function mountComponent() {
    const wrapper = await mountSuspended(UserBanDialog, {
        props: { visible: true, user: { id: 'u-1', name: 'Ada' } as never },
        global: { stubs, mocks: { $t: (key: string) => key } },
    })
    await nextTick()

    return wrapper
}

describe('UserBanDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authClientMock.admin.banUser.mockResolvedValue({ error: null })
    })

    it('保持 PrimeVue Dialog 并迁移正文为 CaomeiInput + CaomeiSelect', async () => {
        const wrapper = await mountComponent()

        expect(wrapper.find('.dialog-stub').attributes('data-header')).toBe('pages.admin.users.ban_user')
        expect(wrapper.find('.caomei-input').attributes('placeholder')).toBe('pages.admin.users.ban_reason_placeholder')
        // 过期时间选项：「永不过期」以哨兵值承载（caomei 不渲染 `null` 值选项，上游 §1.2）+ 3 个时长
        expect(wrapper.find('.caomei-select').attributes('data-options')).toBe('__never__,86400,604800,2592000')
        // 模型为 null 时选择器显示哨兵项
        expect(wrapper.find('.caomei-select').attributes('data-model')).toBe('__never__')
    })

    it('页脚按钮：取消为 ghost+neutral，封禁为 danger', async () => {
        const wrapper = await mountComponent()

        const buttons = wrapper.findAll('.caomei-button')
        expect(buttons).toHaveLength(2)
        expect(buttons[0]!.attributes('data-variant')).toBe('ghost')
        expect(buttons[0]!.attributes('data-tone')).toBe('neutral')
        expect(buttons[0]!.text()).toBe('common.cancel')
        expect(buttons[1]!.attributes('data-tone')).toBe('danger')
        expect(buttons[1]!.text()).toBe('pages.admin.users.ban')
    })

    it('未选择过期时间时 banExpiresIn 为 undefined', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.caomei-input').setValue('spam')
        await nextTick()
        await wrapper.findAll('.caomei-button')[1]!.trigger('click')
        await nextTick()

        expect(authClientMock.admin.banUser).toHaveBeenCalledWith({
            userId: 'u-1',
            banReason: 'spam',
            banExpiresIn: undefined,
        })
        expect(wrapper.emitted().success).toBeTruthy()
        expect(wrapper.emitted()['update:visible']!.at(-1)).toEqual([false])
    })

    it('选择过期时间后随请求带上秒数', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.caomei-select').trigger('click')
        await nextTick()
        await wrapper.findAll('.caomei-button')[1]!.trigger('click')
        await nextTick()

        expect(authClientMock.admin.banUser).toHaveBeenCalledWith({
            userId: 'u-1',
            banReason: '',
            banExpiresIn: 60 * 60 * 24,
        })
    })
})
