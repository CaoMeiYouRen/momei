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
    },
}))

vi.mock('../logger', () => ({
    default: {
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
})
