import { beforeEach, describe, expect, it, vi } from 'vitest'

interface MockPlugin {
    name: string
    options?: Record<string, unknown>
}

interface CapturedAuthConfig {
    baseURL: string
    trustedOrigins: string[]
    socialProviders: Record<string, { clientId: string, clientSecret: string }>
    rateLimit: {
        customRules: Record<string, { window: number, max: number }>
    }
    emailAndPassword: {
        requireEmailVerification: boolean
        sendResetPassword: (options: { user: { email: string, language?: string }, url: string }) => Promise<void>
    }
    emailVerification: {
        sendOnSignUp: boolean
        sendVerificationEmail: (options: { user: { email: string, language?: string }, url: string }) => Promise<void>
    }
    user: {
        changeEmail: {
            sendChangeEmailVerification: (options: {
                user: { email: string, language?: string }
                newEmail: string
                url: string
            }) => Promise<void>
        }
    }
    databaseHooks: {
        user: {
            create: {
                before: (user: { email: string, role?: string }) => Promise<{ data: { email: string, role?: string } }>
                after: (user: { id: string, email: string, language?: string }) => Promise<void>
            }
            update: {
                after: (user: { email: string, language?: string }) => Promise<void>
            }
        }
    }
    plugins: MockPlugin[]
}

interface MagicLinkPluginOptions {
    sendMagicLink: (payload: { email: string, url: string }, ctx?: { request?: Request }) => Promise<void>
}

interface EmailOtpPluginOptions {
    sendVerificationOTP: (payload: { email: string, otp: string, type: string }, ctx?: { request?: Request }) => Promise<void>
}

interface PhoneNumberPluginOptions {
    callbackOnVerification: () => Promise<void>
    phoneNumberValidator: (phoneNumber: string) => boolean
    signUpOnVerification: {
        getTempEmail: () => string
        getTempName: () => string
    }
}

interface TwoFactorPluginOptions {
    otpOptions: {
        sendOTP: (payload: { otp: string, user: { email: string, emailVerified: boolean } }) => Promise<void>
    }
}

const {
    betterAuthMock,
    typeormAdapterMock,
    getAuthLocaleFromRequestMock,
    resolvePreferredEmailLocaleMock,
    markAgreementConsentForLocaleMock,
    sendEmailMock,
    loggerInfoMock,
    loggerErrorMock,
    getTempEmailMock,
    getTempNameMock,
    emailServiceMock,
    envState,
    pluginFactories,
    mockEntities,
    repositoryMocks,
    getRepositoryMock,
} = vi.hoisted(() => {
    const createPluginFactory = (name: string) => vi.fn((options?: Record<string, unknown>) => ({
        name,
        options,
    }))

    const createRepositoryMock = () => ({
        count: vi.fn(() => Promise.resolve(1)),
        findOne: vi.fn(() => Promise.resolve(null)),
        save: vi.fn(() => Promise.resolve(null)),
    })

    const hoistedMockEntities = {
        Subscriber: class Subscriber {},
        User: class User {},
    }

    const hoistedRepositoryMocks = {
        user: createRepositoryMock(),
        subscriber: createRepositoryMock(),
    }

    const resolveRepositoryMock = vi.fn((entity: unknown) => entity === hoistedMockEntities.User
        ? hoistedRepositoryMocks.user
        : hoistedRepositoryMocks.subscriber)

    return {
        betterAuthMock: vi.fn((options: Record<string, unknown>) => ({ options })),
        typeormAdapterMock: vi.fn(() => ({ adapter: 'typeorm' })),
        getAuthLocaleFromRequestMock: vi.fn(() => 'zh-Hant'),
        resolvePreferredEmailLocaleMock: vi.fn(() => Promise.resolve('zh-CN')),
        markAgreementConsentForLocaleMock: vi.fn(),
        sendEmailMock: vi.fn(),
        loggerInfoMock: vi.fn(),
        loggerErrorMock: vi.fn(),
        getTempEmailMock: vi.fn(() => 'temp@example.com'),
        getTempNameMock: vi.fn(() => 'temp-user'),
        emailServiceMock: {
            sendPasswordResetEmail: vi.fn(),
            sendVerificationEmail: vi.fn(),
            sendEmailChangeVerification: vi.fn(),
            sendMagicLink: vi.fn(),
            sendLoginOTP: vi.fn(),
            sendEmailVerificationOTP: vi.fn(),
            sendPasswordResetOTP: vi.fn(),
        },
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
        mockEntities: hoistedMockEntities,
        repositoryMocks: hoistedRepositoryMocks,
        getRepositoryMock: resolveRepositoryMock,
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
    sendEmail: sendEmailMock,
}))

vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(() => 'snowflake-id'),
    },
}))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: getRepositoryMock,
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
    Subscriber: mockEntities.Subscriber,
}))

vi.mock('@/server/entities/user', () => ({
    User: mockEntities.User,
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: loggerInfoMock,
        error: loggerErrorMock,
    },
}))

vi.mock('@/server/services/agreement', () => ({
    markAgreementConsentForLocale: markAgreementConsentForLocaleMock,
}))

vi.mock('@/server/utils/auth-generators', () => ({
    getTempEmail: getTempEmailMock,
    getTempName: getTempNameMock,
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: emailServiceMock,
}))

vi.mock('@/server/utils/email/locale', () => ({
    resolvePreferredEmailLocale: resolvePreferredEmailLocaleMock,
}))

vi.mock('@/server/utils/locale', () => ({
    AUTH_PLUGIN_DEFAULT_LOCALE: 'zh-Hans',
    AUTH_PLUGIN_FALLBACK_LOCALE: 'en-US',
    getAuthLocaleFromRequest: getAuthLocaleFromRequestMock,
}))

async function importAuthModule() {
    vi.resetModules()
    const module = await import('./auth')
    const config = betterAuthMock.mock.calls.at(-1)?.[0] as CapturedAuthConfig

    return {
        module,
        config,
    }
}

