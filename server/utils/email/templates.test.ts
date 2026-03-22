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

import { emailTemplateEngine } from './templates'
import { getLocalizedSetting, resolveSetting } from '@/server/services/setting'

describe('email template engine', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('useStorage', () => ({
            getItem: vi.fn().mockResolvedValue(null),
        }))

        vi.mocked(getLocalizedSetting).mockImplementation(async (_key: string, locale?: string | null) => ({
            key: 'site_title',
            value: locale === 'en-US' ? 'Momei Blog' : '墨梅博客',
            requestedLocale: locale === 'en-US' ? 'en-US' : 'zh-CN',
            resolvedLocale: locale === 'en-US' ? 'en-US' : 'zh-CN',
            fallbackChain: locale === 'en-US' ? ['en-US', 'zh-CN'] : ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        }))

        vi.mocked(resolveSetting).mockImplementation(async (key: string) => ({
            key,
            value: key === 'site_url'
                ? 'https://momei.app'
                : key === 'contact_email'
                    ? 'contact@momei.app'
                    : 'Momei',
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
        }))
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
    })
})