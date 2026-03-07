import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import SettingsPage from '@/pages/admin/settings/index.vue'

const mockToast = {
    add: vi.fn(),
}

const mockSettingsResponse = {
    data: [
        {
            key: 'site_title',
            value: 'Momei',
            description: 'site title',
            level: 2,
            maskType: 'none',
            source: 'db',
            isLocked: false,
            envKey: 'NUXT_PUBLIC_APP_NAME',
            defaultUsed: false,
            lockReason: null,
            requiresRestart: false,
        },
        {
            key: 'github_client_id',
            value: '',
            description: 'github client id',
            level: 2,
            maskType: 'none',
            source: 'default',
            isLocked: true,
            envKey: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
            defaultUsed: true,
            lockReason: 'forced_env_lock',
            requiresRestart: true,
        },
    ],
}

const mockFetch = vi.fn((url: string, options?: { method?: string, body?: unknown }) => {
    if (url === '/api/admin/settings' && options?.method === 'PUT') {
        return Promise.resolve({ data: null })
    }

    return Promise.resolve(mockSettingsResponse)
})

vi.stubGlobal('$fetch', mockFetch)

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string, params?: Record<string, string>) => {
                if (params?.envKey) {
                    return `${key}:${params.envKey}`
                }

                return key
            },
        }),
        useToast: () => mockToast,
        useAppApi: () => ({
            $appFetch: mockFetch,
        }),
        definePageMeta: vi.fn(),
        getAppManifest: vi.fn(() => Promise.resolve({
            publicPath: '/',
            buildId: 'test',
            routes: {},
            matcher: {},
            prerendered: [],
        })),
        getRouteRules: vi.fn(() => ({})),
    }
})

describe('Admin Settings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders smart mode summary and saves wrapped payload', async () => {
        const wrapper = await mountSuspended(SettingsPage, {
            global: {
                stubs: {
                    AdminPageHeader: { template: '<div><slot name="actions" /></div>' },
                    GeneralSettings: { template: '<div>General</div>' },
                    AISettings: { template: '<div>AI</div>' },
                    EmailSettings: { template: '<div>Email</div>' },
                    StorageSettings: { template: '<div>Storage</div>' },
                    AnalyticsSettings: { template: '<div>Analytics</div>' },
                    AuthSettings: { template: '<div>Auth</div>' },
                    SecuritySettings: { template: '<div>Security</div>' },
                    AdminNotificationSettings: { template: '<div>Notifications</div>' },
                    LimitsSettings: { template: '<div>Limits</div>' },
                    AgreementsSettings: { template: '<div>Agreements</div>' },
                    CommercialSettings: { template: '<div>Commercial</div>' },
                    SettingAuditLogList: { template: '<div>Audit Logs</div>' },
                    ThirdPartySettings: { template: '<div>Third Party</div>' },
                    Card: { template: '<div><slot name="content" /></div>' },
                    Tabs: { template: '<div><slot /></div>' },
                    TabList: { template: '<div><slot /></div>' },
                    Tab: { template: '<div><slot /></div>' },
                    TabPanels: { template: '<div><slot /></div>' },
                    TabPanel: { template: '<div><slot /></div>' },
                    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    Tag: { props: ['value'], template: '<span>{{ value }}</span>' },
                },
            },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('智能混合模式说明')

        // @ts-expect-error script setup refs are exposed on the component instance in tests
        wrapper.vm.settings = {
            site_title: 'Momei',
            github_client_id: '',
        }
        // @ts-expect-error script setup refs are exposed on the component instance in tests
        wrapper.vm.metadata = {
            site_title: {
                isLocked: false,
                source: 'db',
                description: 'site title',
                envKey: 'NUXT_PUBLIC_APP_NAME',
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
            },
            github_client_id: {
                isLocked: true,
                source: 'default',
                description: 'github client id',
                envKey: 'NUXT_PUBLIC_GITHUB_CLIENT_ID',
                defaultUsed: true,
                lockReason: 'forced_env_lock',
                requiresRestart: true,
            },
        }

        // @ts-expect-error access exposed script setup binding for test
        await wrapper.vm.saveSettings()

        const putCall = mockFetch.mock.calls.find(([, options]) => options?.method === 'PUT')
        expect(putCall).toBeDefined()
        expect(putCall?.[1]).toEqual(expect.objectContaining({
            body: {
                settings: {
                    site_title: 'Momei',
                },
                reason: 'system_settings_update',
                source: 'admin_ui',
            },
        }))
    })
})
