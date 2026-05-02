import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const signUpEmailMock = vi.fn()
const socialSignInMock = vi.fn()
const navigateToMock = vi.fn()
const invalidateAuthSessionStateMock = vi.fn()
const refreshAuthSessionMock = vi.fn()
const toastAddMock = vi.fn()
const resetCaptchaMock = vi.fn()
const routeState = {
    query: {} as Record<string, unknown>,
    path: '/register',
    fullPath: '/register',
    name: 'register___en-US___default',
    params: {},
    matched: [],
    meta: {},
    hash: '',
    redirectedFrom: undefined,
}

const translate = (key: string) => {
    switch (key) {
        case 'pages.register.title':
            return 'Create account'
        case 'pages.register.name':
            return 'Name'
        case 'pages.register.email':
            return 'Email'
        case 'pages.register.password':
            return 'Password'
        case 'pages.register.confirm_password':
            return 'Confirm password'
        case 'pages.register.submit':
            return 'Create account'
        case 'pages.register.have_account':
            return 'Already have an account?'
        case 'pages.login.github_login':
            return 'Continue with GitHub'
        case 'pages.login.google_login':
            return 'Continue with Google'
        case 'pages.login.or_continue_with_email':
            return 'Or continue with email'
        case 'legal.user_agreement':
            return 'User Agreement'
        case 'legal.privacy_policy':
            return 'Privacy Policy'
        case 'legal.agreement_checkbox':
            return 'I agree to the terms'
        case 'validation.required':
            return 'This field is required'
        case 'validation.password_mismatch':
            return 'Passwords do not match'
        case 'common.error':
            return 'Error'
        case 'common.success':
            return 'Success'
        case 'common.save_success':
            return 'Saved successfully'
        case 'common.unexpected_error':
            return 'Unexpected error'
        default:
            return key
    }
}

vi.mock('@/composables/use-auth-session', () => ({
    invalidateAuthSessionState: (...args: Parameters<typeof invalidateAuthSessionStateMock>) => invalidateAuthSessionStateMock(...args),
    refreshAuthSession: (...args: Parameters<typeof refreshAuthSessionMock>) => refreshAuthSessionMock(...args),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signUp: {
            email: (...args: Parameters<typeof signUpEmailMock>) => signUpEmailMock(...args),
        },
        signIn: {
            social: (...args: Parameters<typeof socialSignInMock>) => socialSignInMock(...args),
        },
    },
}))

vi.mock('@/utils/schemas/auth', () => ({
    registerSchema: {
        safeParse: vi.fn((data) => {
            const errors: { path: string[], message: string }[] = []

            if (!data.name) {
                errors.push({ path: ['name'], message: 'validation.required' })
            }
            if (!data.email) {
                errors.push({ path: ['email'], message: 'validation.required' })
            }
            if (!data.password) {
                errors.push({ path: ['password'], message: 'validation.required' })
            }
            if (!data.confirmPassword) {
                errors.push({ path: ['confirmPassword'], message: 'validation.required' })
            }
            if (!data.agreed) {
                errors.push({ path: ['agreed'], message: 'validation.required' })
            }

            if (errors.length > 0) {
                return { success: false, error: { issues: errors } }
            }

            if (data.password !== data.confirmPassword) {
                return {
                    success: false,
                    error: {
                        issues: [{ path: ['confirmPassword'], message: 'validation.password_mismatch' }],
                    },
                }
            }

            return { success: true, data }
        }),
    },
}))

mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))
mockNuxtImport('useI18n', () => () => ({
    t: translate,
    locale: { value: 'en-US' },
}))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useRouter', () => () => ({
    push: vi.fn(),
    replace: vi.fn(() => Promise.resolve()),
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    currentRoute: { value: routeState },
    onError: vi.fn(),
}))
mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useSwitchLocalePath', () => () => () => routeState.path)
mockNuxtImport('useRuntimeConfig', () => () => ({
    app: {
        baseURL: '/',
        buildAssetsDir: '/_nuxt/',
        cdnURL: '',
    },
    public: {
        socialProviders: {
            github: true,
            google: true,
        },
    },
}))
mockNuxtImport('navigateTo', () => (...args: Parameters<typeof navigateToMock>) => navigateToMock(...args))
mockNuxtImport('definePageMeta', () => vi.fn())

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
    Card: { template: '<div class="register-card"><slot name="title"/><slot name="content"/><slot name="footer"/></div>' },
    Button: {
        template: '<button :type="type" :data-loading="String(loading)" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['label', 'loading', 'icon', 'severity', 'outlined', 'type', 'class'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :id="id" :value="modelValue" :type="type" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'type', 'invalid', 'id', 'class'],
        emits: ['update:modelValue'],
    },
    Password: {
        template: '<input :id="id" :value="modelValue" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid', 'id'],
        emits: ['update:modelValue'],
    },
    Checkbox: {
        template: '<input id="agreed" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'binary', 'inputId', 'invalid'],
        emits: ['update:modelValue'],
    },
    Divider: { template: '<div class="divider"><slot /></div>' },
    Message: { template: '<div v-if="severity" class="message"><slot /></div>', props: ['severity', 'size', 'variant'] },
    Toast: { template: '<div class="toast-stub" />' },
    'app-captcha': AppCaptchaStub,
    NuxtLink: { template: '<a :href="to" :target="target"><slot /></a>', props: ['to', 'target', 'class'] },
    i18nT: { template: '<span class="agreement-copy"><slot name="agreement" /><slot name="privacy" /></span>', props: ['keypath'] },
}

