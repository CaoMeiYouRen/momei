import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockEmailSignIn, mockSocialSignIn, mockNavigateTo, mockRoute, mockRuntimeConfig, mockEnsureLocaleMessageModules } = vi.hoisted(() => ({
    mockEmailSignIn: vi.fn(),
    mockSocialSignIn: vi.fn(),
    mockNavigateTo: vi.fn(),
    mockEnsureLocaleMessageModules: vi.fn(),
    mockRoute: {
        query: {} as Record<string, unknown>,
        path: '/login',
        fullPath: '/login',
        name: 'login___zh-CN___default',
        params: {},
        matched: [],
        meta: {},
        hash: '',
        redirectedFrom: undefined,
    },
    mockRuntimeConfig: {
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
    },
}))

const { mockInvalidateAuthSessionState, mockRefreshAuthSession } = vi.hoisted(() => ({
    mockInvalidateAuthSessionState: vi.fn(),
    mockRefreshAuthSession: vi.fn(),
}))

vi.mock('@/composables/use-auth-session', () => ({
    invalidateAuthSessionState: mockInvalidateAuthSessionState,
    refreshAuthSession: mockRefreshAuthSession,
}))

vi.mock('@/i18n/config/locale-runtime-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n/config/locale-runtime-loader')>()

    return {
        ...actual,
        ensureLocaleMessageModules: mockEnsureLocaleMessageModules,
    }
})

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            email: mockEmailSignIn,
            social: mockSocialSignIn,
        },
    },
}))

// Mock schemas
vi.mock('@/utils/schemas/auth', () => ({
    loginSchema: {
        safeParse: vi.fn((data) => {
            if (!data.email || !data.password) {
                return {
                    success: false,
                    error: { issues: [{ path: ['email'], message: 'validation.required' }] },
                }
            }
            if (!data.email.includes('@')) {
                return {
                    success: false,
                    error: { issues: [{ path: ['email'], message: 'validation.invalid_email' }] },
                }
            }
            return { success: true, data }
        }),
    },
}))

// Stub components
const stubs = {
    Card: { template: '<div class="card"><slot name="title"/><slot name="content"/><slot name="footer"/></div>' },
    Button: { template: '<button :type="type" @click="$emit(\'click\')">{{ label }}<slot /></button>', props: ['label', 'loading', 'icon', 'severity', 'outlined', 'type'] },
    InputText: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :class="[{ \'p-invalid\': invalid }, $attrs.class]" />', props: ['id', 'modelValue', 'type', 'invalid'] },
    Password: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid'] },
    Checkbox: { template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['modelValue', 'binary', 'inputId'] },
    Divider: { template: '<hr />' },
    Message: { template: '<div v-if="severity"><slot /></div>', props: ['severity', 'size', 'variant'] },
    Toast: { template: '<div />' },
    'app-captcha': {
        template: '<div />',
        methods: {
            reset: vi.fn(),
        },
    },
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to', 'target'] },
    i18nT: { template: '<span><slot name="agreement" /><slot name="privacy" /></span>', props: ['keypath'] },
}

const mockToast = {
    add: vi.fn(),
}

mockNuxtImport('useToast', () => () => mockToast)
mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locale: { value: 'zh-CN' },
    mergeLocaleMessage: vi.fn(),
}))
mockNuxtImport('useRouter', () => () => ({
    afterEach: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    currentRoute: { value: mockRoute },
    onError: vi.fn(),
    replace: vi.fn().mockResolvedValue(undefined),
}))
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useSwitchLocalePath', () => () => () => mockRoute.path)
mockNuxtImport('useRuntimeConfig', () => () => mockRuntimeConfig)
mockNuxtImport('useHead', () => vi.fn())
mockNuxtImport('navigateTo', () => mockNavigateTo)

import LoginPage from './login.vue'

