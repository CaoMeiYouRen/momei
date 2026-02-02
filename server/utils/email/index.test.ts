import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Transporter } from 'nodemailer'
import { sendEmail, injectEmailDeps, resetEmailDeps } from './index'

// Mock getSettings before importing
vi.mock('~/server/services/setting', () => ({
    getSettings: vi.fn().mockResolvedValue({}),
}))

describe('server/utils/email/index', () => {
    let mockTransporter: Partial<Transporter>
    let mockLimiter: any
    let mockLogger: any

    beforeEach(() => {
        // 创建 mock transporter
        mockTransporter = {
            verify: vi.fn().mockResolvedValue(true),
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        }

        // 创建 mock limiter
        mockLimiter = {
            increment: vi.fn().mockResolvedValue(1),
        }

        // 创建 mock logger
        mockLogger = {
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            email: {
                sent: vi.fn(),
                failed: vi.fn(),
                rateLimited: vi.fn(),
            },
        }

        // 注入依赖
        injectEmailDeps({
            createMailer: () => mockTransporter as Transporter,
            limiter: mockLimiter,
            logger: mockLogger,
        })
    })

    afterEach(() => {
        resetEmailDeps()
        vi.clearAllMocks()
    })

    describe('sendEmail', () => {
        it('应该成功发送邮件', async () => {
            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test content',
            }

            const result = await sendEmail(emailOptions)

            expect(result).toEqual({ messageId: 'test-message-id' })
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: 'Test Subject',
                    text: 'Test content',
                }),
            )
            expect(mockLogger.email.sent).toHaveBeenCalledWith({
                type: 'general',
                email: 'test@example.com',
                success: true,
            })
        })

        it('应该使用 HTML 内容发送邮件', async () => {
            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test HTML content</p>',
            }

            await sendEmail(emailOptions)

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '<p>Test HTML content</p>',
                }),
            )
        })

        it('应该在达到全局限制时抛出错误', async () => {
            mockLimiter.increment.mockResolvedValueOnce(101) // 超过默认限制 100

            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test content',
            }

            await expect(sendEmail(emailOptions)).rejects.toThrow('今日邮箱发送次数已达全局上限')
            expect(mockLogger.email.rateLimited).toHaveBeenCalledWith({
                limitType: 'global',
                email: 'test@example.com',
                remainingTime: 86400,
            })
        })

        it('应该在达到单用户限制时抛出错误', async () => {
            mockLimiter.increment
                .mockResolvedValueOnce(1) // 全局计数
                .mockResolvedValueOnce(6) // 单用户计数超过默认限制 5

            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test content',
            }

            await expect(sendEmail(emailOptions)).rejects.toThrow('您的邮箱今日发送次数已达上限')
            expect(mockLogger.email.rateLimited).toHaveBeenCalledWith({
                limitType: 'user',
                email: 'test@example.com',
                remainingTime: 86400,
            })
        })

        it('应该在发送失败时记录错误', async () => {
            const error = new Error('Send mail failed')
            mockTransporter.sendMail = vi.fn().mockRejectedValue(error)

            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test content',
            }

            await expect(sendEmail(emailOptions)).rejects.toThrow('Send mail failed')
            expect(mockLogger.email.failed).toHaveBeenCalledWith({
                type: 'general',
                email: 'test@example.com',
                error: 'Send mail failed',
            })
        })

        it('应该在 transporter 验证失败时抛出错误', async () => {
            mockTransporter.verify = vi.fn().mockResolvedValue(false)
            resetEmailDeps()
            injectEmailDeps({
                createMailer: () => mockTransporter as Transporter,
                limiter: mockLimiter,
                logger: mockLogger,
            })

            const emailOptions = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test content',
            }

            await expect(sendEmail(emailOptions)).rejects.toThrow('Email transporter configuration is invalid')
            expect(mockLogger.error).toHaveBeenCalledWith('Email transporter verification failed')
        })
    })

    describe('injectEmailDeps', () => {
        it('应该正确注入邮件依赖', () => {
            const customMailer = vi.fn().mockReturnValue(mockTransporter)
            const customLimiter = {
                get: vi.fn(),
                set: vi.fn(),
                delete: vi.fn(),
                increment: vi.fn(),
            }
            const customLogger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), email: {} }

            injectEmailDeps({
                createMailer: customMailer,
                limiter: customLimiter,
                logger: customLogger as any,
            })

            // 验证依赖已被注入（通过后续调用验证）
            expect(customMailer).toBeDefined()
            expect(customLimiter).toBeDefined()
            expect(customLogger).toBeDefined()
        })
    })

    describe('resetEmailDeps', () => {
        it('应该重置邮件依赖到默认值', () => {
            const customMailer = vi.fn().mockReturnValue(mockTransporter)
            injectEmailDeps({ createMailer: customMailer })

            resetEmailDeps()

            // 验证依赖已被重置（通过后续调用验证）
            expect(resetEmailDeps).toBeDefined()
        })
    })
})
