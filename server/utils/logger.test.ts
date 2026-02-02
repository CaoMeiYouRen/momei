import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ExtendedLogger } from './logger'

// Mock all dependencies
vi.mock('fs')
vi.mock('winston', () => ({
    default: {
        createLogger: vi.fn(() => ({
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            http: vi.fn(),
            verbose: vi.fn(),
            silly: vi.fn(),
        })),
        format: {
            combine: vi.fn(),
            timestamp: vi.fn(),
            errors: vi.fn(),
            splat: vi.fn(),
            ms: vi.fn(),
        },
        transports: {
            Console: vi.fn(),
        },
    },
}))

vi.mock('winston-daily-rotate-file', () => ({
    default: vi.fn(),
}))

vi.mock('nest-winston', () => ({
    utilities: {
        format: {
            nestLike: vi.fn(),
        },
    },
}))

vi.mock('@axiomhq/winston', () => ({
    WinstonTransport: vi.fn(),
}))

vi.mock('./privacy', () => ({
    createSafeLogData: vi.fn((data) => data),
    maskEmail: vi.fn((email) => email.replace(/(.{2}).*@/, '$1***@')),
    maskPhone: vi.fn((phone) => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')),
}))

vi.mock('./env', () => ({
    isServerlessEnvironment: vi.fn(() => false),
}))

vi.mock('@/utils/shared/env', () => ({
    LOG_LEVEL: 'info',
    LOGFILES: true,
    AXIOM_DATASET_NAME: '',
    AXIOM_API_TOKEN: '',
    LOG_DIR: './logs',
}))

describe('logger utils', () => {
    let logger: ExtendedLogger

    beforeEach(async () => {
        vi.clearAllMocks()
        // Dynamically import logger to ensure mocks are applied
        const loggerModule = await import('./logger')
        logger = loggerModule.default
    })

    describe('basic logging methods', () => {
        it('should have debug method', () => {
            expect(logger.debug).toBeDefined()
            expect(typeof logger.debug).toBe('function')
        })

        it('should have info method', () => {
            expect(logger.info).toBeDefined()
            expect(typeof logger.info).toBe('function')
        })

        it('should have warn method', () => {
            expect(logger.warn).toBeDefined()
            expect(typeof logger.warn).toBe('function')
        })

        it('should have error method', () => {
            expect(logger.error).toBeDefined()
            expect(typeof logger.error).toBe('function')
        })

        it('should have http method', () => {
            expect(logger.http).toBeDefined()
            expect(typeof logger.http).toBe('function')
        })

        it('should have verbose method', () => {
            expect(logger.verbose).toBeDefined()
            expect(typeof logger.verbose).toBe('function')
        })

        it('should have silly method', () => {
            expect(logger.silly).toBeDefined()
            expect(typeof logger.silly).toBe('function')
        })
    })

    describe('security logging', () => {
        it('should have security.loginAttempt method', () => {
            expect(logger.security.loginAttempt).toBeDefined()
            expect(typeof logger.security.loginAttempt).toBe('function')
        })

        it('should have security.loginSuccess method', () => {
            expect(logger.security.loginSuccess).toBeDefined()
            expect(typeof logger.security.loginSuccess).toBe('function')
        })

        it('should have security.loginFailure method', () => {
            expect(logger.security.loginFailure).toBeDefined()
            expect(typeof logger.security.loginFailure).toBe('function')
        })

        it('should have security.passwordReset method', () => {
            expect(logger.security.passwordReset).toBeDefined()
            expect(typeof logger.security.passwordReset).toBe('function')
        })

        it('should have security.accountLocked method', () => {
            expect(logger.security.accountLocked).toBeDefined()
            expect(typeof logger.security.accountLocked).toBe('function')
        })

        it('should have security.permissionDenied method', () => {
            expect(logger.security.permissionDenied).toBeDefined()
            expect(typeof logger.security.permissionDenied).toBe('function')
        })
    })

    describe('API logging', () => {
        it('should have api.request method', () => {
            expect(logger.api.request).toBeDefined()
            expect(typeof logger.api.request).toBe('function')
        })

        it('should have api.response method', () => {
            expect(logger.api.response).toBeDefined()
            expect(typeof logger.api.response).toBe('function')
        })

        it('should have api.error method', () => {
            expect(logger.api.error).toBeDefined()
            expect(typeof logger.api.error).toBe('function')
        })
    })

    describe('database logging', () => {
        it('should have database.query method', () => {
            expect(logger.database.query).toBeDefined()
            expect(typeof logger.database.query).toBe('function')
        })

        it('should have database.error method', () => {
            expect(logger.database.error).toBeDefined()
            expect(typeof logger.database.error).toBe('function')
        })

        it('should have database.migration method', () => {
            expect(logger.database.migration).toBeDefined()
            expect(typeof logger.database.migration).toBe('function')
        })
    })

    describe('system logging', () => {
        it('should have system.startup method', () => {
            expect(logger.system.startup).toBeDefined()
            expect(typeof logger.system.startup).toBe('function')
        })

        it('should have system.shutdown method', () => {
            expect(logger.system.shutdown).toBeDefined()
            expect(typeof logger.system.shutdown).toBe('function')
        })

        it('should have system.healthCheck method', () => {
            expect(logger.system.healthCheck).toBeDefined()
            expect(typeof logger.system.healthCheck).toBe('function')
        })
    })

    describe('business logging', () => {
        it('should have business.userRegistered method', () => {
            expect(logger.business.userRegistered).toBeDefined()
            expect(typeof logger.business.userRegistered).toBe('function')
        })

        it('should have business.userDeleted method', () => {
            expect(logger.business.userDeleted).toBeDefined()
            expect(typeof logger.business.userDeleted).toBe('function')
        })

        it('should have business.fileUploaded method', () => {
            expect(logger.business.fileUploaded).toBeDefined()
            expect(typeof logger.business.fileUploaded).toBe('function')
        })
    })

    describe('email logging', () => {
        it('should have email.sent method', () => {
            expect(logger.email.sent).toBeDefined()
            expect(typeof logger.email.sent).toBe('function')
        })

        it('should have email.failed method', () => {
            expect(logger.email.failed).toBeDefined()
            expect(typeof logger.email.failed).toBe('function')
        })

        it('should have email.rateLimited method', () => {
            expect(logger.email.rateLimited).toBeDefined()
            expect(typeof logger.email.rateLimited).toBe('function')
        })
    })

    describe('phone logging', () => {
        it('should have phone.sent method', () => {
            expect(logger.phone.sent).toBeDefined()
            expect(typeof logger.phone.sent).toBe('function')
        })

        it('should have phone.failed method', () => {
            expect(logger.phone.failed).toBeDefined()
            expect(typeof logger.phone.failed).toBe('function')
        })

        it('should have phone.rateLimited method', () => {
            expect(logger.phone.rateLimited).toBeDefined()
            expect(typeof logger.phone.rateLimited).toBe('function')
        })
    })
})
