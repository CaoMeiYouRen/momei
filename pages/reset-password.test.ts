import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ResetPasswordPage from './reset-password.vue'

const resetPasswordMock = vi.fn()
const routerPushMock = vi.fn()
const useHeadMock = vi.fn()
const routeQuery = reactive<{ email?: string, token?: string }>({
    email: 'prefilled@example.com',
    token: 'test-token',
})

const translate = (key: string) => {
    switch (key) {
        case 'pages.reset_password.title':
            return 'Reset Password'
        case 'pages.reset_password.subtitle':
            return 'Enter the code and choose a new password.'
        case 'pages.reset_password.otp_placeholder':
            return 'Enter OTP code'
        case 'pages.reset_password.new_password':
            return 'New password'
        case 'pages.reset_password.new_password_placeholder':
            return 'Create a new password'
        case 'pages.reset_password.confirm_password':
            return 'Confirm password'
        case 'pages.reset_password.confirm_password_placeholder':
            return 'Repeat the new password'
        case 'pages.reset_password.submit':
            return 'Reset password'
        case 'pages.register.password_mismatch':
            return 'Passwords do not match'
        case 'common.email':
            return 'Email'
        case 'common.otp':
            return 'OTP'
        case 'common.error_occurred':
            return 'Something went wrong'
        default:
            return key
    }
}

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        emailOtp: {
            resetPassword: (...args: Parameters<typeof resetPasswordMock>) => resetPasswordMock(...args),
        },
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: translate,
}))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useHead', () => (...args: Parameters<typeof useHeadMock>) => useHeadMock(...args))
mockNuxtImport('useRouter', () => () => ({
    push: (...args: Parameters<typeof routerPushMock>) => routerPushMock(...args),
    replace: vi.fn(() => Promise.resolve()),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
}))
mockNuxtImport('useRoute', () => () => ({
    query: routeQuery,
}))

const stubs = {
    Button: {
        template: '<button :type="type" :data-loading="String(loading)" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['label', 'loading', 'type', 'class'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :id="id" :value="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'type', 'id', 'placeholder', 'required', 'fluid', 'disabled'],
        emits: ['update:modelValue'],
    },
    Password: {
        template: '<input :id="id" :value="modelValue" :placeholder="placeholder" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid', 'id', 'placeholder', 'required'],
        emits: ['update:modelValue'],
    },
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
}

async function mountPage() {
    return mountSuspended(ResetPasswordPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeQuery.email = 'prefilled@example.com'
        routeQuery.token = 'test-token'
        resetPasswordMock.mockResolvedValue({ error: null })
    })

    it('装配真实重置密码文案而不是显示 raw key', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(wrapper.find('.reset-password-page').exists()).toBe(true)
        expect(text).toContain('Reset Password')
        expect(text).toContain('Enter the code and choose a new password.')
        expect(text).toContain('Reset password')
        expect(text).not.toContain('pages.reset_password.title')
        expect(text).not.toContain('pages.reset_password.submit')
        expect(useHeadMock).toHaveBeenCalled()
    })

    it('prefills the email from the route query and locks the field', async () => {
        const wrapper = await mountPage()
        const emailInput = wrapper.find('#email')

        expect((emailInput.element as HTMLInputElement).value).toBe('prefilled@example.com')
        expect(emailInput.attributes('disabled')).toBeDefined()
    })

    it('blocks submission when passwords do not match', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#otp').setValue('123456')
        await wrapper.find('#password').setValue('secret-1')
        await wrapper.find('#confirmPassword').setValue('secret-2')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Passwords do not match')
        expect(wrapper.find('#confirmPassword').attributes('data-invalid')).toBe('true')
    })

    it('submits successfully and redirects to login', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#otp').setValue('123456')
        await wrapper.find('#password').setValue('secret-1')
        await wrapper.find('#confirmPassword').setValue('secret-1')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(resetPasswordMock).toHaveBeenCalledWith({
            email: 'prefilled@example.com',
            otp: '123456',
            password: 'secret-1',
        })
        expect(routerPushMock).toHaveBeenCalledWith('/login')
        expect(wrapper.find('.error-message').exists()).toBe(false)
    })

    it('shows backend and thrown errors without redirecting', async () => {
        resetPasswordMock.mockResolvedValueOnce({
            error: {
                message: 'OTP expired',
            },
        })
        const wrapper = await mountPage()

        await wrapper.find('#otp').setValue('123456')
        await wrapper.find('#password').setValue('secret-1')
        await wrapper.find('#confirmPassword').setValue('secret-1')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(wrapper.find('.error-message').text()).toContain('OTP expired')
        expect(routerPushMock).not.toHaveBeenCalled()

        resetPasswordMock.mockRejectedValueOnce({})
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(wrapper.find('.error-message').text()).toMatch(/Something went wrong|发生错误/u)
        expect(routerPushMock).not.toHaveBeenCalled()
    })
})
