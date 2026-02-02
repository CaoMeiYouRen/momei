import { describe, it, expect } from 'vitest'
import { emailI18n } from './i18n'
import { EMAIL_SUPPORTED_LOCALES, DEFAULT_EMAIL_LOCALE } from './locales'


describe('邮件国际化系统', () => {
    describe('EmailI18nManager', () => {
        it('应该加载并返回指定语言的配置', () => {
            const text = emailI18n.getText('verification', 'zh-CN')
            expect(text).toBeDefined()
            expect(text?.title).toContain('邮箱地址')
        })

        it('应该在语言不支持时降级到默认语言', () => {
            const text = emailI18n.getText('verification', 'ja-JP')
            expect(text).toBeDefined()
            // 应该返回中文版本
            expect(text?.title).toContain('邮箱地址')
        })

        it('应该返回所有支持的语言列表', () => {
            const locales = emailI18n.getSupportedLocales()
            expect(locales).toContain('zh-CN')
            expect(locales).toContain('en-US')
        })

        it('应该检查语言是否被支持', () => {
            expect(emailI18n.isLocaleSupported('zh-CN')).toBe(true)
            expect(emailI18n.isLocaleSupported('en-US')).toBe(true)
            expect(emailI18n.isLocaleSupported('ja-JP')).toBe(false)
        })

        it('应该正确替换文本中的参数', () => {
            const text = '欢迎来到 {appName}，您的邮箱是 {email}'
            const result = emailI18n.replaceParameters(text, {
                appName: 'Momei',
                email: 'test@example.com',
            })
            expect(result).toBe('欢迎来到 Momei，您的邮箱是 test@example.com')
        })

        it('应该获取指定邮件类型的多语言文本', () => {
            const multiLocale = emailI18n.getMultiLocaleText('verification')
            expect(multiLocale['zh-CN']).toBeDefined()
            expect(multiLocale['en-US']).toBeDefined()
        })
    })

    describe('邮件配置完整性', () => {
        it('应该为所有支持的语言提供相同的邮件类型', () => {
            const zhCNKeys = Object.keys(EMAIL_SUPPORTED_LOCALES['zh-CN'])
            const enUSKeys = Object.keys(EMAIL_SUPPORTED_LOCALES['en-US'])
            expect(zhCNKeys.sort()).toEqual(enUSKeys.sort())
        })

        it('应该包含所有必需的邮件类型', () => {
            const requiredEmailTypes = [
                'verification',
                'passwordReset',
                'loginOTP',
                'emailVerificationOTP',
                'passwordResetOTP',
                'emailChangeVerification',
                'magicLink',
                'securityNotification',
                'subscriptionConfirmation',
                'weeklyNewsletter',
            ]

            const zhCNConfig = EMAIL_SUPPORTED_LOCALES['zh-CN']
            for (const type of requiredEmailTypes) {
                expect(zhCNConfig).toHaveProperty(type)
            }
        })

        it('应该为验证邮件类型提供所有必需的字段', () => {
            const verification = EMAIL_SUPPORTED_LOCALES['zh-CN'].verification
            expect(verification).toHaveProperty('title')
            expect(verification).toHaveProperty('preheader')
            expect(verification).toHaveProperty('headerIcon')
            expect(verification).toHaveProperty('message')
            expect(verification).toHaveProperty('buttonText')
            expect(verification).toHaveProperty('reminderContent')
            expect(verification).toHaveProperty('securityTip')
        })

        it('应该为 OTP 邮件类型提供所有必需的字段', () => {
            const loginOTP = EMAIL_SUPPORTED_LOCALES['zh-CN'].loginOTP
            expect(loginOTP).toHaveProperty('title')
            expect(loginOTP).toHaveProperty('preheader')
            expect(loginOTP).toHaveProperty('headerIcon')
            expect(loginOTP).toHaveProperty('message')
            expect(loginOTP).toHaveProperty('reminderContent')
            expect(loginOTP).toHaveProperty('securityTip')
        })
    })

    describe('中英文配置一致性', () => {
        it('中文和英文配置应该有相同的结构', () => {
            const zhCN = EMAIL_SUPPORTED_LOCALES['zh-CN']
            const enUS = EMAIL_SUPPORTED_LOCALES['en-US']

            for (const [key, value] of Object.entries(zhCN)) {
                expect(enUS).toHaveProperty(key)
                if (typeof value === 'object') {
                    for (const field in value) {
                        const enUSItem = enUS[key as keyof typeof enUS]
                        expect(enUSItem).toHaveProperty(field)
                    }
                }
            }
        })

        it('所有邮件内容应该包含参数占位符', () => {
            const zhCN = EMAIL_SUPPORTED_LOCALES['zh-CN']

            for (const [emailType, config] of Object.entries(zhCN)) {
                if (emailType === 'commonParameters') {

                    continue
                }

                if (typeof config === 'object' && config !== null) {
                    const configStr = JSON.stringify(config)
                    // 所有邮件配置应该至少包含一个参数占位符
                    const pattern = /\{(appName|baseUrl|contactEmail|currentYear|expiresIn)\}/
                    expect(configStr).toMatch(pattern)
                }
            }
        })
    })

    describe('默认语言配置', () => {
        it('应该使用 zh-CN 作为默认语言', () => {
            expect(DEFAULT_EMAIL_LOCALE).toBe('zh-CN')
        })

        it('应该在未指定语言时使用默认语言', () => {
            const text = emailI18n.getText('verification')
            const textDefault = emailI18n.getText('verification', 'zh-CN')
            expect(text).toEqual(textDefault)
        })
    })

    describe('英文邮件内容质量', () => {
        it('英文验证邮件应该有适当的英文内容', () => {
            const text = emailI18n.getText('verification', 'en-US')
            expect(text?.title).toMatch(/Verify.*Email/)
            expect(text?.message).toMatch(/Thank you/)
            expect(text?.buttonText).toMatch(/Verify/)
        })

        it('英文密码重置邮件应该有适当的英文内容', () => {
            const text = emailI18n.getText('passwordReset', 'en-US')
            expect(text?.title).toMatch(/Reset.*Password/)
            expect(text?.message).toMatch(/reset/)
            expect(text?.buttonText).toMatch(/Reset/)
        })
    })

    describe('中文邮件内容质量', () => {
        it('中文验证邮件应该有适当的中文内容', () => {
            const text = emailI18n.getText('verification', 'zh-CN')
            expect(text?.title).toContain('邮箱地址')
            expect(text?.message).toContain('感谢')
            expect(text?.buttonText).toContain('验证')
        })

        it('中文密码重置邮件应该有适当的中文内容', () => {
            const text = emailI18n.getText('passwordReset', 'zh-CN')
            expect(text?.title).toContain('密码')
            expect(text?.message).toContain('重置')
            expect(text?.buttonText).toContain('重置')
        })
    })
})