import RegisterPage from './register.vue'

async function mountPage() {
    return mountSuspended(RegisterPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.query = {}
        routeState.path = '/register'
        routeState.fullPath = '/register'
        routeState.params = {}
        routeState.matched = []
        routeState.meta = {}
        routeState.hash = ''
        routeState.redirectedFrom = undefined
        signUpEmailMock.mockResolvedValue({ error: null })
        socialSignInMock.mockResolvedValue(undefined)
        refreshAuthSessionMock.mockResolvedValue(undefined)
    })

    it('装配真实注册页文案而不是显示 raw key', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(wrapper.find('.register-page').exists()).toBe(true)
        expect(text).toContain('Create account')
        expect(text).toContain('Continue with GitHub')
        expect(text).toContain('Continue with Google')
        expect(text).toContain('Already have an account?')
        expect(text).not.toContain('pages.register.title')
        expect(text).not.toContain('pages.login.github_login')
    })

    it('shows translated validation errors instead of submitting invalid payloads', async () => {
        const wrapper = await mountPage()

        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(signUpEmailMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('This field is required')
    })

    it('dispatches social sign-in with localized callback targets', async () => {
        const wrapper = await mountPage()
        const buttons = wrapper.findAll('button')

        await buttons[0]?.trigger('click')
        await buttons[1]?.trigger('click')

        expect(socialSignInMock).toHaveBeenNthCalledWith(1, {
            provider: 'github',
            callbackURL: '/',
        })
        expect(socialSignInMock).toHaveBeenNthCalledWith(2, {
            provider: 'google',
            callbackURL: '/',
        })
    })

    it('submits successfully and redirects home after showing a success toast', async () => {
        const wrapper = await mountPage()

        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('#password').setValue('secure-pass')
        await wrapper.find('#confirmPassword').setValue('secure-pass')
        await wrapper.find('#agreed').setValue(true)
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(invalidateAuthSessionStateMock).toHaveBeenCalledTimes(1)
        expect(signUpEmailMock).toHaveBeenCalledWith({
            email: 'tester@momei.dev',
            password: 'secure-pass',
            name: 'Tester',
            language: 'en-US',
            callbackURL: '/',
            fetchOptions: {
                headers: {
                    'x-captcha-response': 'captcha-token',
                },
            },
        })
        expect(toastAddMock).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Success',
            detail: 'Saved successfully',
            life: 3000,
        })
        expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('restores session state and captcha when registration fails or throws', async () => {
        signUpEmailMock.mockResolvedValueOnce({
            error: {
                message: 'Register failed',
                statusText: 'Bad Request',
            },
        })
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const wrapper = await mountPage()

        await wrapper.find('#name').setValue('Tester')
        await wrapper.find('#email').setValue('tester@momei.dev')
        await wrapper.find('#password').setValue('secure-pass')
        await wrapper.find('#confirmPassword').setValue('secure-pass')
        await wrapper.find('#agreed').setValue(true)
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(refreshAuthSessionMock).toHaveBeenCalledTimes(1)
        expect(resetCaptchaMock).toHaveBeenCalledTimes(1)
        expect(toastAddMock).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Register failed',
            life: 3000,
        })

        signUpEmailMock.mockRejectedValueOnce(new Error('network-failed'))
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(refreshAuthSessionMock).toHaveBeenCalledTimes(2)
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
        expect(toastAddMock).toHaveBeenLastCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Unexpected error',
            life: 3000,
        })

        consoleErrorSpy.mockRestore()
    })
})
