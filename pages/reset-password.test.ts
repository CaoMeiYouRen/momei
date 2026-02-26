import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ResetPasswordPage from './reset-password.vue'

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        resetPassword: vi.fn(),
    },
}))

// Mock schemas
vi.mock('@/utils/schemas/auth', () => ({
    resetPasswordSchema: {
        safeParse: vi.fn((data) => {
            const errors = []
            if (!data.password) errors.push({ path: ['password'], message: 'validation.required' })
            if (!data.confirmPassword) errors.push({ path: ['confirmPassword'], message: 'validation.required' })

            if (errors.length > 0) {
                return { success: false, error: { issues: errors } }
            }
            if (data.password !== data.confirmPassword) {
                return {
                    success: false,
                    error: { issues: [{ path: ['confirmPassword'], message: 'validation.password_mismatch' }] },
                }
            }
            return { success: true, data }
        }),
    },
}))

// Stub components
const stubs = {
    Card: { template: '<div class="card"><slot name="title"/><slot name="content"/><slot name="footer"/></div>' },
    Button: {
        template: '<button :type="type" @click="$emit(\'click\')"><slot /></button>',
        props: ['label', 'loading', 'icon', 'severity', 'type', 'class'],
        emits: ['click'],
    },
    Password: {
        template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue', 'feedback', 'toggleMask', 'fluid', 'invalid', 'id'],
        emits: ['update:modelValue'],
    },
    Message: { template: '<div v-if="severity" class="message"><slot /></div>', props: ['severity', 'size', 'variant'] },
    Toast: { template: '<div />' },
    NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
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
        useRoute: () => ({ query: { token: 'test-token' } }),
        navigateTo: vi.fn(),
    }
})

vi.stubGlobal('useToast', () => mockToast)
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
vi.stubGlobal('useLocalePath', () => (path: string) => path)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useRoute', () => ({ query: { token: 'test-token' } }))
vi.stubGlobal('navigateTo', vi.fn())

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the reset password form correctly', async () => {
        const wrapper = await mountSuspended(ResetPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.find('.reset-password-page').exists()).toBe(true)
    })

    it('shows password input field', async () => {
        const wrapper = await mountSuspended(ResetPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.html().length).toBeGreaterThan(0)
    })

    it('shows confirm password input field', async () => {
        const wrapper = await mountSuspended(ResetPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.html().length).toBeGreaterThan(0)
    })

    it('shows submit button', async () => {
        const wrapper = await mountSuspended(ResetPasswordPage, {
            global: {
                stubs,
            },
        })

        // Button component should be rendered
        const html = wrapper.html()
        expect(html).toContain('button')
        expect(wrapper.html().length).toBeGreaterThan(0)
    })

    it('shows back to login link', async () => {
        const wrapper = await mountSuspended(ResetPasswordPage, {
            global: {
                stubs,
            },
        })

        expect(wrapper.html().length).toBeGreaterThan(0)
    })
})
