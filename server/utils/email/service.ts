import logger from '../logger'
import { plainTextToHtml } from '../html'
import { emailTemplateEngine } from './templates'
import { sendEmail } from './index'
import { resolveEmailTemplateRuntimeContent } from '@/server/services/email-template'
import type { EmailTemplateId } from '@/utils/shared/email-template-config'
import { APP_NAME } from '@/utils/shared/env'

type ResolvedEmailTemplate = Awaited<ReturnType<typeof resolveEmailTemplateRuntimeContent>>

interface SendGeneratedEmailOptions {
    email: string
    locale?: string
    templateId: EmailTemplateId
    logType: string
    params?: Record<string, unknown>
    render: (template: ResolvedEmailTemplate) => Promise<{ html: string, text: string }>
}

interface SendActionTemplateEmailOptions {
    email: string
    locale?: string
    templateId: EmailTemplateId
    logType: string
    actionUrl: string
    defaultButtonText?: string
    params?: Record<string, unknown>
    greeting?: string
}

interface SendCodeTemplateEmailOptions {
    email: string
    locale?: string
    templateId: EmailTemplateId
    logType: string
    otp: string
    expiresInMinutes: number
    params?: Record<string, unknown>
}

function getEmailErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

function createTemplateParams(params?: Record<string, unknown>) {
    return {
        appName: APP_NAME,
        ...(params ?? {}),
    }
}

async function sendGeneratedEmail(options: SendGeneratedEmailOptions): Promise<void> {
    try {
        const template = await resolveEmailTemplateRuntimeContent({
            templateId: options.templateId,
            locale: options.locale,
            params: createTemplateParams(options.params),
        })

        const { html, text } = await options.render(template)

        await sendEmail({
            to: options.email,
            subject: template.title,
            html,
            text,
        })

        logger.email.sent({ type: options.logType, email: options.email })
    } catch (error) {
        logger.email.failed({
            type: options.logType,
            email: options.email,
            error: getEmailErrorMessage(error),
        })
        throw error
    }
}

async function sendActionTemplateEmail(options: SendActionTemplateEmailOptions): Promise<void> {
    await sendGeneratedEmail({
        email: options.email,
        locale: options.locale,
        templateId: options.templateId,
        logType: options.logType,
        params: options.params,
        render: async (template) => emailTemplateEngine.generateActionEmailTemplate(
            {
                headerIcon: template.headerIcon,
                message: template.message,
                buttonText: template.buttonText ?? options.defaultButtonText ?? '',
                actionUrl: options.actionUrl,
                reminderContent: template.reminderContent ?? '',
                securityTip: template.securityTip ?? '',
            },
            {
                title: template.title,
                preheader: template.preheader,
                locale: options.locale,
                greeting: options.greeting,
            },
        ),
    })
}

async function sendCodeTemplateEmail(options: SendCodeTemplateEmailOptions): Promise<void> {
    await sendGeneratedEmail({
        email: options.email,
        locale: options.locale,
        templateId: options.templateId,
        logType: options.logType,
        params: options.params,
        render: async (template) => emailTemplateEngine.generateCodeEmailTemplate(
            {
                headerIcon: template.headerIcon,
                message: template.message,
                verificationCode: options.otp,
                expiresIn: options.expiresInMinutes,
                securityTip: template.securityTip ?? '',
            },
            {
                title: template.title,
                preheader: template.preheader,
                locale: options.locale,
            },
        ),
    })
}

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
        await sendActionTemplateEmail({
            email,
            locale,
            templateId: 'verification',
            logType: 'verification',
            actionUrl: verificationUrl,
        })
    },

    /**
     * 发送密码重置邮件（支持国际化）
     */
    async sendPasswordResetEmail(
        email: string,
        resetUrl: string,
        locale?: string,
    ): Promise<void> {
        await sendActionTemplateEmail({
            email,
            locale,
            templateId: 'passwordReset',
            logType: 'password-reset',
            actionUrl: resetUrl,
        })
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
        await sendCodeTemplateEmail({
            email,
            locale,
            templateId: 'loginOTP',
            logType: 'login-otp',
            otp,
            expiresInMinutes,
            params: {
                expiresIn: expiresInMinutes,
            },
        })
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
        await sendCodeTemplateEmail({
            email,
            locale,
            templateId: 'emailVerificationOTP',
            logType: 'email-verification-otp',
            otp,
            expiresInMinutes,
            params: {
                expiresIn: expiresInMinutes,
            },
        })
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
        await sendCodeTemplateEmail({
            email,
            locale,
            templateId: 'passwordResetOTP',
            logType: 'password-reset-otp',
            otp,
            expiresInMinutes,
            params: {
                expiresIn: expiresInMinutes,
            },
        })
    },

    /**
     * 发送Magic Link邮件（支持国际化）
     */
    async sendMagicLink(email: string, magicUrl: string, locale?: string): Promise<void> {
        await sendActionTemplateEmail({
            email,
            locale,
            templateId: 'magicLink',
            logType: 'magic-link',
            actionUrl: magicUrl,
        })
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
        void newEmail
        await sendActionTemplateEmail({
            email: currentEmail,
            locale,
            templateId: 'emailChangeVerification',
            logType: 'email-change',
            actionUrl: changeUrl,
        })
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
        await sendGeneratedEmail({
            email,
            locale,
            templateId: 'securityNotification',
            logType: 'security-notification',
            render: async (template) => emailTemplateEngine.generateSimpleMessageTemplate(
                {
                    headerIcon: template.headerIcon,
                    message: `${template.message}<br/><br/><strong>${action}</strong>`,
                    extraInfo: details,
                },
                {
                    title: template.title,
                    preheader: template.preheader,
                    locale,
                    greeting: '',
                },
            ),
        })
    },

    /**
     * 发送订阅确认邮件（支持国际化）
     */
    async sendSubscriptionConfirmation(email: string, locale?: string): Promise<void> {
        await sendActionTemplateEmail({
            email,
            locale,
            templateId: 'subscriptionConfirmation',
            logType: 'subscription-confirm',
            actionUrl: '/',
            defaultButtonText: '访问博客',
            greeting: '',
        })
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
        await sendGeneratedEmail({
            email,
            locale,
            templateId: 'marketingCampaign',
            logType: 'marketing-campaign',
            params: campaignData,
            render: async (template) => emailTemplateEngine.generateMarketingEmailTemplate(
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
                    locale,
                    greeting: '',
                },
            ),
        })
    },
}
