import { beforeEach, describe, expect, it, vi } from 'vitest'

interface MockPlugin {
    name: string
    options?: Record<string, unknown>
}

const {
    betterAuthMock,
    typeormAdapterMock,
    getAuthLocaleFromRequestMock,
    envState,
    pluginFactories,
} = vi.hoisted(() => {
    const createPluginFactory = (name: string) => vi.fn((options?: Record<string, unknown>) => ({
        name,
        options,
    }))

    return {
        betterAuthMock: vi.fn((options: Record<string, unknown>) => ({ options })),
        typeormAdapterMock: vi.fn(() => ({ adapter: 'typeorm' })),
        getAuthLocaleFromRequestMock: vi.fn(() => 'zh-Hant'),
        envState: {
            EMAIL_EXPIRES_IN: 900,
            AUTH_SECRET: 'auth-secret',
            ADMIN_USER_IDS: ['admin-1'],
            GITHUB_CLIENT_ID: 'github-client-id',
            GITHUB_CLIENT_SECRET: 'github-client-secret',
            GOOGLE_CLIENT_ID: 'google-client-id',
            GOOGLE_CLIENT_SECRET: 'google-client-secret',
            AUTH_BASE_URL: 'https://auth.example.com',
            SITE_URL: 'https://blog.example.com',
            APP_NAME: '墨梅博客',
            EMAIL_REQUIRE_VERIFICATION: true,
            PHONE_EXPIRES_IN: 300,
            AUTH_CAPTCHA_PROVIDER: '',
            AUTH_CAPTCHA_SECRET_KEY: '',
            TEST_MODE: false,
        },
        pluginFactories: {
            username: createPluginFactory('username'),
            magicLink: createPluginFactory('magicLink'),
            emailOTP: createPluginFactory('emailOTP'),
            openAPI: createPluginFactory('openAPI'),
            phoneNumber: createPluginFactory('phoneNumber'),
            admin: createPluginFactory('admin'),
            genericOAuth: createPluginFactory('genericOAuth'),
            jwt: createPluginFactory('jwt'),
            twoFactor: createPluginFactory('twoFactor'),
            captcha: createPluginFactory('captcha'),
            localization: createPluginFactory('localization'),
        },
    }
})

vi.mock('better-auth', () => ({
    betterAuth: betterAuthMock,
}))

vi.mock('better-auth/plugins', () => ({
    username: pluginFactories.username,
    magicLink: pluginFactories.magicLink,
    emailOTP: pluginFactories.emailOTP,
    openAPI: pluginFactories.openAPI,
    phoneNumber: pluginFactories.phoneNumber,
    admin: pluginFactories.admin,
    genericOAuth: pluginFactories.genericOAuth,
    jwt: pluginFactories.jwt,
    twoFactor: pluginFactories.twoFactor,
    captcha: pluginFactories.captcha,
}))

vi.mock('better-auth-localization', () => ({
    localization: pluginFactories.localization,
}))

vi.mock('@/server/database/typeorm-adapter', () => ({
    typeormAdapter: typeormAdapterMock,
}))

vi.mock('@/server/utils/email/index', () => ({
    sendEmail: vi.fn(),
}))

vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(() => 'snowflake-id'),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(() => ({
            count: vi.fn(async () => 1),
            findOne: vi.fn(async () => null),
            save: vi.fn(async () => null),
        })),
    },
}))

vi.mock('@/utils/shared/validate', () => ({
    usernameValidator: vi.fn(() => true),
    validatePhone: vi.fn(() => true),
}))

vi.mock('@/server/database/storage', () => ({
    secondaryStorage: null,
}))

vi.mock('@/utils/shared/env', () => envState)

vi.mock('@/server/entities/subscriber', () => ({
    Subscriber: class Subscriber {},
}))

vi.mock('@/server/entities/user', () => ({
    User: class User {},
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/server/services/agreement', () => ({
    markAgreementConsentForLocale: vi.fn(),
}))

