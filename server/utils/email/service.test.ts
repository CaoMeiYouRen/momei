import { describe, it, expect, vi, beforeEach } from 'vitest'
import { emailService } from './service'

// Mock dependencies
vi.mock('./index', () => ({
    sendEmail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
}))

vi.mock('./templates', () => ({
    emailTemplateEngine: {
        generateActionEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>Test HTML</html>',
            text: 'Test Text',
        }),
        generateCodeEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>Test Code HTML</html>',
            text: 'Test Code Text',
        }),
        generateSimpleMessageTemplate: vi.fn().mockResolvedValue({
            html: '<html>Test Message HTML</html>',
            text: 'Test Message Text',
        }),
        generateMarketingEmailTemplate: vi.fn().mockResolvedValue({
            html: '<html>Test Marketing HTML</html>',
            text: 'Test Marketing Text',
        }),
    },
}))

vi.mock('@/server/services/email-template', () => ({
    resolveEmailTemplateRuntimeContent: vi.fn(({ templateId, params }: { templateId: string, params?: Record<string, string | number> }) => {
        const expiresIn = params?.expiresIn ?? 5

        const templates: Record<string, Record<string, string>> = {
            verification: {
                title: '验证邮件',
                preheader: '验证邮件',
                message: '请验证您的邮箱',
                buttonText: '立即验证',
                reminderContent: '如果无法点击，请复制链接到浏览器中打开。',
                securityTip: '请勿将链接分享给他人。',
            },
            passwordReset: {
                title: '重置密码',
                preheader: '重置密码',
                message: '请重置您的密码',
                buttonText: '立即重置',
                reminderContent: '如果无法点击，请复制链接到浏览器中打开。',
                securityTip: '请勿将链接分享给他人。',
            },
            loginOTP: {
                title: '登录验证码',
                preheader: '登录验证码',
                message: `您的验证码为，${expiresIn} 分钟内有效。`,
                securityTip: '请勿泄露验证码。',
            },
            emailVerificationOTP: {
                title: '邮箱验证验证码',
                preheader: '邮箱验证验证码',
                message: `您的验证码为，${expiresIn} 分钟内有效。`,
                securityTip: '请勿泄露验证码。',
            },
            passwordResetOTP: {
                title: '密码重置验证码',
                preheader: '密码重置验证码',
                message: `您的验证码为，${expiresIn} 分钟内有效。`,
                securityTip: '请勿泄露验证码。',
            },
            magicLink: {
                title: '登录链接',
                preheader: '登录链接',
                message: '点击按钮完成登录',
                buttonText: '立即登录',
                reminderContent: '如果无法点击，请复制链接到浏览器中打开。',
                securityTip: '请勿将链接分享给他人。',
            },
            emailChangeVerification: {
                title: '确认您的新邮箱地址',
                preheader: '确认您的新邮箱地址',
                message: '请确认您的新邮箱地址',
                buttonText: '确认变更',
                reminderContent: '如果无法点击，请复制链接到浏览器中打开。',
                securityTip: '请确认本次操作由您本人发起。',
            },
            securityNotification: {
                title: '安全通知',
                preheader: '安全通知',
                message: '我们检测到一条新的安全事件。',
            },
            subscriptionConfirmation: {
                title: '订阅确认',
                preheader: '订阅确认',
                message: '感谢订阅，欢迎继续阅读。',
                buttonText: '查看最新内容',
                reminderContent: '如果无法点击，请复制链接到浏览器中打开。',
                securityTip: '如非本人操作，请忽略。',
            },
            marketingCampaign: {
                title: '测试营销邮件',
                preheader: '测试营销邮件',
                message: '这是摘要',
                buttonText: '阅读全文',
                authorLabel: '作者',
                categoryLabel: '分类',
                dateLabel: '发布时间',
            },
        }

        return Promise.resolve({
            headerIcon: 'pi pi-envelope',
            ...templates[templateId],
        })
    }),
}))

vi.mock('../logger', () => ({
    default: {
        info: vi.fn(),
        email: {
            sent: vi.fn(),
            failed: vi.fn(),
        },
    },
}))

vi.mock('@/utils/shared/env', async (importOriginal) => ({
    ...await importOriginal<any>(),
    APP_NAME: 'Test App',
}))