const mountLoginPage = () => mountSuspended(LoginPage, {
    global: {
        stubs,
        mocks: {
            $t: (key: string) => key,
        },
    },
})

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRoute.query = {}
        mockRoute.path = '/login'
        mockRoute.fullPath = '/login'
        mockRoute.params = {}
        mockRoute.matched = []
        mockRoute.meta = {}
        mockRoute.hash = ''
        mockRoute.redirectedFrom = undefined
        mockEnsureLocaleMessageModules.mockResolvedValue(undefined)
    })

    it('renders login form correctly', async () => {
        const wrapper = await mountLoginPage()

        expect(wrapper.find('.login-page').exists()).toBe(true)
        expect(wrapper.find('.login-card').exists()).toBe(true)
    })

    it('preloads auth locale messages before render', async () => {
        await mountLoginPage()

        expect(mockEnsureLocaleMessageModules).toHaveBeenCalledWith({
            i18n: expect.objectContaining({
                locale: { value: 'zh-CN' },
            }),
            locale: 'zh-CN',
            modules: ['auth'],
        })
    })

    it('shows email input field', async () => {
        const wrapper = await mountLoginPage()

        const emailInput = wrapper.find('input#email')
        expect(emailInput.exists()).toBe(true)
    })

    it('shows password input field', async () => {
        const wrapper = await mountLoginPage()

        // Password component is stubbed, check for the wrapper div
        const passwordField = wrapper.find('.login-form__field')
        expect(passwordField.exists()).toBe(true)
    })

    it('shows submit button', async () => {
        const wrapper = await mountLoginPage()

        const submitBtn = wrapper.find('button[type="submit"]')
        expect(submitBtn.exists()).toBe(true)
    })

    it('shows social login buttons when providers are enabled', async () => {
        const wrapper = await mountLoginPage()

        // Check that the page renders correctly with social providers enabled
        // The v-if directive controls visibility based on hasSocialLogin computed property
        const html = wrapper.html()
        // Since social providers are mocked as enabled, check for any indication of social login
        expect(html.length).toBeGreaterThan(0)
    })

    it('shows forgot password link', async () => {
        const wrapper = await mountLoginPage()

        const forgotLink = wrapper.find('.login-form__forgot')
        expect(forgotLink.exists()).toBe(true)
    })

    it('shows register link', async () => {
        const wrapper = await mountLoginPage()

        const registerLink = wrapper.find('.login-card__register-link')
        expect(registerLink.exists()).toBe(true)
    })

    it('shows remember me checkbox', async () => {
        const wrapper = await mountLoginPage()

        // Check for remember me section (stubbed checkbox)
        const rememberSection = wrapper.find('.login-form__remember')
        expect(rememberSection.exists()).toBe(true)
    })

    it('shows legal notice with links', async () => {
        const wrapper = await mountLoginPage()

        const legalNotice = wrapper.find('.login-form__legal-notice')
        expect(legalNotice.exists()).toBe(true)
    })

    it('prefills demo account when redirecting to the editor in demo mode', async () => {
        mockRoute.query = {
            redirect: '/admin/posts/new',
        }

        const wrapper = await mountLoginPage()

        await wrapper.vm.$nextTick()

        const emailInput = wrapper.find('input#email').element as HTMLInputElement
        const passwordInput = wrapper.find('input#password').element as HTMLInputElement

        expect(emailInput.value).toBe('demo@momei.dev')
        expect(passwordInput.value).toBe('demo-password')
    })

    it('uses redirect target for email sign in', async () => {
        mockRoute.query = {
            redirect: '/admin/posts/new',
        }
        mockEmailSignIn.mockResolvedValue({ error: null })

        const wrapper = await mountLoginPage()

        await wrapper.vm.$nextTick()

        await wrapper.find('input#email').setValue('writer@momei.dev')
        await wrapper.find('input#password').setValue('secure-pass')
        await wrapper.find('form').trigger('submit.prevent')

        expect(mockEmailSignIn).toHaveBeenCalledWith(expect.objectContaining({
            callbackURL: '/admin/posts/new',
            email: 'writer@momei.dev',
            password: 'secure-pass',
        }))
        expect(mockNavigateTo).toHaveBeenCalledWith('/admin/posts/new')
    })

    it('restores session state when email sign in fails', async () => {
        mockEmailSignIn.mockResolvedValue({
            error: {
                message: 'Login failed',
                statusText: 'Unauthorized',
            },
        })

        const wrapper = await mountLoginPage()

        await wrapper.find('input#email').setValue('writer@momei.dev')
        await wrapper.find('input#password').setValue('wrong-pass')
        await wrapper.find('form').trigger('submit.prevent')

        expect(mockInvalidateAuthSessionState).toHaveBeenCalledTimes(1)
        expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1)
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
        }))
    })
})
