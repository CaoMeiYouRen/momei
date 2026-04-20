import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import logger from '@/server/utils/logger'
import { loadLocaleMessages } from '@/server/utils/i18n'
import type { AppLocaleCode } from '@/i18n/config/locale-registry'
import { resolveRequestedAppLocale } from '@/utils/shared/localized-settings'

const EMAIL_SHELL_FALLBACKS: Record<AppLocaleCode, Omit<EmailShellMessages, 'locale'>> = {
    'zh-CN': {
        headerSubtitle: '专业 · 高性能 · 国际化博客平台',
        greeting: '您好！',
        helpText: '需要帮助？联系我们的客服团队',
        contactLinkLabel: '联系方式',
        privacyPolicyLabel: '隐私政策',
        termsLabel: '服务条款',
        allRightsReserved: '保留所有权利。',
        autoFooterNote: '这是一封系统自动发送的邮件，请勿直接回复。',
        codeFooterNote: '这是一封系统自动发送的验证码邮件，请勿直接回复。',
        marketingFooterNote: '你收到此邮件是因为你订阅了我们的更新。',
        verificationCodeTitle: '您的验证码',
        verificationCodeExpiry: '请在 {expiresIn} 分钟内使用此验证码',
        cannotClickButtonTitle: '无法点击按钮？',
        cannotClickButtonHint: '请复制以下链接到浏览器地址栏：',
        importantReminderTitle: '⚠️ 重要提醒：',
        securityTipTitle: '🛡️ 安全提示',
    },
    'en-US': {
        headerSubtitle: 'Professional · High-Performance · Internationalized Blogging Platform',
        greeting: 'Hello,',
        helpText: 'Need help? Contact our support team',
        contactLinkLabel: 'Contact',
        privacyPolicyLabel: 'Privacy Policy',
        termsLabel: 'Terms of Service',
        allRightsReserved: 'All rights reserved.',
        autoFooterNote: 'This is an automated email from the system. Please do not reply directly.',
        codeFooterNote: 'This is an automated verification email from the system. Please do not reply directly.',
        marketingFooterNote: 'You received this email because you subscribed to our updates.',
        verificationCodeTitle: 'Your Verification Code',
        verificationCodeExpiry: 'Please use this verification code within {expiresIn} minutes',
        cannotClickButtonTitle: 'Can\'t click the button?',
        cannotClickButtonHint: 'Copy and paste the following link into your browser address bar:',
        importantReminderTitle: '⚠️ Important Reminder:',
        securityTipTitle: '🛡️ Security Tips',
    },
    'zh-TW': {
        headerSubtitle: '專業 · 高效能 · 國際化部落格平台',
        greeting: '您好！',
        helpText: '需要幫助？請聯絡我們的客服團隊',
        contactLinkLabel: '聯絡方式',
        privacyPolicyLabel: '隱私政策',
        termsLabel: '服務條款',
        allRightsReserved: '保留所有權利。',
        autoFooterNote: '這是一封系統自動發送的郵件，請勿直接回覆。',
        codeFooterNote: '這是一封系統自動發送的驗證碼郵件，請勿直接回覆。',
        marketingFooterNote: '您收到此郵件是因為您訂閱了我們的更新。',
        verificationCodeTitle: '您的驗證碼',
        verificationCodeExpiry: '請在 {expiresIn} 分鐘內使用此驗證碼',
        cannotClickButtonTitle: '無法點擊按鈕？',
        cannotClickButtonHint: '請複製以下連結到瀏覽器網址列：',
        importantReminderTitle: '⚠️ 重要提醒：',
        securityTipTitle: '🛡️ 安全提示',
    },
    'ko-KR': {
        headerSubtitle: '전문적 · 고성능 · 다국어 블로그 플랫폼',
        greeting: '안녕하세요!',
        helpText: '도움이 필요하신가요? 지원팀에 문의해 주세요',
        contactLinkLabel: '문의하기',
        privacyPolicyLabel: '개인정보 처리방침',
        termsLabel: '이용약관',
        allRightsReserved: '판권 소유.',
        autoFooterNote: '이 메일은 시스템에서 자동 발송되었습니다. 직접 회신하지 마세요.',
        codeFooterNote: '이 메일은 시스템에서 자동 발송된 인증 메일입니다. 직접 회신하지 마세요.',
        marketingFooterNote: '업데이트를 구독하셨기 때문에 이 메일을 받으셨습니다.',
        verificationCodeTitle: '인증 코드',
        verificationCodeExpiry: '{expiresIn}분 이내에 이 인증 코드를 사용해 주세요',
        cannotClickButtonTitle: '버튼을 클릭할 수 없나요?',
        cannotClickButtonHint: '다음 링크를 브라우저 주소창에 복사해 붙여넣어 주세요:',
        importantReminderTitle: '⚠️ 중요 안내:',
        securityTipTitle: '🛡️ 보안 팁',
    },
    'ja-JP': {
        headerSubtitle: 'プロフェッショナル・高性能・多言語対応ブログプラットフォーム',
        greeting: 'こんにちは。',
        helpText: 'お困りの場合はサポートチームまでご連絡ください',
        contactLinkLabel: 'お問い合わせ',
        privacyPolicyLabel: 'プライバシーポリシー',
        termsLabel: '利用規約',
        allRightsReserved: 'All rights reserved.',
        autoFooterNote: 'このメールはシステムから自動送信されています。直接返信しないでください。',
        codeFooterNote: 'このメールはシステムから自動送信された認証メールです。直接返信しないでください。',
        marketingFooterNote: '更新情報を購読しているため、このメールを受信しています。',
        verificationCodeTitle: '認証コード',
        verificationCodeExpiry: '{expiresIn} 分以内にこの認証コードをご利用ください',
        cannotClickButtonTitle: 'ボタンをクリックできませんか？',
        cannotClickButtonHint: '次のリンクをブラウザのアドレスバーにコピーしてください:',
        importantReminderTitle: '⚠️ 重要なお知らせ:',
        securityTipTitle: '🛡️ セキュリティのヒント',
    },
}

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
    const fallback = EMAIL_SHELL_FALLBACKS[resolvedLocale]

    // 邮件模板字段使用“按 locale 读取 + 字段级默认值兜底”的双层策略：
    // locale 包缺少单个 key 时不阻断发送，并保持历史模板可继续工作。
    return {
        locale: resolvedLocale,
        headerSubtitle: runtime.header_subtitle ?? fallback.headerSubtitle,
        greeting: runtime.greeting ?? fallback.greeting,
        helpText: runtime.help_text ?? fallback.helpText,
        contactLinkLabel: runtime.contact_link_label ?? fallback.contactLinkLabel,
        privacyPolicyLabel: runtime.privacy_policy_label ?? fallback.privacyPolicyLabel,
        termsLabel: runtime.terms_label ?? fallback.termsLabel,
        allRightsReserved: runtime.all_rights_reserved ?? fallback.allRightsReserved,
        autoFooterNote: runtime.auto_footer_note ?? fallback.autoFooterNote,
        codeFooterNote: runtime.code_footer_note ?? fallback.codeFooterNote,
        marketingFooterNote: runtime.marketing_footer_note ?? fallback.marketingFooterNote,
        verificationCodeTitle: runtime.verification_code_title ?? fallback.verificationCodeTitle,
        verificationCodeExpiry: runtime.verification_code_expiry ?? fallback.verificationCodeExpiry,
        cannotClickButtonTitle: runtime.cannot_click_button_title ?? fallback.cannotClickButtonTitle,
        cannotClickButtonHint: runtime.cannot_click_button_hint ?? fallback.cannotClickButtonHint,
        importantReminderTitle: runtime.important_reminder_title ?? fallback.importantReminderTitle,
        securityTipTitle: runtime.security_tip_title ?? fallback.securityTipTitle,
    }
}

export async function resolvePreferredEmailLocale(options: {
    email?: string | null
    language?: string | null
}) {
    const normalizedLanguage = typeof options.language === 'string'
        ? options.language.trim()
        : ''

    // 显式入参 language 视为最高优先级（例如用户手动切换后的立即发送场景）。
    if (normalizedLanguage) {
        return resolveRequestedAppLocale(normalizedLanguage)
    }

    const normalizedEmail = typeof options.email === 'string'
        ? options.email.trim().toLowerCase()
        : ''

    // 无邮箱或数据库未初始化时，返回 undefined 交给上层 fallback，
    // 避免在安装/降级阶段因为 locale 查询失败而阻断邮件链路。
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
