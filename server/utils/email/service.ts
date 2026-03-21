import logger from '../logger'
import { plainTextToHtml } from '../html'
import { emailTemplateEngine } from './templates'
import { sendEmail } from './index'
import { resolveEmailTemplateRuntimeContent } from '@/server/services/email-template'
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'verification',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    buttonText: template.buttonText ?? '',
                    actionUrl: verificationUrl,
                    reminderContent: template.reminderContent ?? '',
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'passwordReset',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    buttonText: template.buttonText ?? '',
                    actionUrl: resetUrl,
                    reminderContent: template.reminderContent ?? '',
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'loginOTP',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'emailVerificationOTP',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
                expiresIn: expiresInMinutes,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'passwordResetOTP',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateCodeEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    verificationCode: otp,
                    expiresIn: expiresInMinutes,
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'magicLink',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    buttonText: template.buttonText ?? '',
                    actionUrl: magicUrl,
                    reminderContent: template.reminderContent ?? '',
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'emailChangeVerification',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    buttonText: template.buttonText ?? '',
                    actionUrl: changeUrl,
                    reminderContent: template.reminderContent ?? '',
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: currentEmail,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'securityNotification',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateSimpleMessageTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: `${template.message}<br/><br/><strong>${action}</strong>`,
                    extraInfo: details,
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'subscriptionConfirmation',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateActionEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: template.message,
                    buttonText: template.buttonText ?? '访问博客',
                    actionUrl: '/',
                    reminderContent: template.reminderContent ?? '',
                    securityTip: template.securityTip ?? '',
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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
            const params = {
                appName: APP_NAME,
                ...campaignData,
            }
            const template = await resolveEmailTemplateRuntimeContent({
                templateId: 'marketingCampaign',
                locale,
                params,
            })

            const { html, text } = await emailTemplateEngine.generateMarketingEmailTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: plainTextToHtml(campaignData.summary),
                    articleTitle: campaignData.articleTitle,
                    authorLabel: template.authorLabel ?? '',
                    authorName: campaignData.authorName,
                    categoryLabel: template.categoryLabel ?? '',
                    categoryName: campaignData.categoryName,
                    dateLabel: template.dateLabel ?? '',
                    publishDate: campaignData.publishDate,
                    buttonText: template.buttonText ?? '',
                    actionUrl: campaignData.actionUrl,
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                },
            )

            await sendEmail({
                to: email,
                subject: template.title,
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

