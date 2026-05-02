import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ForgotPasswordPage from './forgot-password.vue'

const emailOtpMock = vi.fn()
const navigateToMock = vi.fn()
const resetCaptchaMock = vi.fn()
const useHeadMock = vi.fn()

const translate = (key: string) => {
    switch (key) {
        case 'pages.forgot_password.title':
            return 'Forgot Password'
        case 'pages.forgot_password.subtitle':
            return 'We will send you a reset link.'
        case 'pages.forgot_password.submit':
            return 'Send reset email'
        case 'pages.forgot_password.back_to_login':
            return 'Back to login'
        case 'pages.forgot_password.success_message':
            return 'Reset instructions sent.'
        case 'pages.login.email_placeholder':
            return 'Enter your email'
        case 'common.email':
            return 'Email'
        case 'common.error_occurred':
            return 'Something went wrong'
        default:
            return key
    }
}

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        forgetPassword: {
            emailOtp: (...args: Parameters<typeof emailOtpMock>) => emailOtpMock(...args),
        },
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: translate,
}))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useHead', () => (...args: Parameters<typeof useHeadMock>) => useHeadMock(...args))
mockNuxtImport('navigateTo', () => (...args: Parameters<typeof navigateToMock>) => navigateToMock(...args))

const AppCaptchaStub = defineComponent({
    name: 'AppCaptchaStub',
    props: {
        modelValue: {
            type: String,
            default: '',
        },
    },
    emits: ['update:modelValue'],
    methods: {
        reset: resetCaptchaMock,
    },
    template: '<input class="captcha-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
})

const stubs = {
    Button: {
        template: '<button :type="type" :data-loading="String(loading)" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['label', 'loading', 'type', 'class'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :id="id" :value="modelValue" :type="type" :placeholder="placeholder" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'type', 'invalid', 'id', 'placeholder', 'fluid'],
        emits: ['update:modelValue'],
    },
    'app-captcha': AppCaptchaStub,
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
}

async function mountPage() {
    return mountSuspended(ForgotPasswordPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        emailOtpMock.mockResolvedValue({ error: null })
    })

    it('装配真实找回密码文案而不是显示 raw key', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(wrapper.find('.forgot-password-page').exists()).toBe(true)
        expect(text).toContain('Forgot Password')
        expect(text).toContain('We will send you a reset link.')
        expect(text).toContain('Send reset email')
        expect(text).toContain('Back to login')
        expect(text).not.toContain('pages.forgot_password.title')
        expect(text).not.toContain('pages.forgot_password.submit')
        expect(useHeadMock).toHaveBeenCalled()
    })

    it('does not submit when email is empty', async () => {
        const wrapper = await mountPage()

        await wrapper.find('form').trigger('submit.prevent')

        expect(emailOtpMock).not.toHaveBeenCalled()
        expect(wrapper.find('.error-message').exists()).toBe(false)
        expect(wrapper.find('.success-message').exists()).toBe(false)
    })

    it('submits successfully and redirects to the localized reset page', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('user@example.com')
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(emailOtpMock).toHaveBeenCalledWith({
            email: 'user@example.com',
            fetchOptions: {
                headers: {
                    'x-captcha-response': 'captcha-token',
                },
            },
        })
        expect(wrapper.find('.success-message').exists()).toBe(true)
        expect(wrapper.text()).toContain('Reset instructions sent.')
        expect(navigateToMock).toHaveBeenCalledWith('/reset-password?email=user%40example.com')
    })

    it('shows backend validation errors and resets captcha when the request is rejected logically', async () => {
        emailOtpMock.mockResolvedValueOnce({
            error: {
                message: 'Too many attempts',
            },
        })
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('user@example.com')
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(wrapper.find('.error-message').text()).toContain('Too many attempts')
        expect(resetCaptchaMock).toHaveBeenCalledTimes(1)
        expect(navigateToMock).not.toHaveBeenCalled()
        expect(wrapper.find('button').attributes('data-loading')).toBe('false')
    })

    it('falls back to the shared error copy when the request throws without a message', async () => {
        emailOtpMock.mockRejectedValueOnce({})
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('user@example.com')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(wrapper.find('.error-message').text()).toMatch(/Something went wrong|发生错误/u)
        expect(wrapper.find('.success-message').exists()).toBe(false)
        expect(navigateToMock).not.toHaveBeenCalled()
    })
})
