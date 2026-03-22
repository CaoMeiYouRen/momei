import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
    getLocalizedSetting: vi.fn(),
    resolveSetting: vi.fn(),
}))

vi.mock('@/server/utils/email/i18n', () => ({
    emailI18n: {
        getText: vi.fn(),
    },
}))

import { resolveEmailTemplateRuntimeContent } from './email-template'
import { getLocalizedSetting, getSetting, resolveSetting } from '@/server/services/setting'
import { emailI18n } from '@/server/utils/email/i18n'

describe('email template service locale integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSetting).mockResolvedValue(null)
        vi.mocked(getLocalizedSetting).mockResolvedValue({
            key: 'site_title',
            value: null,
            requestedLocale: 'zh-CN',
            resolvedLocale: null,
            fallbackChain: ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        })
        vi.mocked(resolveSetting).mockImplementation(async (key: string) => ({
            key,
            value: key === 'site_name' ? 'Momei' : null,
            description: '',
            level: 0,
            maskType: key === 'contact_email' ? 'email' : 'none',
            source: key === 'site_name' ? 'default' : 'default',
            isLocked: false,
            envKey: null,
            defaultValue: key === 'site_name' ? 'Momei' : null,
            defaultUsed: true,
            lockReason: null,
            requiresRestart: false,
            localized: null,
        }))
    })

    it.each([
        ['zh-CN', '验证您的 Momei 邮箱地址', '验证邮箱地址'],
        ['en-US', 'Verify Your Momei Email Address', 'Verify Email Address'],
        ['ko-KR', 'Momei 이메일 주소를 인증해 주세요', '이메일 주소 인증'],
        ['zh-TW', '驗證您的 Momei 電子郵件地址', '驗證電子郵件地址'],
        ['ja-JP', 'Momei のメールアドレスを確認してください', 'メールアドレスを確認'],
    ])('prefers locale defaults over legacy fallback for %s verification templates', async (locale, expectedTitle, expectedButtonText) => {
        vi.mocked(emailI18n.getText).mockReturnValue({
            title: 'LEGACY {appName} TITLE',
            preheader: 'LEGACY PREHEADER',
            headerIcon: '⚠️',
            message: 'LEGACY MESSAGE',
            buttonText: 'LEGACY BUTTON',
            reminderContent: 'LEGACY REMINDER',
            securityTip: 'LEGACY SECURITY',
        } as never)

        const template = await resolveEmailTemplateRuntimeContent({
            templateId: 'verification',
            locale,
            params: { appName: 'Momei' },
        })

        expect(template.title).toBe(expectedTitle)
        expect(template.buttonText).toBe(expectedButtonText)
        expect(template.headerIcon).toBe('🔐')
        expect(template.message).not.toBe('LEGACY MESSAGE')
    })

    it('prefers ja-JP marketing defaults over legacy fallback fields', async () => {
        vi.mocked(emailI18n.getText).mockReturnValue({
            title: 'LEGACY {title}',
            preheader: 'LEGACY PREHEADER',
            headerIcon: '⚠️',
            greeting: 'LEGACY GREETING',
            buttonText: 'LEGACY BUTTON',
            author: 'LEGACY AUTHOR',
            category: 'LEGACY CATEGORY',
            publishedAt: 'LEGACY DATE',
        } as never)

        const template = await resolveEmailTemplateRuntimeContent({
            templateId: 'marketingCampaign',
            locale: 'ja-JP',
            params: {
                appName: 'Momei',
                title: '春の更新',
                summary: '最新のお知らせ',
            },
        })

        expect(template.title).toBe('春の更新 - Momei')
        expect(template.preheader).toBe('最新のお知らせ')
        expect(template.message).toBe('購読者の皆さまへ')
        expect(template.buttonText).toBe('全文を読む')
        expect(template.authorLabel).toBe('著者: ')
        expect(template.categoryLabel).toBe('カテゴリ: ')
        expect(template.dateLabel).toBe('公開日: ')
        expect(template.headerIcon).toBe('✨')
    })
})