describe('server/utils/email/service', () => {
    let sendEmail: any
    let emailTemplateEngine: any
    let logger: any

    beforeEach(async () => {
        vi.clearAllMocks()

        // Import mocked modules
        const indexModule = await import('./index')
        const templatesModule = await import('./templates')
        const loggerModule = await import('../logger')

        sendEmail = indexModule.sendEmail
        emailTemplateEngine = templatesModule.emailTemplateEngine
        logger = loggerModule.default
    })

    describe('sendVerificationEmail', () => {
        it('应该成功发送验证邮件', async () => {
            const email = 'test@example.com'
            const verificationUrl = 'https://example.com/verify'

            await emailService.sendVerificationEmail(email, verificationUrl)

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('验证'),
                html: '<html>Test HTML</html>',
                text: 'Test Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'verification',
                email,
            })
        })

        it('应该在发送失败时记录错误', async () => {
            const email = 'test@example.com'
            const verificationUrl = 'https://example.com/verify'
            const error = new Error('Send failed')

            vi.mocked(sendEmail).mockRejectedValueOnce(error)

            await expect(emailService.sendVerificationEmail(email, verificationUrl)).rejects.toThrow('Send failed')
            expect(logger.email.failed).toHaveBeenCalledWith({
                type: 'verification',
                email,
                error: 'Send failed',
            })
        })
    })

    describe('sendPasswordResetEmail', () => {
        it('应该成功发送密码重置邮件', async () => {
            const email = 'test@example.com'
            const resetUrl = 'https://example.com/reset'

            await emailService.sendPasswordResetEmail(email, resetUrl)

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('重置'),
                html: '<html>Test HTML</html>',
                text: 'Test Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'password-reset',
                email,
            })
        })

        it('应该在发送失败时记录错误', async () => {
            const email = 'test@example.com'
            const resetUrl = 'https://example.com/reset'
            const error = new Error('Send failed')

            vi.mocked(sendEmail).mockRejectedValueOnce(error)

            await expect(emailService.sendPasswordResetEmail(email, resetUrl)).rejects.toThrow('Send failed')
            expect(logger.email.failed).toHaveBeenCalledWith({
                type: 'password-reset',
                email,
                error: 'Send failed',
            })
        })
    })

    describe('sendLoginOTP', () => {
        it('应该成功发送登录验证码邮件', async () => {
            const email = 'test@example.com'
            const otp = '123456'
            const expiresInMinutes = 5

            await emailService.sendLoginOTP(email, otp, expiresInMinutes)

            expect(emailTemplateEngine.generateCodeEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('登录验证码'),
                html: '<html>Test Code HTML</html>',
                text: 'Test Code Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'login-otp',
                email,
            })
        })

        it('应该使用默认过期时间', async () => {
            const email = 'test@example.com'
            const otp = '123456'

            await emailService.sendLoginOTP(email, otp)

            expect(emailTemplateEngine.generateCodeEmailTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                    verificationCode: otp,
                    expiresIn: 5,
                }),
                expect.any(Object),
            )
        })
    })

    describe('sendEmailVerificationOTP', () => {
        it('应该成功发送邮箱验证码邮件', async () => {
            const email = 'test@example.com'
            const otp = '123456'
            const expiresInMinutes = 10

            await emailService.sendEmailVerificationOTP(email, otp, expiresInMinutes)

            expect(emailTemplateEngine.generateCodeEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('验证'),
                html: '<html>Test Code HTML</html>',
                text: 'Test Code Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'email-verification-otp',
                email,
            })
        })
    })

    describe('sendPasswordResetOTP', () => {
        it('应该成功发送密码重置验证码邮件', async () => {
            const email = 'test@example.com'
            const otp = '123456'
            const expiresInMinutes = 10

            await emailService.sendPasswordResetOTP(email, otp, expiresInMinutes)

            expect(emailTemplateEngine.generateCodeEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('重置'),
                html: '<html>Test Code HTML</html>',
                text: 'Test Code Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'password-reset-otp',
                email,
            })
        })
    })

    describe('sendMagicLink', () => {
        it('应该成功发送Magic Link邮件', async () => {
            const email = 'test@example.com'
            const magicUrl = 'https://example.com/magic'

            await emailService.sendMagicLink(email, magicUrl)

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('登录链接'),
                html: '<html>Test HTML</html>',
                text: 'Test Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'magic-link',
                email,
            })
        })
    })

    describe('sendEmailChangeVerification', () => {
        it('应该成功发送邮箱更改验证邮件', async () => {
            const currentEmail = 'old@example.com'
            const newEmail = 'new@example.com'
            const changeUrl = 'https://example.com/change'

            await emailService.sendEmailChangeVerification(currentEmail, newEmail, changeUrl)

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: currentEmail,
                subject: expect.stringContaining('确认您的新邮箱地址'),
                html: '<html>Test HTML</html>',
                text: 'Test Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'email-change',
                email: currentEmail,
            })
        })
    })

    describe('sendSecurityNotification', () => {
        it('应该成功发送安全通知邮件', async () => {
            const email = 'test@example.com'
            const action = '登录成功'
            const details = 'IP: 192.168.1.1'

            await emailService.sendSecurityNotification(email, action, details)

            expect(emailTemplateEngine.generateSimpleMessageTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('安全通知'),
                html: '<html>Test Message HTML</html>',
                text: 'Test Message Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'security-notification',
                email,
            })
        })
    })

    describe('sendSubscriptionConfirmation', () => {
        it('应该成功发送订阅确认邮件', async () => {
            const email = 'test@example.com'

            await emailService.sendSubscriptionConfirmation(email)

            expect(emailTemplateEngine.generateActionEmailTemplate).toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('订阅'),
                html: '<html>Test HTML</html>',
                text: 'Test Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'subscription-confirm',
                email,
            })
        })
    })

    describe('sendMarketingEmail', () => {
        it('应该将当前版权尾注文案作为摘要的一部分发送', async () => {
            const email = 'test@example.com'
            const summary = [
                '这是摘要',
                '----------',
                '本文作者: 草梅友仁',
                '本文链接: https://momei.app/posts/test-post',
                '版权声明: 本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享） 许可协议。转载请注明出处！',
            ].join('\n')

            await emailService.sendMarketingEmail(email, {
                title: '测试营销邮件',
                summary,
                articleTitle: '测试文章',
                authorName: '草梅友仁',
                categoryName: '默认分类',
                publishDate: '2026-03-09 10:00',
                actionUrl: 'https://momei.app/posts/test-post',
            })

            expect(emailTemplateEngine.generateMarketingEmailTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('本文链接: https://momei.app/posts/test-post<br/>版权声明: 本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享） 许可协议。转载请注明出处！'),
                    articleTitle: '测试文章',
                }),
                expect.any(Object),
            )
            expect(sendEmail).toHaveBeenCalledWith({
                to: email,
                subject: expect.stringContaining('测试营销邮件'),
                html: '<html>Test Marketing HTML</html>',
                text: 'Test Marketing Text',
            })
            expect(logger.email.sent).toHaveBeenCalledWith({
                type: 'marketing-campaign',
                email,
            })
        })
    })
})
