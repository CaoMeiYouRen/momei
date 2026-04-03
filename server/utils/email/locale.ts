import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import logger from '@/server/utils/logger'
import { loadLocaleMessages } from '@/server/utils/i18n'
import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import { resolveRequestedAppLocale } from '@/utils/shared/localized-settings'

export interface EmailShellMessages {
    locale: AppLocaleCode
    headerSubtitle: string
    greeting: string
    helpText: string
    contactLinkLabel: string
    privacyPolicyLabel: string
    termsLabel: string
    allRightsReserved: string
    autoFooterNote: string
    codeFooterNote: string
    marketingFooterNote: string
    verificationCodeTitle: string
    verificationCodeExpiry: string
    cannotClickButtonTitle: string
    cannotClickButtonHint: string
    importantReminderTitle: string
    securityTipTitle: string
}

function getNestedValue(obj: Record<string, any>, path: string): unknown {
    return path.split('.').reduce<any>((current, key) => current?.[key], obj) ?? null
}

export async function loadEmailShellMessages(locale?: string | null): Promise<EmailShellMessages> {
    const resolvedLocale = resolveRequestedAppLocale(locale)
    const messages = await loadLocaleMessages(resolvedLocale)
    const runtime = getNestedValue(
        messages,
        'pages.admin.settings.system.email_templates.runtime',
    ) as Partial<Record<string, string>> | null ?? {}

    return {
        locale: resolvedLocale,
        headerSubtitle: runtime.header_subtitle ?? '专业 · 高性能 · 国际化博客平台',
        greeting: runtime.greeting ?? '您好！',
        helpText: runtime.help_text ?? '需要帮助？联系我们的客服团队',
        contactLinkLabel: runtime.contact_link_label ?? '联系方式',
        privacyPolicyLabel: runtime.privacy_policy_label ?? '隐私政策',
        termsLabel: runtime.terms_label ?? '服务条款',
        allRightsReserved: runtime.all_rights_reserved ?? '保留所有权利。',
        autoFooterNote: runtime.auto_footer_note ?? '这是一封系统自动发送的邮件，请勿直接回复。',
        codeFooterNote: runtime.code_footer_note ?? '这是一封系统自动发送的验证码邮件，请勿直接回复。',
        marketingFooterNote: runtime.marketing_footer_note ?? '你收到此邮件是因为你订阅了我们的更新。',
        verificationCodeTitle: runtime.verification_code_title ?? '您的验证码',
        verificationCodeExpiry: runtime.verification_code_expiry ?? '请在 {expiresIn} 分钟内使用此验证码',
        cannotClickButtonTitle: runtime.cannot_click_button_title ?? '无法点击按钮？',
        cannotClickButtonHint: runtime.cannot_click_button_hint ?? '请复制以下链接到浏览器地址栏：',
        importantReminderTitle: runtime.important_reminder_title ?? '⚠️ 重要提醒：',
        securityTipTitle: runtime.security_tip_title ?? '🛡️ 安全提示',
    }
}

export async function resolvePreferredEmailLocale(options: {
    email?: string | null
    language?: string | null
}) {
    const normalizedLanguage = typeof options.language === 'string'
        ? options.language.trim()
        : ''

    if (normalizedLanguage) {
        return resolveRequestedAppLocale(normalizedLanguage)
    }

    const normalizedEmail = typeof options.email === 'string'
        ? options.email.trim().toLowerCase()
        : ''

    if (!normalizedEmail || !dataSource.isInitialized) {
        return undefined
    }

    try {
        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { email: normalizedEmail } })
        const userLanguage = typeof user?.language === 'string' ? user.language.trim() : ''

        return userLanguage ? resolveRequestedAppLocale(userLanguage) : undefined
    } catch (error) {
        logger.warn('Failed to resolve email locale from user profile', {
            email: normalizedEmail,
            error,
        })
        return undefined
    }
}
