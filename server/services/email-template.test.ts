import { beforeEach, describe, expect, it, vi } from 'vitest'
import { previewEmailTemplate, resolveEmailTemplateRuntimeContent } from './email-template'

vi.mock('@/server/utils/i18n', () => ({
    loadLocaleMessages: vi.fn(() => Promise.resolve({
        pages: {
            admin: {
                settings: {
                    system: {
                        email_templates: {
                            catalog: {
                                verification: {
                                    defaults: {
                                        title: '验证您的 {appName} 邮箱地址',
                                        preheader: '请验证邮箱地址',
                                        headerIcon: '🔐',
                                        message: '欢迎来到 {appName}',
                                        buttonText: '立即验证',
                                        reminderContent: '链接将在 24 小时后过期',
                                        securityTip: '不要泄露验证码',
                                    },
                                },
                                marketingCampaign: {
                                    defaults: {
                                        title: '{title} - {appName}',
                                        preheader: '{summary}',
                                        headerIcon: '✨',
                                        message: '摘要',
                                        buttonText: '阅读全文',
                                        authorLabel: '作者：',
                                        categoryLabel: '分类：',
                                        dateLabel: '发布时间：',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })),
}))

vi.mock('@/server/services/setting', () => ({
    getSetting: vi.fn(),
    getLocalizedSetting: vi.fn(),
    resolveSetting: vi.fn(),
}))

vi.mock('@/server/utils/email/i18n', () => ({
    emailI18n: {
        getText: vi.fn(() => null),
    },
}))

vi.mock('@/server/utils/email/templates', () => ({
    emailTemplateEngine: {
        generateActionEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>preview</html>',
            text: 'preview',
        }),
        generateCodeEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>code</html>',
            text: 'code',
        }),
        generateSimpleMessageTemplate: vi.fn().mockResolvedValue({
            html: '<html>simple</html>',
            text: 'simple',
        }),
        generateMarketingEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>marketing</html>',
            text: 'marketing',
        }),
    },
}))

describe('email template service', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        const settingModule = await import('@/server/services/setting')
        vi.mocked(settingModule.getSetting).mockResolvedValue(null)
        vi.mocked(settingModule.getLocalizedSetting).mockResolvedValue({
            key: 'site_title',
            value: null,
            requestedLocale: 'zh-CN',
            resolvedLocale: null,
            fallbackChain: ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        })
        vi.mocked(settingModule.resolveSetting).mockImplementation((key: string) => {
            if (key === 'site_name') {
                return Promise.resolve({
                    key,
                    value: 'Momei',
                    description: '',
                    level: 0,
                    maskType: 'none',
                    source: 'default',
                    isLocked: false,
                    envKey: null,
                    defaultValue: 'Momei',
                    defaultUsed: true,
                    lockReason: null,
                    requiresRestart: false,
                    localized: null,
                })
            }

            if (key === 'contact_email') {
                return Promise.resolve({
                    key,
                    value: 'contact@momei.app',
                    description: '',
                    level: 0,
                    maskType: 'email',
                    source: 'default',
                    isLocked: false,
                    envKey: null,
                    defaultValue: 'contact@momei.app',
                    defaultUsed: true,
                    lockReason: null,
                    requiresRestart: false,
                    localized: null,
                })
            }

            return Promise.resolve({
                key,
                value: null,
                description: '',
                level: 0,
                maskType: 'none',
                source: 'default',
                isLocked: false,
                envKey: null,
                defaultValue: null,
                defaultUsed: true,
                lockReason: null,
                requiresRestart: false,
                localized: null,
            })
        })
    })

    it('applies localized overrides and replaces variables', async () => {
        const settingModule = await import('@/server/services/setting')

        vi.mocked(settingModule.getSetting).mockResolvedValue(JSON.stringify({
            version: 1,
            templates: {
                verification: {
                    enabled: true,
                    fields: {
                        title: {
                            version: 1,
                            type: 'localized-text',
                            locales: {
                                'zh-CN': '来自 {appName} 的自定义验证主题',
                            },
                            legacyValue: null,
                        },
                        message: {
                            version: 1,
                            type: 'localized-text',
                            locales: {
                                'zh-CN': '你好，这里是 {appName} 的自定义正文。',
                            },
                            legacyValue: null,
                        },
                    },
                },
            },
        }))

        const template = await resolveEmailTemplateRuntimeContent({
            templateId: 'verification',
            locale: 'zh-CN',
            params: { appName: 'Momei' },
        })

        expect(template.title).toBe('来自 Momei 的自定义验证主题')
        expect(template.message).toBe('你好，这里是 Momei 的自定义正文。')
        expect(template.preheader).toBe('请验证邮箱地址')
    })

    it('uses the resolved template content to build previews', async () => {
        const preview = await previewEmailTemplate({
            templateId: 'marketingCampaign',
            locale: 'zh-CN',
            config: {
                version: 1,
                templates: {
                    marketingCampaign: {
                        enabled: true,
                        fields: {
                            buttonText: {
                                version: 1,
                                type: 'localized-text',
                                locales: { 'zh-CN': '查看详情' },
                                legacyValue: null,
                            },
                        },
                    },
                },
            },
        })

        expect(preview.subject).toContain('Momei')
        expect(preview.html).toContain('marketing')
        expect(preview.text).toContain('marketing')
        expect(preview.meta.appName.value).toBe('Momei')
        expect(preview.meta.fieldSources.buttonText?.source).toBe('db')
    })

    it('prefers localized site title for appName preview variables', async () => {
        const settingModule = await import('@/server/services/setting')

        vi.mocked(settingModule.getLocalizedSetting).mockResolvedValue({
            key: 'site_title',
            value: '墨梅博客',
            requestedLocale: 'zh-CN',
            resolvedLocale: 'zh-CN',
            fallbackChain: ['zh-CN', 'en-US'],
            usedFallback: false,
            usedLegacyValue: false,
        })
        vi.mocked(settingModule.resolveSetting).mockImplementation((key: string) => {
            if (key === 'site_title') {
                return Promise.resolve({
                    key,
                    value: JSON.stringify({
                        version: 1,
                        type: 'localized-text',
                        locales: { 'zh-CN': '墨梅博客' },
                        legacyValue: null,
                    }),
                    description: '',
                    level: 0,
                    maskType: 'none',
                    source: 'db',
                    isLocked: false,
                    envKey: null,
                    defaultValue: null,
                    defaultUsed: false,
                    lockReason: null,
                    requiresRestart: false,
                    localized: null,
                })
            }

            if (key === 'site_name') {
                return Promise.resolve({
                    key,
                    value: 'Momei',
                    description: '',
                    level: 0,
                    maskType: 'none',
                    source: 'default',
                    isLocked: false,
                    envKey: null,
                    defaultValue: 'Momei',
                    defaultUsed: true,
                    lockReason: null,
                    requiresRestart: false,
                    localized: null,
                })
            }

            return Promise.resolve({
                key,
                value: 'contact@momei.app',
                description: '',
                level: 0,
                maskType: 'email',
                source: 'default',
                isLocked: false,
                envKey: null,
                defaultValue: 'contact@momei.app',
                defaultUsed: true,
                lockReason: null,
                requiresRestart: false,
                localized: null,
            })
        })

        const preview = await previewEmailTemplate({
            templateId: 'verification',
            locale: 'zh-CN',
        })

        expect(preview.subject).toContain('墨梅博客')
        expect(preview.meta.appName.value).toBe('墨梅博客')
        expect(preview.meta.appName.source).toBe('db')
    })
})
