import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AuthCard from './auth-card.vue'

describe('AuthCard', () => {
    it('renders submit button with label', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'pages.forgot_password.title',
                subtitleKey: 'pages.forgot_password.subtitle',
                submitLabel: 'Send Reset Link',
                loading: false,
                error: '',
            },
        })

        expect(wrapper.find('.submit-btn').exists()).toBe(true)
    })

    it('shows error message when error prop is set', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'Login',
                subtitleKey: 'Enter',
                submitLabel: 'Login',
                loading: false,
                error: 'Invalid credentials',
            },
        })

        expect(wrapper.find('.error-message').exists()).toBe(true)
        expect(wrapper.text()).toContain('Invalid credentials')
    })

    it('renders slot content', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'Login',
                subtitleKey: 'Enter',
                submitLabel: 'Login',
                loading: false,
                error: '',
            },
            slots: {
                default: '<div class="test-slot">Email input here</div>',
            },
        })

        expect(wrapper.find('.test-slot').exists()).toBe(true)
    })

    it('renders footer slot when provided', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'Login',
                subtitleKey: 'Enter',
                submitLabel: 'Login',
                loading: false,
                error: '',
            },
            slots: {
                footer: '<a href="/login">Back to login</a>',
            },
        })

        expect(wrapper.find('.auth-footer').exists()).toBe(true)
        expect(wrapper.text()).toContain('Back to login')
    })

    it('does not render footer without slot', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'Login',
                subtitleKey: 'Enter',
                submitLabel: 'Login',
                loading: false,
                error: '',
            },
        })

        expect(wrapper.find('.auth-footer').exists()).toBe(false)
    })

    it('renders logo image pointing to home', async () => {
        const wrapper = await mountSuspended(AuthCard, {
            props: {
                titleKey: 'Login',
                subtitleKey: 'Enter',
                submitLabel: 'Login',
                loading: false,
                error: '',
            },
        })

        const img = wrapper.find('.logo')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('/logo.png')
    })
})
