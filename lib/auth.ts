import { betterAuth } from 'better-auth'
import {
    username,
    magicLink,
    emailOTP,
    openAPI,
    phoneNumber as $phoneNumber,
    admin,
    genericOAuth,
    jwt,
    twoFactor,
    captcha,
} from 'better-auth/plugins'
import { ms } from 'ms'
import { localization } from 'better-auth-localization'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { sendEmail } from '@/server/utils/email/index'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { usernameValidator, validatePhone } from '@/utils/shared/validate'
import { secondaryStorage } from '@/server/database/storage'
import {
    EMAIL_EXPIRES_IN,
    AUTH_SECRET,
    ADMIN_USER_IDS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    AUTH_BASE_URL,
    APP_NAME,
    EMAIL_REQUIRE_VERIFICATION,
    PHONE_EXPIRES_IN,
    AUTH_CAPTCHA_PROVIDER,
    AUTH_CAPTCHA_SECRET_KEY,
} from '@/utils/shared/env'
import { Subscriber } from '@/server/entities/subscriber'
import { User } from '@/server/entities/user'
import logger from '@/server/utils/logger'
import { getTempEmail, getTempName } from '@/server/utils/auth-generators'
import { emailService } from '@/server/utils/email/service'
import { getUserLocale } from '@/server/utils/locale'