function getPluginOptions(config: CapturedAuthConfig, pluginName: string) {
    const plugin = config.plugins.find((currentPlugin) => currentPlugin.name === pluginName)
    expect(plugin).toBeDefined()
    return plugin?.options ?? {}
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
        resolvePreferredEmailLocaleMock.mockReset()
        resolvePreferredEmailLocaleMock.mockResolvedValue('zh-CN')
        markAgreementConsentForLocaleMock.mockReset()
        sendEmailMock.mockReset()
        loggerInfoMock.mockReset()
        loggerErrorMock.mockReset()
        getTempEmailMock.mockReset()
        getTempEmailMock.mockReturnValue('temp@example.com')
        getTempNameMock.mockReset()
        getTempNameMock.mockReturnValue('temp-user')
        emailServiceMock.sendPasswordResetEmail.mockReset()
        emailServiceMock.sendVerificationEmail.mockReset()
        emailServiceMock.sendEmailChangeVerification.mockReset()
        emailServiceMock.sendMagicLink.mockReset()
        emailServiceMock.sendLoginOTP.mockReset()
        emailServiceMock.sendEmailVerificationOTP.mockReset()
        emailServiceMock.sendPasswordResetOTP.mockReset()
        repositoryMocks.user.count.mockReset()
        repositoryMocks.user.count.mockResolvedValue(1)
        repositoryMocks.user.findOne.mockReset()
        repositoryMocks.user.findOne.mockResolvedValue(null)
        repositoryMocks.user.save.mockReset()
        repositoryMocks.user.save.mockResolvedValue(null)
        repositoryMocks.subscriber.count.mockReset()
        repositoryMocks.subscriber.count.mockResolvedValue(0)
        repositoryMocks.subscriber.findOne.mockReset()
        repositoryMocks.subscriber.findOne.mockResolvedValue(null)
        repositoryMocks.subscriber.save.mockReset()
        repositoryMocks.subscriber.save.mockResolvedValue(null)
        getRepositoryMock.mockClear()
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

    it('falls back to test-safe auth origins when env-locked auth config degrades', async () => {
        Object.assign(envState, {
            AUTH_BASE_URL: '',
            SITE_URL: '',
            GITHUB_CLIENT_ID: 'github-client-id',
            GITHUB_CLIENT_SECRET: '',
            GOOGLE_CLIENT_ID: '',
            GOOGLE_CLIENT_SECRET: '',
            TEST_MODE: true,
        })

        const { config } = await importAuthModule()

        expect(config.baseURL).toBe('http://localhost:3001')
        expect(config.trustedOrigins).toEqual([
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
        ])
        expect(config.socialProviders).toEqual({})
        expect(config.rateLimit.customRules).toEqual({})
        expect(config.emailAndPassword.requireEmailVerification).toBe(false)
        expect(config.emailVerification.sendOnSignUp).toBe(false)

        await config.emailVerification.sendVerificationEmail({
            user: { email: 'test-mode@example.com' },
            url: 'https://auth.example.com/verify',
        })

        expect(emailServiceMock.sendVerificationEmail).not.toHaveBeenCalled()
    })

    it('routes locale-aware auth mail callbacks to their dedicated handlers', async () => {
        resolvePreferredEmailLocaleMock.mockImplementation((options: { language?: unknown }) => Promise.resolve(
            typeof options.language === 'string'
                ? options.language
                : 'en-US',
        ))

        const { config } = await importAuthModule()
        const magicLinkOptions = getPluginOptions(config, 'magicLink') as MagicLinkPluginOptions

        await config.emailAndPassword.sendResetPassword({
            user: {
                email: 'reset@example.com',
                language: 'ja-JP',
            },
            url: 'https://auth.example.com/reset',
        })
        await config.emailVerification.sendVerificationEmail({
            user: {
                email: 'verify@example.com',
            },
            url: 'https://auth.example.com/verify',
        })
        await config.user.changeEmail.sendChangeEmailVerification({
            user: {
                email: 'current@example.com',
                language: '   ',
            },
            newEmail: 'next@example.com',
            url: 'https://auth.example.com/change-email',
        })
        await magicLinkOptions.sendMagicLink(
            {
                email: 'magic@example.com',
                url: 'https://auth.example.com/magic-link',
            },
            { request: new Request('https://auth.example.com/magic-link') },
        )

        expect(resolvePreferredEmailLocaleMock).toHaveBeenNthCalledWith(1, {
            email: 'reset@example.com',
            language: 'ja-JP',
        })
        expect(resolvePreferredEmailLocaleMock).toHaveBeenNthCalledWith(2, {
            email: 'verify@example.com',
            language: undefined,
        })
        expect(resolvePreferredEmailLocaleMock).toHaveBeenNthCalledWith(3, {
            email: 'current@example.com',
            language: undefined,
        })
        expect(resolvePreferredEmailLocaleMock).toHaveBeenNthCalledWith(4, {
            email: 'magic@example.com',
            language: 'zh-Hant',
        })
        expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
            'reset@example.com',
            'https://auth.example.com/reset',
            'ja-JP',
        )
        expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
            'verify@example.com',
            'https://auth.example.com/verify',
            'en-US',
        )
        expect(emailServiceMock.sendEmailChangeVerification).toHaveBeenCalledWith(
            'current@example.com',
            'next@example.com',
            'https://auth.example.com/change-email',
            'en-US',
        )
        expect(emailServiceMock.sendMagicLink).toHaveBeenCalledWith(
            'magic@example.com',
            'https://auth.example.com/magic-link',
            'zh-Hant',
        )
    })

    it('dispatches OTP and phone verification callbacks without leaking to the wrong handler', async () => {
        resolvePreferredEmailLocaleMock.mockImplementation((options: { language?: unknown }) => Promise.resolve(
            typeof options.language === 'string'
                ? options.language
                : 'en-US',
        ))

        const { config } = await importAuthModule()
        const emailOtpOptions = getPluginOptions(config, 'emailOTP') as EmailOtpPluginOptions
        const phoneNumberOptions = getPluginOptions(config, 'phoneNumber') as PhoneNumberPluginOptions
        const twoFactorOptions = getPluginOptions(config, 'twoFactor') as TwoFactorPluginOptions

        await emailOtpOptions.sendVerificationOTP(
            {
                email: 'otp@example.com',
                otp: '123456',
                type: 'sign-in',
            },
            { request: new Request('https://auth.example.com/email-otp') },
        )
        await emailOtpOptions.sendVerificationOTP(
            {
                email: 'otp@example.com',
                otp: '123456',
                type: 'email-verification',
            },
            { request: new Request('https://auth.example.com/email-otp') },
        )
        await emailOtpOptions.sendVerificationOTP(
            {
                email: 'otp@example.com',
                otp: '123456',
                type: 'forget-password',
            },
            { request: new Request('https://auth.example.com/email-otp') },
        )
        await emailOtpOptions.sendVerificationOTP({
            email: 'otp@example.com',
            otp: '654321',
            type: 'unexpected',
        })

        expect(phoneNumberOptions.phoneNumberValidator('18800001111')).toBe(true)
        await expect(phoneNumberOptions.callbackOnVerification()).resolves.toBeUndefined()
        expect(phoneNumberOptions.signUpOnVerification.getTempEmail()).toBe('temp@example.com')
        expect(phoneNumberOptions.signUpOnVerification.getTempName()).toBe('temp-user')

        await twoFactorOptions.otpOptions.sendOTP({
            otp: '654321',
            user: {
                email: 'verified@example.com',
                emailVerified: true,
            },
        })

        await expect(twoFactorOptions.otpOptions.sendOTP({
            otp: '654321',
            user: {
                email: 'pending@example.com',
                emailVerified: false,
            },
        })).rejects.toThrow('用户未验证邮箱，无法发送一次性验证码')

        expect(emailServiceMock.sendLoginOTP).toHaveBeenNthCalledWith(
            1,
            'otp@example.com',
            '123456',
            15,
            'zh-Hant',
        )
        expect(emailServiceMock.sendEmailVerificationOTP).toHaveBeenCalledWith(
            'otp@example.com',
            '123456',
            15,
            'zh-Hant',
        )
        expect(emailServiceMock.sendPasswordResetOTP).toHaveBeenCalledWith(
            'otp@example.com',
            '123456',
            15,
            'zh-Hant',
        )
        expect(emailServiceMock.sendLoginOTP).toHaveBeenNthCalledWith(
            2,
            'otp@example.com',
            '654321',
            15,
            'en-US',
        )
        expect(getTempEmailMock).toHaveBeenCalledTimes(1)
        expect(getTempNameMock).toHaveBeenCalledTimes(1)
        expect(sendEmailMock).toHaveBeenCalledWith({
            to: 'verified@example.com',
            subject: '您的一次性验证码',
            text: '您的验证码是：654321。1分钟内有效。如果您没有请求此验证码，请忽略此邮件。',
        })
    })

    it('keeps database hooks fail-safe while bootstrapping and syncing subscribers', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        try {
            repositoryMocks.user.count.mockResolvedValueOnce(0)
            repositoryMocks.subscriber.findOne.mockResolvedValueOnce({
                email: 'user@example.com',
                userId: null,
            })
            repositoryMocks.subscriber.findOne.mockResolvedValueOnce({
                email: 'user@example.com',
                language: 'zh-CN',
            })

            const { config } = await importAuthModule()
            const createdUser = {
                id: 'user-1',
                email: 'user@example.com',
                language: 'ko-KR',
            }

            const beforeResult = await config.databaseHooks.user.create.before(createdUser)

            expect(beforeResult.data.role).toBe('admin')
            expect(loggerInfoMock).toHaveBeenCalledWith(
                expect.stringContaining('assigned role \'admin\''),
            )

            await config.databaseHooks.user.create.after(createdUser)
            await config.databaseHooks.user.update.after({
                email: 'user@example.com',
                language: 'en-US',
            })

            expect(repositoryMocks.subscriber.save).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ userId: 'user-1' }),
            )
            expect(repositoryMocks.subscriber.save).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ language: 'en-US' }),
            )
            expect(markAgreementConsentForLocaleMock).toHaveBeenCalledWith('ko-KR')

            repositoryMocks.user.count.mockRejectedValueOnce(new Error('count-failed'))
            repositoryMocks.subscriber.findOne.mockRejectedValueOnce(new Error('link-failed'))
            repositoryMocks.subscriber.findOne.mockRejectedValueOnce(new Error('sync-failed'))

            await expect(config.databaseHooks.user.create.before({
                email: 'broken@example.com',
            })).resolves.toMatchObject({
                data: {
                    email: 'broken@example.com',
                },
            })
            await expect(config.databaseHooks.user.create.after({
                id: 'broken-user',
                email: 'broken@example.com',
            })).resolves.toBeUndefined()
            await expect(config.databaseHooks.user.update.after({
                email: 'broken@example.com',
                language: 'zh-CN',
            })).resolves.toBeUndefined()

            expect(loggerErrorMock).toHaveBeenCalledWith(
                'Failed to check user count during registration:',
                expect.any(Error),
            )
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to link subscriber after user creation:',
                expect.any(Error),
            )
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to update subscriber language after user update:',
                expect.any(Error),
            )
        } finally {
            consoleErrorSpy.mockRestore()
        }
    })
})
