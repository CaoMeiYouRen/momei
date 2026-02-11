import logger from '../logger'
import { emailTemplateEngine } from './templates'
import { emailI18n } from './i18n'
import { sendEmail } from './index'
import { APP_NAME } from '@/utils/shared/env'

/**
 * 邮件验证服务
 * 所有方法都支持可选的 locale 参数用于国际化
 * 如果未提供 locale，默认使用 zh-CN
 */
export const emailService = {
    /**
     * 发送邮箱验证邮件（支持国际化）
     */
    async sendVerificationEmail(
        email: string,
        verificationUrl: string,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('verification', locale)
            if (!i18n) {
                throw new Error('Failed to load verification email template')
            }

            const params = {
                appName: APP_NAME,
            }

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    buttonText: i18n.buttonText,
                    actionUrl: verificationUrl,
                    reminderContent: emailI18n.replaceParameters(i18n.reminderContent, params),
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'verification', email })
        } catch (error) {
            logger.email.failed({
                type: 'verification',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送密码重置邮件（支持国际化）
     */
    async sendPasswordResetEmail(
        email: string,
        resetUrl: string,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('passwordReset', locale)
            if (!i18n) {
                throw new Error('Failed to load password reset email template')
            }

            const params = {
                appName: APP_NAME,
            }

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    buttonText: i18n.buttonText,
                    actionUrl: resetUrl,
                    reminderContent: emailI18n.replaceParameters(i18n.reminderContent, params),
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'password-reset', email })
        } catch (error) {
            logger.email.failed({
                type: 'password-reset',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送登录验证码邮件（支持国际化）
     */
    async sendLoginOTP(
        email: string,
        otp: string,
        expiresInMinutes: number = 5,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('loginOTP', locale)
            if (!i18n) {
                throw new Error('Failed to load login OTP email template')
            }

            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'login-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'login-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送邮箱验证码邮件（支持国际化）
     */
    async sendEmailVerificationOTP(
        email: string,
        otp: string,
        expiresInMinutes: number = 5,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('emailVerificationOTP', locale)
            if (!i18n) {
                throw new Error('Failed to load email verification OTP template')
            }

            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'email-verification-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'email-verification-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送密码重置验证码邮件（支持国际化）
     */
    async sendPasswordResetOTP(
        email: string,
        otp: string,
        expiresInMinutes: number = 5,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('passwordResetOTP', locale)
            if (!i18n) {
                throw new Error('Failed to load password reset OTP template')
            }

            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'password-reset-otp', email })
        } catch (error) {
            logger.email.failed({
                type: 'password-reset-otp',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送Magic Link邮件（支持国际化）
     */
    async sendMagicLink(email: string, magicUrl: string, locale?: string): Promise<void> {
        try {
            const i18n = emailI18n.getText('magicLink', locale)
            if (!i18n) {
                throw new Error('Failed to load magic link email template')
            }

            const params = {
                appName: APP_NAME,
            }

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    buttonText: i18n.buttonText,
                    actionUrl: magicUrl,
                    reminderContent: emailI18n.replaceParameters(i18n.reminderContent, params),
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'magic-link', email })
        } catch (error) {
            logger.email.failed({
                type: 'magic-link',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送邮箱更改验证邮件（支持国际化）
     */
    async sendEmailChangeVerification(
        currentEmail: string,
        newEmail: string,
        changeUrl: string,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('emailChangeVerification', locale)
            if (!i18n) {
                throw new Error('Failed to load email change verification template')
            }

            const params = {
                appName: APP_NAME,
            }

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    buttonText: i18n.buttonText,
                    actionUrl: changeUrl,
                    reminderContent: emailI18n.replaceParameters(i18n.reminderContent, params),
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: currentEmail,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'email-change', email: currentEmail })
        } catch (error) {
            logger.email.failed({
                type: 'email-change',
                email: currentEmail,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送账户安全通知邮件（支持国际化）
     */
    async sendSecurityNotification(
        email: string,
        action: string,
        details: string,
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('securityNotification', locale)
            if (!i18n) {
                throw new Error('Failed to load security notification template')
            }

            const params = {
                appName: APP_NAME,
            }

            const { html, text } = await emailTemplateEngine.generateSimpleMessageTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: `${emailI18n.replaceParameters(i18n.message, params)}<br/><br/><strong>${action}</strong>`,
                    extraInfo: details,
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'security-notification', email })
        } catch (error) {
            logger.email.failed({
                type: 'security-notification',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送订阅确认邮件（支持国际化）
     */
    async sendSubscriptionConfirmation(email: string, locale?: string): Promise<void> {
        try {
            const i18n = emailI18n.getText('subscriptionConfirmation', locale)
            if (!i18n) {
                throw new Error('Failed to load subscription confirmation template')
            }

            const params = {
                appName: APP_NAME,
            }

            const buttonText = 'buttonText' in i18n ? (i18n.buttonText as string) : '访问博客'

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: emailI18n.replaceParameters(i18n.message, params),
                    buttonText,
                    actionUrl: '/',
                    reminderContent: emailI18n.replaceParameters(i18n.reminderContent, params),
                    securityTip: emailI18n.replaceParameters(i18n.securityTip, params),
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'subscription-confirm', email })
        } catch (error) {
            logger.email.failed({
                type: 'subscription-confirm',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },

    /**
     * 发送营销/博客推送邮件（支持国际化）
     */
    async sendMarketingEmail(
        email: string,
        campaignData: {
            title: string
            summary: string
            articleTitle: string
            authorName: string
            categoryName: string
            publishDate: string
            actionUrl: string
        },
        locale?: string,
    ): Promise<void> {
        try {
            const i18n = emailI18n.getText('marketingCampaign', locale)
            if (!i18n) {
                return
            }

            const params = {
                appName: APP_NAME,
                ...campaignData,
            }

            const { html, text } = await emailTemplateEngine.generateMarketingEmailTemplate(
                {
                    headerIcon: i18n.headerIcon,
                    message: campaignData.summary,
                    articleTitle: campaignData.articleTitle,
                    authorLabel: i18n.author,
                    authorName: campaignData.authorName,
                    categoryLabel: i18n.category,
                    categoryName: campaignData.categoryName,
                    dateLabel: i18n.publishedAt,
                    publishDate: campaignData.publishDate,
                    buttonText: i18n.buttonText,
                    actionUrl: campaignData.actionUrl,
                },
                {
                    title: emailI18n.replaceParameters(i18n.title, params),
                    preheader: emailI18n.replaceParameters(i18n.preheader, params),
                },
            )

            await sendEmail({
                to: email,
                subject: emailI18n.replaceParameters(i18n.title, params),
                html,
                text,
            })

            logger.email.sent({ type: 'marketing-campaign', email })
        } catch (error) {
            logger.email.failed({
                type: 'marketing-campaign',
                email,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    },
}