export const auth = betterAuth({
    appName: APP_NAME, // 应用名称。它将被用作发行者。
    baseURL: AUTH_BASE_URL,
    // 数据库适配器
    // 使用 TypeORM 适配器
    database: typeormAdapter(dataSource),
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // 如果数据库中没有用户，则将第一个注册的用户设为管理员
                    try {
                        const userRepo = dataSource.getRepository(User)
                        const count = await userRepo.count()
                        if (count === 0) {
                            user.role = 'admin'
                            logger.info(
                                `First user registration: ${user.email} assigned role 'admin'`,
                            )
                        }
                    } catch (error) {
                        logger.error(
                            'Failed to check user count during registration:',
                            error,
                        )
                    }
                    return {
                        data: user,
                    }
                },
                after: async (user) => {
                    // 当新用户注册后，尝试回溯并关联订阅记录
                    try {
                        const subscriberRepo =
                            dataSource.getRepository(Subscriber)
                        const subscriber = await subscriberRepo.findOne({
                            where: { email: user.email },
                        })
                        if (subscriber) {
                            subscriber.userId = user.id
                            await subscriberRepo.save(subscriber)
                        }
                    } catch (error) {
                        console.error(
                            'Failed to link subscriber after user creation:',
                            error,
                        )
                    }
                },
            },
            update: {
                after: async (user) => {
                    // 当用户信息更新后，同步更新订阅者的语言偏好
                    try {
                        const subscriberRepo =
                            dataSource.getRepository(Subscriber)
                        const subscriber = await subscriberRepo.findOne({
                            where: { email: user.email },
                        })
                        if (subscriber && (user as any).language) {
                            subscriber.language = (user as any).language
                            await subscriberRepo.save(subscriber)
                        }
                    } catch (error) {
                        console.error(
                            'Failed to update subscriber language after user update:',
                            error,
                        )
                    }
                },
            },
        },
    },
    // 可信来源列表。
    trustedOrigins: [AUTH_BASE_URL].filter(Boolean),
    // 用于加密、签名和哈希的秘密。
    secret: AUTH_SECRET,
    advanced: {
        database: {
            // 自定义 ID 生成逻辑
            // 通过雪花算法 生成一个 16 进制的 ID
            generateId: () => snowflake.generateId(),
        },
    },
    rateLimit: {
        window: 60, // time window in seconds
        max: 60, // max requests in the window
        storage: secondaryStorage ? 'secondary-storage' : 'memory', // 如果配置了 Redis，则使用二级存储；否则使用内存存储
        customRules: {
            '/sign-in/*': { window: 60, max: 3 },
            '/email-otp/*': { window: 60, max: 3 },
            '/phone-number/*': { window: 60, max: 3 },
            '/sign-up/*': { window: 60, max: 3 },
            '/sign-out': { window: 60, max: 3 },
            '/magic-link': { window: 60, max: 3 },
            '/forget-password': { window: 60, max: 3 },
            '/forget-password/*': { window: 60, max: 3 },
            '/request-password-reset': { window: 60, max: 3 },
            '/reset-password': { window: 60, max: 3 },
            '/send-verification-email': { window: 60, max: 3 },
            '/change-email': { window: 60, max: 3 },
            '/delete-user': { window: 60, max: 2 },
            '/get-session': { window: 60, max: 10 },
            '/admin/*': { window: 60, max: 10 },
            '/two-factor/*': { window: 60, max: 3 },
            '/oauth2/*': { window: 60, max: 3 },
            // '/*': (req) => { // 基础限流
            //     return { window: 60, max: 10 }
            // },
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        maxPasswordLength: 64,
        requireEmailVerification: EMAIL_REQUIRE_VERIFICATION, // 是否要求邮箱验证。若启用，则用户必须在登录前验证他们的邮箱。仅在使用邮箱密码登录时生效。
        sendResetPassword: async ({ user, url }) => {
            await emailService.sendPasswordResetEmail(user.email, url)
        },
    },
    emailVerification: {
        sendOnSignUp: true, // 注册时发送验证邮件
        autoSignInAfterVerification: true, // 验证后自动登录
        // 发送验证邮件
        sendVerificationEmail: async ({ user, url }) => {
            await emailService.sendVerificationEmail(user.email, url)
        },
    },
    user: {
        additionalFields: {
            language: {
                type: 'string',
                required: false,
            },
            timezone: {
                type: 'string',
                required: false,
            },
        },
        changeEmail: {
            enabled: true, // 启用更改邮箱功能
            // 发送更改邮箱验证邮件
            sendChangeEmailVerification: async ({ user, newEmail, url }) => {
                await emailService.sendEmailChangeVerification(
                    user.email,
                    newEmail,
                    url,
                )
            },
        },
    },
    account: {
        accountLinking: {
            enabled: true, // 启用账户关联
            allowDifferentEmails: true, // 允许用户绑定不同邮箱地址的账号；允许不返回邮箱地址的第三方登录（微博、抖音等）
        },
    },
    socialProviders: {
        github: {
            // 支持 GitHub 登录
            clientId: GITHUB_CLIENT_ID as string,
            clientSecret: GITHUB_CLIENT_SECRET as string,
        },
        google: {
            // 支持 Google 登录
            clientId: GOOGLE_CLIENT_ID as string,
            clientSecret: GOOGLE_CLIENT_SECRET as string,
        },
    },
    session: {
        expiresIn: ms('30d') / 1000, // 30 天
        updateAge: ms('1d') / 1000, // 1 天（每 1 天更新会话过期时间）
        freshAge: ms('1d') / 1000, // 会话新鲜度
        // 当 cookie 的值太大时，会使缓存报错，故暂时禁用
        cookieCache: {
            enabled: true,
            maxAge: ms('1h') / 1000, // 缓存持续时间（秒）
            strategy: 'compact', // 使用紧凑策略以减少 cookie 大小
            refreshCache: true, // 启用默认设置的自动刷新（当达到最大年龄的80%时刷新）
        },
        storeSessionInDatabase: true, // 当提供辅助存储时，是否在数据库中存储会话
        preserveSessionInDatabase: false, // 当从辅助存储中删除时，是否保留数据库中的会话记录
    },
    plugins: [
        username({
            minUsernameLength: 2, // 最小用户名长度
            maxUsernameLength: 36, // 最大用户名长度
            usernameValidator,
            // displayUsernameValidator: usernameValidator,
            usernameNormalization: (name) => name.toLowerCase().trim(), // 用户名规范化函数
            // displayUsernameNormalization: (name) => name.trim(), // 用户名规范化函数
            validationOrder: {
                username: 'pre-normalization',
            },
        }), // 支持用户名登录
        // 移除匿名登录插件，目前没有相关需求
        // anonymous({
        //     // 支持匿名登录
        //     emailDomainName: ANONYMOUS_EMAIL_DOMAIN_NAME, // 匿名用户的默认电子邮件域名
        //     onLinkAccount: async () => {
        //         // 执行操作，如将购物车项目从匿名用户移动到新用户
        //         // console.log('Linking anonymous user to new user:', anonymousUser, newUser)
        //         // 手动将匿名用户的数据关联到新用户
        //     },
        // }),
        magicLink({
            expiresIn: EMAIL_EXPIRES_IN, // 链接有效期（秒）
            disableSignUp: false, // 当用户未注册时是否阻止自动注册
            // 支持一次性链接登录
            sendMagicLink: async ({ email, url }) => {
                await emailService.sendMagicLink(email, url)
            },
        }),
        emailOTP({
            disableSignUp: false, // 当用户未注册时是否阻止自动注册
            otpLength: 6, // OTP 验证码长度
            expiresIn: EMAIL_EXPIRES_IN, // OTP 验证码有效期（秒）
            allowedAttempts: 3, // 允许的 OTP 验证尝试次数
            sendVerificationOnSignUp: false, // 用户注册时是否发送 OTP。因为已经发送验证邮件，所以不需要再发送 OTP。
            // 支持电子邮件 OTP 登录
            async sendVerificationOTP({ email, otp, type }) {
                const expiresInMinutes = Math.floor(EMAIL_EXPIRES_IN / 60)

                if (type === 'sign-in') {
                    // 发送登录用的OTP
                    await emailService.sendLoginOTP(
                        email,
                        otp,
                        expiresInMinutes,
                    )
                    return
                }
                if (type === 'email-verification') {
                    // 发送电子邮件验证用的OTP
                    await emailService.sendEmailVerificationOTP(
                        email,
                        otp,
                        expiresInMinutes,
                    )
                    return
                }
                if (type === 'forget-password') {
                    // 发送密码重置用的OTP
                    await emailService.sendPasswordResetOTP(
                        email,
                        otp,
                        expiresInMinutes,
                    )
                    return
                }
                // 默认情况使用登录OTP
                await emailService.sendLoginOTP(email, otp, expiresInMinutes)
            },
        }),
        $phoneNumber({
            otpLength: 6, // OTP 验证码长度
            expiresIn: PHONE_EXPIRES_IN, // OTP 验证码有效期（秒）
            allowedAttempts: 3, // 允许的 OTP 验证尝试次数
            requireVerification: true, // 是否要求手机号码验证，启用后，用户在验证手机号码之前无法使用手机号码登录。
            sendOTP: async () => {
                throw new Error('未实现发送短信功能！')
            },
            callbackOnVerification: async () => {
                // 实现手机号码验证后的回调
            },
            // 验证手机号码格式
            phoneNumberValidator: (phoneNumber) => validatePhone(phoneNumber),
            signUpOnVerification: {
                // 使用随机算法生成临时电子邮件地址
                // 生成的电子邮件地址格式为：<random_id>@example.com
                getTempEmail: () => getTempEmail(),
                getTempName: () => getTempName(), // 使用随机算法生成临时用户名
            },
        }),
        admin({
            defaultRole: 'user', // 默认角色为用户
            adminRoles: ['admin'], // 管理员角色列表 'root'
            adminUserIds: ADMIN_USER_IDS, // 管理员用户 ID 列表
        }), // 支持管理员插件
        openAPI({
            disableDefaultReference: process.env.NODE_ENV !== 'development', // 开发环境启用 OpenAPI 插件
        }),
        twoFactor({
            issuer: APP_NAME, // 发行者是应用程序的名称。它用于生成 TOTP 代码。它将显示在认证器应用程序中。
            // skipVerificationOnEnable: false, // 在为用户启用两因素之前跳过验证过程
            totpOptions: {
                digits: 6, // 验证码位数
                period: 30, // 验证码有效期（秒）。采用默认值以兼容部分不支持设置有效期的认证器应用程序
            },
            otpOptions: {
                period: 60, // 验证码有效期（秒）
                async sendOTP(data) {
                    const { otp } = data
                    const user = data.user as User
                    // 向用户发送 otp
                    if (user.emailVerified) {
                        sendEmail({
                            to: user.email,
                            subject: '您的一次性验证码',
                            text: `您的验证码是：${otp}。1分钟内有效。如果您没有请求此验证码，请忽略此邮件。`,
                        })
                        return
                    }
                    throw new Error('用户未验证邮箱，无法发送一次性验证码')
                },
            },
            backupCodeOptions: {
                length: 10, // 备份码长度
                amount: 10, // 备份码数量
            },
        }),
        genericOAuth({
            config: [],
        }),

        jwt({
            jwks: {
                // 用于生成密钥对的算法
                keyPairConfig: {
                    alg: 'EdDSA',
                    cv: 'Ed25519',
                },
            },
        }), // 支持 JWT 认证

        localization({
            defaultLocale: 'zh-Hans', // 默认为简体中文
            fallbackLocale: 'default', // 回退到默认语言
            getLocale: (request) => {
                try {
                    const userLocale = request
                        ? getUserLocale(request)
                        : undefined
                    if (!userLocale || userLocale === 'en-US') {
                        return 'default'
                    }
                    return userLocale as 'default' | 'zh-Hans' | 'zh-Hant'
                } catch (error) {
                    console.warn('Error detecting locale:', error)
                    return 'default' // 安全回退
                }
            },
        }),
        ...(AUTH_CAPTCHA_PROVIDER && AUTH_CAPTCHA_SECRET_KEY
            ? [
                captcha({
                    provider: AUTH_CAPTCHA_PROVIDER as any,
                    secretKey: AUTH_CAPTCHA_SECRET_KEY!,
                    endpoints: [
                        '/sign-up/email',
                        '/sign-in/email',
                        '/forget-password/email-otp',
                        '/forget-password/send-link',
                    ],
                }),
            ]
            : []),
    ], // 动态插件配置
    ...(secondaryStorage ? { secondaryStorage } : {}),
})