vi.mock('@/server/utils/auth-generators', () => ({
    getTempEmail: vi.fn(() => 'temp@example.com'),
    getTempName: vi.fn(() => 'temp-user'),
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendPasswordResetEmail: vi.fn(),
        sendVerificationEmail: vi.fn(),
        sendEmailChangeVerification: vi.fn(),
        sendMagicLink: vi.fn(),
        sendLoginOTP: vi.fn(),
        sendEmailVerificationOTP: vi.fn(),
        sendPasswordResetOTP: vi.fn(),
    },
}))

vi.mock('@/server/utils/email/locale', () => ({
    resolvePreferredEmailLocale: vi.fn(async () => 'zh-CN'),
}))

vi.mock('@/server/utils/locale', () => ({
    AUTH_PLUGIN_DEFAULT_LOCALE: 'zh-Hans',
    AUTH_PLUGIN_FALLBACK_LOCALE: 'en-US',
    getAuthLocaleFromRequest: getAuthLocaleFromRequestMock,
}))

async function importAuthModule() {
    vi.resetModules()
    const module = await import('./auth')
    const config = betterAuthMock.mock.calls.at(-1)?.[0] as {
        baseURL: string
        trustedOrigins: string[]
        socialProviders: Record<string, { clientId: string, clientSecret: string }>
        plugins: MockPlugin[]
    }

    return {
        module,
        config,
    }
}

describe('lib/auth configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.assign(envState, {
            EMAIL_EXPIRES_IN: 900,
            AUTH_SECRET: 'auth-secret',
            ADMIN_USER_IDS: ['admin-1'],
            GITHUB_CLIENT_ID: 'github-client-id',
            GITHUB_CLIENT_SECRET: 'github-client-secret',
            GOOGLE_CLIENT_ID: 'google-client-id',
            GOOGLE_CLIENT_SECRET: 'google-client-secret',
            AUTH_BASE_URL: 'https://auth.example.com',
            SITE_URL: 'https://blog.example.com',
            APP_NAME: '墨梅博客',
            EMAIL_REQUIRE_VERIFICATION: true,
            PHONE_EXPIRES_IN: 300,
            AUTH_CAPTCHA_PROVIDER: '',
            AUTH_CAPTCHA_SECRET_KEY: '',
            TEST_MODE: false,
        })
        getAuthLocaleFromRequestMock.mockReset()
        getAuthLocaleFromRequestMock.mockReturnValue('zh-Hant')
    })

    it('keeps generic OAuth anchored to env-locked auth config', async () => {
        const { config } = await importAuthModule()
        const genericOAuthPlugin = config.plugins.find((plugin) => plugin.name === 'genericOAuth')

        expect(typeormAdapterMock).toHaveBeenCalled()
        expect(config.baseURL).toBe('https://auth.example.com')
        expect(config.trustedOrigins).toEqual([
            'https://auth.example.com',
            'https://blog.example.com',
        ])
        expect(config.socialProviders).toEqual({
            github: {
                clientId: 'github-client-id',
                clientSecret: 'github-client-secret',
            },
            google: {
                clientId: 'google-client-id',
                clientSecret: 'google-client-secret',
            },
        })
        expect(genericOAuthPlugin).toEqual({
            name: 'genericOAuth',
            options: { config: [] },
        })
    })

    it('keeps auth locale fallback on the plugin boundary', async () => {
        const { config } = await importAuthModule()
        const localizationPlugin = config.plugins.find((plugin) => plugin.name === 'localization')
        const getLocale = localizationPlugin?.options?.getLocale as ((request?: Request) => string) | undefined

        expect(localizationPlugin?.options).toMatchObject({
            defaultLocale: 'zh-Hans',
            fallbackLocale: 'en-US',
        })
        expect(getLocale?.(new Request('https://example.com'))).toBe('zh-Hant')

        getAuthLocaleFromRequestMock.mockReturnValueOnce('en-US')
        expect(getLocale?.(new Request('https://example.com'))).toBe('en-US')

        getAuthLocaleFromRequestMock.mockImplementationOnce(() => {
            throw new Error('locale-drift')
        })
        expect(getLocale?.(new Request('https://example.com'))).toBe('en-US')
    })
})
