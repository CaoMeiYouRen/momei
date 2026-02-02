import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createDefaultMailer, type MailerConfig } from './factory'

// Mock nodemailer
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn((config) => ({
            config,
            sendMail: vi.fn(),
        })),
    },
}))

vi.mock('@/utils/shared/env', () => ({
    EMAIL_HOST: 'smtp.example.com',
    EMAIL_PORT: 587,
    EMAIL_SECURE: false,
    EMAIL_USER: 'user@example.com',
    EMAIL_PASS: 'password123',
}))

describe('email factory utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createDefaultMailer', () => {
        it('should create mailer with default config from env', async () => {
            const nodemailer = await import('nodemailer')

            createDefaultMailer()

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
                host: 'smtp.example.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'user@example.com',
                    pass: 'password123',
                },
            })
        })

        it('should override host when provided in config', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                host: 'smtp.custom.com',
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    host: 'smtp.custom.com',
                }),
            )
        })

        it('should override port when provided in config', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                port: 465,
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    port: 465,
                }),
            )
        })

        it('should override secure when provided in config', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                secure: true,
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    secure: true,
                }),
            )
        })

        it('should override auth user when provided in config', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                auth: {
                    user: 'custom@example.com',
                },
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    auth: expect.objectContaining({
                        user: 'custom@example.com',
                    }),
                }),
            )
        })

        it('should override auth pass when provided in config', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                auth: {
                    pass: 'custompass',
                },
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    auth: expect.objectContaining({
                        pass: 'custompass',
                    }),
                }),
            )
        })

        it('should override multiple config values', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                host: 'smtp.custom.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'custom@example.com',
                    pass: 'custompass',
                },
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
                host: 'smtp.custom.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'custom@example.com',
                    pass: 'custompass',
                },
            })
        })

        it('should use default port 587 when not provided', async () => {
            const nodemailer = await import('nodemailer')

            // Mock EMAIL_PORT as undefined
            vi.doMock('@/utils/shared/env', () => ({
                EMAIL_HOST: 'smtp.example.com',
                EMAIL_PORT: undefined,
                EMAIL_SECURE: false,
                EMAIL_USER: 'user@example.com',
                EMAIL_PASS: 'password123',
            }))

            createDefaultMailer()

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    port: 587,
                }),
            )
        })

        it('should return a transporter object', () => {
            const transporter = createDefaultMailer()

            expect(transporter).toBeDefined()
            expect(transporter).toHaveProperty('config')
        })

        it('should handle empty config object', async () => {
            const nodemailer = await import('nodemailer')

            createDefaultMailer({})

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
                host: 'smtp.example.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'user@example.com',
                    pass: 'password123',
                },
            })
        })

        it('should handle secure false explicitly', async () => {
            const nodemailer = await import('nodemailer')
            const config: MailerConfig = {
                secure: false,
            }

            createDefaultMailer(config)

            expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    secure: false,
                }),
            )
        })
    })
})
