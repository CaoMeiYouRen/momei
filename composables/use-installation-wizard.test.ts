import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useInstallationWizard } from './use-installation-wizard'
import { SettingKey } from '@/types/setting'

vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>()

    return {
        ...actual,
        onMounted: (callback: () => void) => callback(),
    }
})

const {
    fetchMock,
    navigateToMock,
    queueSetupJourneyStageMock,
    localePathMock,
    runtimeConfigState,
} = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    navigateToMock: vi.fn(),
    queueSetupJourneyStageMock: vi.fn(),
    localePathMock: vi.fn((input: string | { path: string, query?: Record<string, string> }) => {
        if (typeof input === 'string') {
            return `/zh-CN${input}`
        }

        const search = input.query
            ? `?${new URLSearchParams(input.query).toString()}`
            : ''

        return `/zh-CN${input.path}${search}`
    }),
    runtimeConfigState: {
        app: {
            baseURL: '/',
        },
        public: {
            demoMode: false,
            postCopyright: undefined,
            defaultCopyright: undefined,
        },
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useRuntimeConfig', () => () => runtimeConfigState)
mockNuxtImport('useLocalePath', () => () => localePathMock)
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('@/utils/web/setup-journey', () => ({
    queueSetupJourneyStage: queueSetupJourneyStageMock,
}))

vi.stubGlobal('$fetch', fetchMock)


function createInstallationStatus(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        installed: false,
        databaseConnected: true,
        hasUsers: false,
        hasInstallationFlag: false,
        envInstallationFlag: false,
        nodeVersion: 'v22.1.0',
        os: 'linux',
        databaseType: 'postgres',
        databaseVersion: '16',
        isServerless: false,
        isNodeVersionSafe: true,
        runtime: 'node',
        envSettings: {},
        deploymentDiagnostics: {
            runtime: 'node',
            adapter: 'node-server',
            serverlessPreset: null,
            preset: 'node-server',
            environment: 'production',
            packageManager: 'pnpm',
            packageManagerVersion: '10.8.0',
            nodeVersion: 'v22.1.0',
            hasDockerfile: false,
            hasDockerCompose: false,
            hasWranglerConfig: false,
            hasVercelConfig: false,
            hasNetlifyConfig: false,
            hasFlyConfig: false,
            hasHelmChart: false,
            hasK8sManifest: false,
            hasServiceWorker: false,
            hasRedisUrl: false,
            hasDirectDatabaseUrl: true,
            publicBaseUrl: 'https://momei.test',
            analyticsProviders: [],
            deploymentTargets: [],
            missingEnvKeys: [],
            warnings: [],
            recommendationKeys: [],
        },
        ...overrides,
    }
}

async function flushWizard() {
    await Promise.resolve()
    await Promise.resolve()
}

async function createWizard() {
    const wizard = useInstallationWizard()
    await flushWizard()

    return wizard
}

describe('useInstallationWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        runtimeConfigState.public.demoMode = false
        runtimeConfigState.public.postCopyright = undefined
        runtimeConfigState.public.defaultCopyright = undefined
        fetchMock.mockReset()
        navigateToMock.mockReset()
        queueSetupJourneyStageMock.mockReset()
        localePathMock.mockClear()
    })

    it('loads installation status on mount and backfills env-driven config values', async () => {
        fetchMock.mockResolvedValueOnce({
            data: createInstallationStatus({
                envSettings: {
                    [SettingKey.SITE_URL]: { value: 'https://blog.example.com' },
                    [SettingKey.DEFAULT_LANGUAGE]: { value: 'en-US' },
                    [SettingKey.EMAIL_PORT]: { value: '2525' },
                    [SettingKey.AI_MODEL]: { value: 'gpt-4.1' },
                },
            }),
        })

        const wizard = await createWizard()

        expect(fetchMock).toHaveBeenCalledWith('/api/install/status')
        expect(wizard.installationStatus.value?.databaseType).toBe('postgres')
        expect(wizard.siteConfig.value.siteUrl).toBe('https://blog.example.com')
        expect(wizard.siteConfig.value.defaultLanguage).toBe('en-US')
        expect(wizard.extraConfig.value.emailPort).toBe(2525)
        expect(wizard.extraConfig.value.aiModel).toBe('gpt-4.1')
        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects away from the wizard when the system is already installed before finalize', async () => {
        fetchMock.mockResolvedValueOnce({
            data: createInstallationStatus({ installed: true }),
        })

        await createWizard()

        expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('records translated request errors when database initialization fails', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: createInstallationStatus() })
            .mockRejectedValueOnce({ data: { i18nKey: 'installation.database.custom_error' } })

        const wizard = await createWizard()

        await wizard.initDatabase()

        expect(wizard.dbInitSuccess.value).toBe(false)
        expect(wizard.dbInitLoading.value).toBe(false)
        expect(wizard.dbInitError.value).toBe('installation.database.custom_error')
    })

    it('saves site config and advances to step 4 on success', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: createInstallationStatus() })
            .mockResolvedValueOnce({})

        const wizard = await createWizard()
        const activateStep = vi.fn()
        wizard.siteConfig.value.siteUrl = 'https://momei.test'

        await wizard.saveSiteConfig(activateStep)

        expect(fetchMock).toHaveBeenLastCalledWith('/api/install/setup-site', {
            method: 'POST',
            body: wizard.siteConfig.value,
        })
        expect(activateStep).toHaveBeenCalledWith('4')
        expect(wizard.siteConfigLoading.value).toBe(false)
        expect(wizard.siteFieldErrors.value).toEqual({})
    })

    it('maps validation issues when saving site config fails', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: createInstallationStatus() })
            .mockRejectedValueOnce({
                data: [
                    { path: ['siteUrl'], message: 'Site URL is required' },
                ],
            })

        const wizard = await createWizard()

        await wizard.saveSiteConfig(vi.fn())

        expect(wizard.siteConfigError.value).toBe('installation.siteConfig.error')
        expect(wizard.siteFieldErrors.value.siteUrl).toBe('Site URL is required')
    })

    it('creates the admin account and saves extra config with fallback step activation', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: createInstallationStatus() })
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('preview failed'))

        const wizard = await createWizard()
        const activateAdminStep = vi.fn()
        const activateExtraStep = vi.fn()

        wizard.adminData.value = {
            name: 'Admin',
            email: 'admin@example.com',
            password: 'secret123',
        }

        await wizard.createAdmin(activateAdminStep)
        await wizard.saveExtraConfig(activateExtraStep)

        expect(activateAdminStep).toHaveBeenCalledWith('5')
        expect(activateExtraStep).toHaveBeenCalledWith('6')
        expect(wizard.extraConfigError.value).toBe('installation.preview.error')
        expect(wizard.extraFieldErrors.value).toEqual({})
    })

    it('finalizes installation and suppresses the auto redirect during the next status refresh', async () => {
        fetchMock
            .mockResolvedValueOnce({ data: createInstallationStatus() })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ data: createInstallationStatus({ installed: true }) })

        const wizard = await createWizard()

        await wizard.finalizeInstallation()
        await wizard.fetchInstallationStatus()

        expect(wizard.finalizeSuccess.value).toBe(true)
        expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('builds the localized admin settings redirect when opening admin settings', async () => {
        fetchMock.mockResolvedValueOnce({ data: createInstallationStatus() })

        const wizard = await createWizard()

        await wizard.openAdminSettings()

        expect(queueSetupJourneyStageMock).toHaveBeenCalledWith('admin')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/login?redirect=%2Fzh-CN%2Fadmin%2Fsettings%3Ftab%3Dgeneral')
    })
})
