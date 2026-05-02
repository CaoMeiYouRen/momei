import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsPage from './settings.vue'
import { authClient } from '@/lib/auth-client'

const sessionState = ref<{ data: { user: { role: string } } | null }>({
    data: null,
})

const routeState = {
    query: {} as Record<string, unknown>,
    path: '/settings',
    fullPath: '/settings',
    params: {},
    matched: [],
    meta: {},
    hash: '',
    name: 'settings___zh-CN___default',
}

const translate = (key: string) => {
    switch (key) {
        case 'pages.settings.title':
            return 'Account settings'
        case 'pages.settings.profile.title':
            return 'Profile'
        case 'pages.settings.security.title':
            return 'Security'
        case 'pages.settings.api_keys.title':
            return 'API keys'
        case 'pages.settings.notifications.title':
            return 'Notifications'
        case 'pages.settings.commercial.title':
            return 'Commercial'
        default:
            return key
    }
}

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => sessionState),
    },
}))

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('definePageMeta', () => vi.fn())

const stubs = {
    Card: { template: '<div class="settings-card"><slot name="content" /></div>' },
    Toast: { template: '<div class="toast-stub" />' },
    SettingsProfile: { template: '<div class="settings-profile-panel">Profile panel</div>' },
    SettingsSecurity: { template: '<div class="settings-security-panel">Security panel</div>' },
    SettingsApiKeys: { template: '<div class="settings-api-keys-panel">API keys panel</div>' },
    SettingsNotifications: { template: '<div class="settings-notifications-panel">Notifications panel</div>' },
    SettingsCommercial: { template: '<div class="settings-commercial-panel">Commercial panel</div>' },
}

async function mountPage() {
    return mountSuspended(SettingsPage, {
        global: {
            stubs,
            mocks: {
                $t: translate,
            },
        },
    })
}

describe('SettingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        routeState.query = {}
        sessionState.value = {
            data: {
                user: {
                    role: 'user',
                },
            },
        }

        // @ts-expect-error mocked auth client
        authClient.useSession.mockReturnValue(sessionState)
    })

    it('renders profile settings by default and hides the commercial tab for regular users', async () => {
        const wrapper = await mountPage()
        const text = wrapper.text()

        expect(text).toContain('Account settings')
        expect(text).toContain('Profile')
        expect(text).toContain('Security')
        expect(text).toContain('API keys')
        expect(text).toContain('Notifications')
        expect(text).not.toContain('Commercial')
        expect(text).not.toContain('pages.settings.title')
        expect(wrapper.find('.settings-profile-panel').exists()).toBe(true)
        expect(wrapper.find('.settings-commercial-panel').exists()).toBe(false)
    })

    it('syncs a valid route tab query into the active content panel', async () => {
        routeState.query = { tab: 'notifications' }

        const wrapper = await mountPage()

        expect(wrapper.find('.settings-notifications-panel').exists()).toBe(true)
        expect(wrapper.find('.settings-profile-panel').exists()).toBe(false)
    })

    it('ignores unknown route tab queries and falls back to the profile panel', async () => {
        routeState.query = { tab: 'unknown' }

        const wrapper = await mountPage()

        expect(wrapper.find('.settings-profile-panel').exists()).toBe(true)
        expect(wrapper.find('.settings-notifications-panel').exists()).toBe(false)
    })

    it('shows the commercial tab for authors and admins', async () => {
        sessionState.value = {
            data: {
                user: {
                    role: 'author',
                },
            },
        }
        routeState.query = { tab: 'commercial' }

        const wrapper = await mountPage()

        expect(wrapper.text()).toContain('Commercial')
        expect(wrapper.find('.settings-commercial-panel').exists()).toBe(true)
    })

    it('drops back to the profile tab when commercial access disappears', async () => {
        sessionState.value = {
            data: {
                user: {
                    role: 'admin',
                },
            },
        }
        routeState.query = { tab: 'commercial' }

        const wrapper = await mountPage()
        expect(wrapper.find('.settings-commercial-panel').exists()).toBe(true)

        sessionState.value = {
            data: {
                user: {
                    role: 'user',
                },
            },
        }
        await nextTick()

        expect(wrapper.find('.settings-commercial-panel').exists()).toBe(false)
        expect(wrapper.find('.settings-profile-panel').exists()).toBe(true)
    })
})
