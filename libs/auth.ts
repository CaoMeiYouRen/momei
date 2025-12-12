import { betterAuth } from 'better-auth'
import {
    username,
    anonymous,
    magicLink,
    emailOTP,
    openAPI,
    phoneNumber as $phoneNumber,
    admin,
    captcha,
    genericOAuth,
    twoFactor,
    jwt,
} from 'better-auth/plugins'
import { ms } from 'ms'
import { localization } from 'better-auth-localization'
import { typeormAdapter } from '@/server/database/typeorm-adapter'
import { snowflake } from '@/server/utils/snowflake'
import { dataSource } from '@/server/database'
import { secondaryStorage } from '@/server/database/storage'
import {
    AUTH_SECRET,
    AUTH_BASE_URL,
    APP_NAME,
} from '@/utils/shared/env'
import type { User } from '@/server/entities/user'


export const auth = betterAuth({
    appName: APP_NAME, // 应用名称。它将被用作发行者。
    // 数据库适配器
    // 使用 TypeORM 适配器
    database: typeormAdapter(dataSource),
    // 可信来源列表。
    trustedOrigins: [AUTH_BASE_URL],
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
})
