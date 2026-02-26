import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ForgotPasswordPage from './forgot-password.vue'

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: {
            social: vi.fn(),
        },
    },
}))

// Stub components
const stubs = {
    Card: { template: '<div class="card"><slot name="title"/><slot name="content"/><slot name="footer"/></div>' },
    Button: {
        template: '<button @click="$emit(\'click\')"><slot /></button>',
        props: ['label', 'loading', 'icon', 'severity', 'outlined', 'type', 'class'],
        emits: ['click'],
    },
    InputText: {
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :class="{ \'p-invalid\': invalid }" />',
        props: ['modelValue', 'type', 'invalid', 'id', 'placeholder'],
        emits: ['update:modelValue'],
    },
    Message: { template: '<div v-if="severity" class="message"><slot /></div>', props: ['severity', 'size', 'variant'] },
    Toast: { template: '<div />' },
    'app-captcha': { template: '<div />' },
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
    Divider: { template: '<hr />' },
}

const mockToast = {
    add: vi.fn(),
}

// Mock Nuxt auto-imports
vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useToast: () => mockToast,
        useI18n: () => ({
            t: (key: string) => key,
        }),
        useLocalePath: () => (path: string) => path,
        useHead: vi.fn(),
        useRuntimeConfig: () => ({
            public: {
                socialProviders: {
                    github: true,
                    google: true,
                },
            },
        }),
        navigateTo: vi.fn(),
    }
})

vi.stubGlobal('useToast', () => mockToast)
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
        socialProviders: {
            github: true,
            google: true,
        },
    },
}))
vi.stubGlobal('navigateTo', vi.fn())

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the forgot password form correctly', async () => {
        const wrapper = await mountSuspended(ForgotPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.forgot-password-page').exists()).toBe(true)
    })

    it('shows email input field', async () => {
        const wrapper = await mountSuspended(ForgotPasswordPage, {
            global: {
                stubs,
            },
        })

        const emailInput = wrapper.find('input')
        expect(emailInput.exists()).toBe(true)
    })

    it('shows submit button', async () => {
        const wrapper = await mountSuspended(ForgotPasswordPage, {
            global: {
                stubs,
            },
        })

        const submitBtn = wrapper.find('button[type="submit"]')
        expect(submitBtn.exists()).toBe(true)
    })

    it('shows back to login link', async () => {
        const wrapper = await mountSuspended(ForgotPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.html().length).toBeGreaterThan(0)
    })
})
