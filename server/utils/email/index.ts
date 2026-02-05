import type { Transporter } from 'nodemailer'
import logger from '../logger'
import { createDefaultMailer, type MailerFactory } from './factory'
import { limiterStorage } from '@/server/database/storage'
import {
    EMAIL_FROM,
} from '@/utils/shared/env'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

const EMAIL_LIMIT_KEY = 'email_global_limit'

type LimiterStorage = typeof limiterStorage
type EmailLogger = typeof logger

export interface EmailOptions {
    /**
     * 发件人地址，默认为环境变量 EMAIL_FROM
     */
    from?: string
    /**
     * 收件人地址，必填
     */
    to: string
    /**
     * 邮件主题，必填
     */
    subject: string
    /**
     * 纯文本格式的邮件内容
     * 如果提供了 html，则 text 会被忽略
     */
    text?: string
    /**
     * HTML 格式的邮件内容
     * 如果提供了 html，则 text 会被忽略
     */
    html?: string
}

let mailerFactory: MailerFactory = createDefaultMailer
let limiter: LimiterStorage = limiterStorage
let emailLogger: EmailLogger = logger
let cachedTransporter: Transporter | null = null
let transporterVerified = false

export function injectEmailDeps(deps: {
    createMailer?: MailerFactory
    limiter?: LimiterStorage
    logger?: EmailLogger
} = {}) {
    if (deps.createMailer) {
        mailerFactory = deps.createMailer
        cachedTransporter = null
        transporterVerified = false
    }
    if (deps.limiter) {
        limiter = deps.limiter
    }
    if (deps.logger) {
        emailLogger = deps.logger
    }
}

export function resetEmailDeps() {
    mailerFactory = createDefaultMailer
    limiter = limiterStorage
    emailLogger = logger
    cachedTransporter = null
    transporterVerified = false
}

async function getTransporter() {
    if (!cachedTransporter) {
        // 只有使用默认工厂时才尝试从数据库读取配置
        if (mailerFactory === createDefaultMailer) {
            const dbSettings = await getSettings([
                SettingKey.EMAIL_HOST,
                SettingKey.EMAIL_PORT,
                SettingKey.EMAIL_USER,
                SettingKey.EMAIL_PASS,
                SettingKey.EMAIL_FROM,
            ])

            if (dbSettings[SettingKey.EMAIL_HOST] && dbSettings[SettingKey.EMAIL_USER]) {
                cachedTransporter = mailerFactory({
                    host: dbSettings[SettingKey.EMAIL_HOST],
                    port: Number(dbSettings[SettingKey.EMAIL_PORT] || 587),
                    auth: {
                        user: dbSettings[SettingKey.EMAIL_USER],
                        pass: dbSettings[SettingKey.EMAIL_PASS] || '',
                    },
                })
            } else {
                cachedTransporter = mailerFactory()
            }
        } else {
            cachedTransporter = mailerFactory()
        }
        transporterVerified = false
    }

    if (!transporterVerified && cachedTransporter) {
        try {
            const verified = await cachedTransporter.verify()
            if (!verified) {
                emailLogger.error('Email transporter verification failed')
                throw new Error('Email transporter configuration is invalid')
            }
            transporterVerified = true
        } catch (error) {
            emailLogger.error('Email transporter verification error', error)
            throw error
        }
    }

    return cachedTransporter
}

async function ensureWithinLimit(options: EmailOptions) {
    const dbSettings = await getSettings([
        SettingKey.EMAIL_DAILY_LIMIT,
        SettingKey.EMAIL_SINGLE_USER_DAILY_LIMIT,
        SettingKey.EMAIL_LIMIT_WINDOW,
    ])

    const limitWindow = Number(dbSettings[SettingKey.EMAIL_LIMIT_WINDOW] || 86400)
    const dailyLimit = Number(dbSettings[SettingKey.EMAIL_DAILY_LIMIT] || 100)
    const userDailyLimit = Number(dbSettings[SettingKey.EMAIL_SINGLE_USER_DAILY_LIMIT] || 5)

    const globalCount = await limiter.increment(
        EMAIL_LIMIT_KEY,
        limitWindow,
    )
    if (globalCount > dailyLimit) {
        emailLogger.email.rateLimited({
            limitType: 'global',
            email: options.to,
            remainingTime: limitWindow,
        })
        throw new Error('今日邮箱发送次数已达全局上限')
    }

    const singleUserLimitKey = `email_single_user_limit:${options.to}`
    const singleUserCount = await limiter.increment(
        singleUserLimitKey,
        limitWindow,
    )
    if (singleUserCount > userDailyLimit) {
        emailLogger.email.rateLimited({
            limitType: 'user',
            email: options.to,
            remainingTime: limitWindow,
        })
        throw new Error('您的邮箱今日发送次数已达上限')
    }
}

export async function sendEmail(options: EmailOptions) {
    try {
        await ensureWithinLimit(options)

        const transporter = await getTransporter()

        if (!transporter) {
            emailLogger.warn('Email configuration is missing. Skipping email sending.', {
                to: options.to,
                subject: options.subject,
            })
            return { messageId: 'skipped-no-config' }
        }

        const mailOptions = {
            from: options.from || EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        }

        const result = await transporter.sendMail(mailOptions)

        emailLogger.email.sent({
            type: 'general',
            email: options.to,
            success: true,
        })

        return result
    } catch (error) {
        // 如果是连接错误，且可能是配置无效导致的，记录警告并跳过
        // if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('configuration is invalid'))) {
        //     emailLogger.warn('Email sending skipped due to connection error or invalid config', {
        //         error: error.message,
        //         to: options.to,
        //     })
        //     return { messageId: 'skipped-connection-error' }
        // }

        emailLogger.email.failed({
            type: 'general',
            email: options.to,
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    }
}
