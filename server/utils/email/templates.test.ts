import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/services/setting', () => ({
    getLocalizedSetting: vi.fn(),
    resolveSetting: vi.fn(),
}))

vi.mock('../logger', () => ({
    default: {
        warn: vi.fn(),
        info: vi.fn(),
        email: {
            templateError: vi.fn(),
        },
    },
}))

import { emailTemplateEngine, EmailTemplateEngine } from './templates'

import { getLocalizedSetting, resolveSetting } from '@/server/services/setting'

describe('email template engine', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('useStorage', () => ({
            getItem: vi.fn().mockResolvedValue(null),
        }))

        vi.mocked(getLocalizedSetting).mockImplementation((_key: string, locale?: string | null) => Promise.resolve({
            key: 'site_title',
            value: locale === 'en-US' ? 'Momei Blog' : '墨梅博客',
            requestedLocale: locale === 'en-US' ? 'en-US' : 'zh-CN',
            resolvedLocale: locale === 'en-US' ? 'en-US' : 'zh-CN',
            fallbackChain: locale === 'en-US' ? ['en-US', 'zh-CN'] : ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        }))

        vi.mocked(resolveSetting).mockImplementation((key: string) => {
            let value = 'Momei'
            if (key === 'site_url') {
                value = 'https://momei.app'
            } else if (key === 'contact_email') {
                value = 'contact@momei.app'
            }

            return Promise.resolve({
                key,
                value,
                description: '',
                level: 0,
                maskType: key === 'contact_email' ? 'email' : 'none',
                source: 'db',
                isLocked: false,
                envKey: null,
                defaultValue: null,
                defaultUsed: false,
                lockReason: null,
                requiresRestart: false,
                localized: null,
            })
        })
    })

    it('renders localized site title into HTML and plain text instead of serialized localized JSON', async () => {
        const result = await emailTemplateEngine.generateSimpleMessageTemplate({
            headerIcon: '🛡️',
            message: '欢迎使用邮件模板预览。',
        }, {
            title: '测试邮件',
            preheader: '测试摘要',
            locale: 'zh-CN',
        })

        expect(result.html).toContain('墨梅博客')
        expect(result.text).toContain('墨梅博客')
        expect(result.html).not.toContain('"type":"localized-text"')
        expect(result.text).not.toContain('"type":"localized-text"')
    })

    it('switches app name with locale for previewable templates', async () => {
        const result = await emailTemplateEngine.generateSimpleMessageTemplate({
            headerIcon: '🛡️',
            message: 'Preview email body.',
        }, {
            title: 'Preview Email',
            preheader: 'Preview summary',
            locale: 'en-US',
        })

        expect(result.html).toContain('Momei Blog')
        expect(result.text).toContain('Momei Blog')
        expect(result.html).toContain('Need help? Contact our support team')
        expect(result.html).toContain('Privacy Policy')
        expect(result.text).toContain('All rights reserved.')
    })

    it('renders action emails with CTA and reminder content instead of leaking placeholders', async () => {
        const result = await emailTemplateEngine.generateActionEmailTemplate({
            headerIcon: '🔐',
            message: '请点击按钮完成邮箱验证。',
            buttonText: '立即验证',
            actionUrl: 'https://momei.app/verify?token=abc',
            reminderContent: '验证链接仅可使用一次。',
        }, {
            title: '邮箱验证',
            preheader: '请完成邮箱验证',
            locale: 'zh-CN',
        })

        expect(result.html).toContain('请点击按钮完成邮箱验证。')
        expect(result.html).toContain('立即验证')
        expect(result.html).toContain('https://momei.app/verify?token=abc')
        expect(result.text).toContain('请点击按钮完成邮箱验证。')
        expect(result.html).not.toContain('{{actionUrl}}')
        expect(result.html).not.toContain('{{buttonText}}')
        expect(result.text).not.toContain('{{reminderContent}}')
    })

    it('renders code emails with verification code and localized expiry copy', async () => {
        const result = await emailTemplateEngine.generateCodeEmailTemplate({
            headerIcon: '🔢',
            message: 'Use this one-time code to continue.',
            verificationCode: '123456',
            expiresIn: 15,
        }, {
            title: 'Security code',
            preheader: 'Use this code to continue',
            locale: 'en-US',
        })

        expect(result.html).toContain('123456')
        expect(result.text).toContain('123456')
        expect(result.html).toContain('Momei Blog')
        expect(result.html).not.toContain('{{verificationCode}}')
        expect(result.html).not.toContain('{{expiresIn}}')
    })

    it('renders marketing emails with article metadata and CTA copy', async () => {
        const result = await emailTemplateEngine.generateMarketingEmailTemplate({
            headerIcon: '📰',
            message: 'A new article is available.',
            articleTitle: 'Shipping reliable locale modules',
            authorLabel: 'Author',
            authorName: 'CaoMeiYouRen',
            categoryLabel: 'Category',
            categoryName: 'Engineering',
            dateLabel: 'Published',
            publishDate: '2026-04-29',
            buttonText: 'Read article',
            actionUrl: 'https://momei.app/posts/shipping-reliable-locale-modules',
        }, {
            title: 'New article published',
            preheader: 'Read the latest engineering update',
            locale: 'en-US',
        })

        expect(result.html).toContain('https://momei.app/posts/shipping-reliable-locale-modules')
        expect(result.html).toContain('Read article')
        expect(result.html).toContain('You are receiving this email because you subscribed to our updates.')
        expect(result.text).toContain('Read article')
    })

    it('prefers Nitro storage templates and reuses cached template fragments', async () => {
        const storageGetItemMock = vi.fn(async (relativePath: string) => {
            if (relativePath === 'base-template.mjml') {
                return '<mjml><mj-body>{{mainContent}}</mj-body></mjml>'
            }

            if (relativePath === 'fragments/simple-message.mjml') {
                return '<mj-section><mj-column><mj-text>{{message}}</mj-text></mj-column></mj-section>'
            }

            return null
        })

        vi.stubGlobal('useStorage', () => ({
            getItem: storageGetItemMock,
        }))

        const engine = new EmailTemplateEngine()

        await engine.generateSimpleMessageTemplate({
            headerIcon: '🧪',
            message: 'Storage-backed template body',
        }, {
            title: 'Storage Template',
            locale: 'en-US',
        })

        await engine.generateSimpleMessageTemplate({
            headerIcon: '🧪',
            message: 'Second render should hit cache',
        }, {
            title: 'Storage Template',
            locale: 'en-US',
        })

        expect(storageGetItemMock).toHaveBeenCalledWith('base-template.mjml')
        expect(storageGetItemMock).toHaveBeenCalledWith('fragments/simple-message.mjml')
        expect(
            storageGetItemMock.mock.calls.filter(([relativePath]) => relativePath === 'base-template.mjml'),
        ).toHaveLength(1)
        expect(
            storageGetItemMock.mock.calls.filter(([relativePath]) => relativePath === 'fragments/simple-message.mjml'),
        ).toHaveLength(1)
    })
})
