import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const emailSignInMock = vi.fn()
const socialSignInMock = vi.fn()
const navigateToMock = vi.fn()
const invalidateAuthSessionStateMock = vi.fn()
const refreshAuthSessionMock = vi.fn()
const toastAddMock = vi.fn()
const resetCaptchaMock = vi.fn()
const useHeadMock = vi.fn()
const ensureLocaleMessageModulesMock = vi.fn()
const ensureRouteLocaleMessagesMock = vi.fn()
const routeState = {
    query: {} as Record<string, unknown>,
    path: '/login',
    fullPath: '/login',
    name: 'login___en-US___default',
    params: {},
    matched: [],
    meta: {},
    hash: '',
    redirectedFrom: undefined,
}
const runtimeConfig = {
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
        demoMode: true,
        demoUserEmail: 'demo@momei.dev',
        demoPassword: 'demo-password',
    },
}

const translate = (key: string) => {
    switch (key) {
        case 'pages.login.title':
            return 'Sign in'
        case 'pages.login.description':
            return 'Access your Momei account.'
        case 'pages.login.github_login':
            return 'Continue with GitHub'
        case 'pages.login.google_login':
            return 'Continue with Google'
        case 'pages.login.or_continue_with_email':
            return 'Or continue with email'
        case 'pages.login.email':
            return 'Email'
        case 'pages.login.password':
            return 'Password'
        case 'pages.login.remember_me':
            return 'Remember me'
        case 'pages.login.forgot_password':
            return 'Forgot password?'
        case 'pages.login.submit':
            return 'Sign in'
        case 'pages.login.no_account':
            return 'Create an account'
        case 'pages.login.email_required':
            return 'Email is required'
        case 'pages.login.password_required':
            return 'Password is required'
        case 'legal.user_agreement':
            return 'User Agreement'
        case 'legal.privacy_policy':
            return 'Privacy Policy'
        case 'legal.login_notice':
            return 'By signing in you agree to the terms.'
        case 'common.error':
            return 'Error'
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

vi.mock('@/i18n/config/locale-runtime-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n/config/locale-runtime-loader')>()

    return {
        ...actual,
        ensureLocaleMessageModules: (...args: Parameters<typeof ensureLocaleMessageModulesMock>) => ensureLocaleMessageModulesMock(...args),
        ensureRouteLocaleMessages: (...args: Parameters<typeof ensureRouteLocaleMessagesMock>) => ensureRouteLocaleMessagesMock(...args),
    }
})

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            email: (...args: Parameters<typeof emailSignInMock>) => emailSignInMock(...args),
            social: (...args: Parameters<typeof socialSignInMock>) => socialSignInMock(...args),
        },
    },
}))

