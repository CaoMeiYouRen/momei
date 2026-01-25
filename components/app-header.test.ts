import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from './app-header.vue'
import { authClient } from '@/lib/auth-client'

// Mock PrimeVue components
const stubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    Button: { template: '<button @click="$emit(\'click\', $event)"><slot /></button>' },
    Menu: {
        template: '<div />',
        methods: { toggle: vi.fn() },
    },
    Drawer: { template: '<div><slot /></div>' },
    Divider: { template: '<hr />' },
    LanguageSwitcher: { template: '<div />' },
}

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => ({ value: { data: null, isPending: false } })),
    },
}))

// Mock @vueuse/core
const mockIsDarkRef = ref(false)
const mockToggleDark = vi.fn(() => {
    mockIsDarkRef.value = !mockIsDarkRef.value
})

vi.mock('@vueuse/core', () => ({
    useDark: vi.fn(() => mockIsDarkRef),
    useToggle: vi.fn(() => mockToggleDark),
    usePreferredDark: vi.fn(() => ref(false)),
}))

// Mock useSearch
const mockOpenSearch = vi.fn()
vi.mock('@/composables/use-search', () => ({
    useSearch: () => ({
        openSearch: mockOpenSearch,
    }),
}))

describe('AppHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsDarkRef.value = false
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue({ value: { data: null, isPending: false } })
    })

    it('renders logo and navigation links', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(wrapper.find('.app-header__logo').exists()).toBe(true)
        // Adjust for translated text if i18n is active
        const text = wrapper.text()
        expect(text.includes('pages.posts.title') || text.includes('文章列表')).toBe(true)
        expect(text.includes('pages.archives.title') || text.includes('归档')).toBe(true)
    })

    it('shows login button when not logged in', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })
        expect(wrapper.find('#login-btn').attributes('icon')).toBe('pi pi-sign-in')
    })

    it('shows user profile button and admin menu when logged in as admin', async () => {
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue({
            value: {
                data: {
                    user: { id: '1', role: 'admin' },
                },
                isPending: false,
            },
        })

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(wrapper.find('#user-menu-btn').attributes('icon')).toBe('pi pi-user')
        expect(wrapper.find('#admin-menu-btn').exists()).toBe(true)
    })

    it('calls openSearch when search button is clicked', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await wrapper.find('#search-btn').trigger('click')
        expect(mockOpenSearch).toHaveBeenCalled()
    })

    it('toggles dark mode when theme switcher is clicked', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await wrapper.find('#theme-switcher').trigger('click')
        expect(mockToggleDark).toHaveBeenCalled()
    })
})
