import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import SettingsPage from '@/pages/admin/settings/index.vue'

const translations: Record<string, string> = {
    'pages.admin.settings.system.smart_mode.title': '智能混合模式说明',
    'pages.admin.settings.system.demo_preview.title': '演示模式样例数据',
    'pages.admin.settings.system.demo_preview.description': '当前页面展示的是脱敏后的演示样例，用于说明系统设置能力。读取已切换为安全预览数据，保存、删除等修改操作仍会被拦截。',
}

function translate(key: string, params?: Record<string, string>) {
    const template = translations[key]

    if (!template) {
        return key
    }

    if (!params) {
        return template
    }

    return template.replace(/\{(\w+)\}/g, (_, token: string) => params[token] ?? `{${token}}`)
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            locale: ref('zh-CN'),
            t: translate,
        }),
    }
})

const mockToast = {
    add: vi.fn(),
}

const mockNavigateTo = vi.fn()

const mockRoute = reactive({
    path: '/admin/settings',
    query: {} as Record<string, unknown>,
})

const mockSettingsResponse = {
    data: {
        items: [
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
            {
                key: 'max_upload_size',
                value: '4.5MiB',
                description: 'max upload size',
                level: 1,
                maskType: 'none',
                source: 'db',
                isLocked: false,
                envKey: 'NUXT_PUBLIC_MAX_UPLOAD_SIZE',
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
            },
            {
                key: 'upload_limit_window',
                value: '86400',
                description: 'upload limit window',
                level: 1,
                maskType: 'none',
                source: 'db',
                isLocked: false,
                envKey: 'UPLOAD_LIMIT_WINDOW',
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
            },
        ],
        demoPreview: true,
    },
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
            locale: ref('zh-CN'),
            t: translate,
        }),
        useToast: () => mockToast,
        useRoute: () => mockRoute,
        useAppApi: () => ({
            $appFetch: mockFetch,
        }),
        useLocalePath: () => (path: string) => path,
        navigateTo: mockNavigateTo,
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

vi.stubGlobal('useI18n', () => ({
    locale: ref('zh-CN'),
    t: translate,
}))

vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('navigateTo', mockNavigateTo)

describe('Admin Settings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRoute.query = {}
        mockFetch.mockImplementation((url: string, options?: { method?: string, body?: unknown }) => {
            if (url === '/api/admin/settings' && options?.method === 'PUT') {
                return Promise.resolve({ data: null })
            }

            return Promise.resolve(mockSettingsResponse)
        })
    })

    it('renders smart mode summary and saves wrapped payload', async () => {
        const wrapper = await mountSuspended(SettingsPage, {
            global: {
                mocks: {
                    $t: translate,
                },
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
                    SetupFollowUpCard: { template: '<div>Setup Follow Up</div>' },
                    ThirdPartySettings: { template: '<div>Third Party</div>' },
                    Card: { template: '<div><slot name="content" /></div>' },
                    Tabs: {
                        template: '<div><button class="tab-switch" @click="$emit(\'update:value\', \'agreements\')">Switch</button><slot /></div>',
                        emits: ['update:value'],
                    },
                    TabList: { template: '<div><slot /></div>' },
                    Tab: { template: '<div><slot /></div>' },
                    TabPanels: { template: '<div><slot /></div>' },
                    TabPanel: { template: '<div><slot /></div>' },
                    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    Message: { template: '<div><slot /></div>' },
                    Tag: { props: ['value'], template: '<span>{{ value }}</span>' },
                },
            },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('智能混合模式说明')
        expect(wrapper.text()).toContain('演示模式样例数据')

        // @ts-expect-error access exposed script setup binding for test
        await wrapper.vm.saveSettings()

        const putCall = mockFetch.mock.calls.find(([, options]) => options?.method === 'PUT')
        expect(putCall).toBeDefined()
        expect(putCall?.[1]).toEqual(expect.objectContaining({
            body: {
                settings: {
                    site_title: 'Momei',
                    max_upload_size: '4.5MiB',
                    upload_limit_window: '86400',
                },
                reason: 'system_settings_update',
                source: 'admin_ui',
            },
        }))
    })

})