vi.mock('@/utils/schemas/auth', () => ({
    loginSchema: {
        safeParse: vi.fn((data) => {
            const issues: { path: string[], message: string }[] = []

            if (!data.email) {
                issues.push({ path: ['email'], message: 'pages.login.email_required' })
            }
            if (!data.password) {
                issues.push({ path: ['password'], message: 'pages.login.password_required' })
            }

            if (issues.length > 0) {
                return { success: false, error: { issues } }
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
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)
mockNuxtImport('useHead', () => (...args: Parameters<typeof useHeadMock>) => useHeadMock(...args))
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
    Card: { template: '<div class="login-card"><slot name="title"/><slot name="content"/><slot name="footer"/></div>' },
    Button: {
        template: '<button :type="type" :data-loading="String(!!loading)" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['label', 'loading', 'icon', 'severity', 'outlined', 'type', 'class'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :id="id" :value="modelValue" :type="type" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['id', 'modelValue', 'type', 'invalid', 'class'],
        emits: ['update:modelValue'],
    },
    Password: {
        template: '<input :id="id" :value="modelValue" :data-invalid="String(!!invalid)" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['id', 'modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid'],
        emits: ['update:modelValue'],
    },
    Checkbox: {
        template: '<input :id="inputId" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['modelValue', 'binary', 'inputId'],
        emits: ['update:modelValue'],
    },
    Divider: { template: '<div class="divider"><slot /></div>' },
    Message: { template: '<div class="message"><slot /></div>', props: ['severity', 'size', 'variant'] },
    Toast: { template: '<div class="toast-stub" />' },
    'app-captcha': AppCaptchaStub,
    NuxtLink: { template: '<a :href="to" :target="target"><slot /></a>', props: ['to', 'target', 'class'] },
    i18nT: { template: '<span class="legal-copy"><slot name="agreement" /><slot name="privacy" /></span>', props: ['keypath'] },
}

import LoginPage from './login.vue'

async function mountPage() {
    return mountSuspended(LoginPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.query = {}
        routeState.path = '/login'
        routeState.fullPath = '/login'
        routeState.params = {}
        routeState.matched = []
        routeState.meta = {}
        routeState.hash = ''
        routeState.redirectedFrom = undefined
        runtimeConfig.public.socialProviders.github = true
        runtimeConfig.public.socialProviders.google = true
        runtimeConfig.public.demoMode = true
        runtimeConfig.public.demoUserEmail = 'demo@momei.dev'
        runtimeConfig.public.demoPassword = 'demo-password'
        ensureLocaleMessageModulesMock.mockResolvedValue(undefined)
        ensureRouteLocaleMessagesMock.mockResolvedValue(undefined)
        emailSignInMock.mockResolvedValue({ error: null })
        socialSignInMock.mockResolvedValue(undefined)
        refreshAuthSessionMock.mockResolvedValue(undefined)
    })

    it('装配真实登录页文案而不是显示 raw key', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(wrapper.find('.login-page').exists()).toBe(true)
        expect(text).toContain('Sign in')
        expect(text).toContain('Continue with GitHub')
        expect(text).toContain('Continue with Google')
        expect(text).toContain('Forgot password?')
        expect(text).toContain('Create an account')
        expect(text).toContain('Remember me')
        expect(text).not.toContain('pages.login.title')
        expect(text).not.toContain('pages.login.github_login')
        expect(useHeadMock).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Sign in',
            meta: expect.arrayContaining([
                expect.objectContaining({ content: 'Access your Momei account.' }),
            ]),
        }))
        expect(ensureLocaleMessageModulesMock).toHaveBeenCalledWith({
            i18n: expect.objectContaining({
                locale: { value: 'en-US' },
            }),
            locale: 'en-US',
            modules: ['auth'],
        })
    })

    it('hides social login controls when all social providers are disabled', async () => {
        runtimeConfig.public.socialProviders.github = false
        runtimeConfig.public.socialProviders.google = false

        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(text).not.toContain('Continue with GitHub')
        expect(text).not.toContain('Continue with Google')
        expect(text).not.toContain('Or continue with email')
    })

    it('prefills the demo account only for editor redirects in demo mode', async () => {
        routeState.query = {
            redirect: '/admin/posts/new',
        }

        const wrapper = await mountPage()
        await nextTick()

        expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('demo@momei.dev')
        expect((wrapper.find('#password').element as HTMLInputElement).value).toBe('demo-password')
    })

    it('dispatches social sign-in with a normalized local callback target', async () => {
        routeState.query = {
            redirect: '//evil.example.com',
        }
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

    it('shows translated required-field errors instead of submitting an empty payload', async () => {
        const wrapper = await mountPage()

        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(emailSignInMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Email is required')
        expect(wrapper.text()).toContain('Password is required')
        expect(wrapper.find('#email').attributes('data-invalid')).toBe('true')
        expect(wrapper.find('#password').attributes('data-invalid')).toBe('true')
    })

    it('submits email sign-in with rememberMe, captcha header, and a safe redirect target', async () => {
        routeState.query = {
            redirect: '/admin/posts/new',
        }
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('writer@momei.dev')
        await wrapper.find('#password').setValue('secure-pass')
        await wrapper.find('#rememberMe').setValue(true)
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()

        expect(invalidateAuthSessionStateMock).toHaveBeenCalledTimes(1)
        expect(emailSignInMock).toHaveBeenCalledWith({
            email: 'writer@momei.dev',
            password: 'secure-pass',
            rememberMe: true,
            callbackURL: '/admin/posts/new',
            fetchOptions: {
                headers: {
                    'x-captcha-response': 'captcha-token',
                },
            },
        })
        expect(navigateToMock).toHaveBeenCalledWith('/admin/posts/new')
        expect(refreshAuthSessionMock).not.toHaveBeenCalled()
    })

    it('restores session state, shows backend errors, and resets captcha on logical failure', async () => {
        emailSignInMock.mockResolvedValueOnce({
            error: {
                statusText: 'Unauthorized',
            },
        })
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('writer@momei.dev')
        await wrapper.find('#password').setValue('wrong-pass')
        await wrapper.find('.captcha-input').setValue('captcha-token')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(refreshAuthSessionMock).toHaveBeenCalledTimes(1)
        expect(resetCaptchaMock).toHaveBeenCalledTimes(1)
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: 'Error',
            detail: 'Unauthorized',
        }))
        expect(navigateToMock).not.toHaveBeenCalled()
        expect(wrapper.find('button[type="submit"]').attributes('data-loading')).toBe('false')
    })

    it('falls back to the shared unexpected error copy when email sign-in throws', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* suppress console error in test */ })
        emailSignInMock.mockRejectedValueOnce(new Error('network down'))
        const wrapper = await mountPage()

        await wrapper.find('#email').setValue('writer@momei.dev')
        await wrapper.find('#password').setValue('secure-pass')
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
        await nextTick()

        expect(refreshAuthSessionMock).toHaveBeenCalledTimes(1)
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Unexpected error',
        }))
        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(resetCaptchaMock).not.toHaveBeenCalled()
        expect(navigateToMock).not.toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
    })
})
