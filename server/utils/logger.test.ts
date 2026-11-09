import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ExtendedLogger } from './logger'

// 捕获 winston 实例，供「消息 / 元数据契约」断言复用（clearAllMocks 会清调用记录，但实例本身常驻）
const { winstonSpies } = vi.hoisted(() => ({
    winstonSpies: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        http: vi.fn(),
        verbose: vi.fn(),
        silly: vi.fn(),
    },
}))

// Mock all dependencies
vi.mock('fs')
vi.mock('winston', () => ({
    default: {
        createLogger: vi.fn(() => winstonSpies),
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

vi.mock('@/utils/shared/env', async (importOriginal) => ({
    ...await importOriginal<any>(),
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

    describe('实际调用测试', () => {
        it('should call basic logging methods without errors', () => {
            expect(() => logger.debug('Debug message')).not.toThrow()
            expect(() => logger.info('Info message')).not.toThrow()
            expect(() => logger.warn('Warning message')).not.toThrow()
            expect(() => logger.error('Error message')).not.toThrow()
            expect(() => logger.http('HTTP message')).not.toThrow()
            expect(() => logger.verbose('Verbose message')).not.toThrow()
            expect(() => logger.silly('Silly message')).not.toThrow()
        })

        it('should call security logging methods without errors', () => {
            expect(() => logger.security.loginAttempt({
                userId: 'user123',
                email: 'test@example.com',
                ip: '127.0.0.1',
                success: true,
            })).not.toThrow()

            expect(() => logger.security.loginSuccess({
                userId: 'user123',
                email: 'test@example.com',
                ip: '127.0.0.1',
            })).not.toThrow()

            expect(() => logger.security.loginFailure({
                email: 'test@example.com',
                reason: 'Invalid password',
            })).not.toThrow()

            expect(() => logger.security.passwordReset({
                userId: 'user123',
                email: 'test@example.com',
            })).not.toThrow()

            expect(() => logger.security.accountLocked({
                userId: 'user123',
                email: 'test@example.com',
                reason: 'Too many failed attempts',
            })).not.toThrow()

            expect(() => logger.security.permissionDenied({
                userId: 'user123',
                resource: '/admin',
                action: 'read',
            })).not.toThrow()
        })

        it('should call API logging methods without errors', () => {
            expect(() => logger.api.request({
                method: 'GET',
                path: '/api/posts',
                ip: '127.0.0.1',
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/posts',
                statusCode: 200,
                responseTime: 150,
            })).not.toThrow()

            expect(() => logger.api.error({
                method: 'POST',
                path: '/api/posts',
                error: 'Database error',
            })).not.toThrow()
        })

        it('should call database logging methods without errors', () => {
            expect(() => logger.database.query({
                query: 'SELECT * FROM posts',
                duration: 50,
            })).not.toThrow()

            expect(() => logger.database.error({
                query: 'INSERT INTO posts',
                error: 'Constraint violation',
            })).not.toThrow()

            expect(() => logger.database.migration({
                name: 'CreatePostsTable',
                direction: 'up',
                duration: 100,
            })).not.toThrow()
        })

        it('should call system logging methods without errors', () => {
            expect(() => logger.system.startup({
                port: 3000,
                env: 'development',
            })).not.toThrow()

            expect(() => logger.system.shutdown({
                reason: 'Manual shutdown',
                graceful: true,
            })).not.toThrow()

            expect(() => logger.system.healthCheck({
                status: 'healthy',
                checks: { database: true, redis: true },
            })).not.toThrow()
        })

        it('should call business logging methods without errors', () => {
            expect(() => logger.business.userRegistered({
                userId: 'user123',
                email: 'test@example.com',
            })).not.toThrow()

            expect(() => logger.business.userDeleted({
                userId: 'user123',
                email: 'test@example.com',
                adminId: 'admin456',
            })).not.toThrow()

            expect(() => logger.business.fileUploaded({
                fileName: 'avatar.png',
                size: 1024,
                userId: 'user123',
            })).not.toThrow()

            expect(() => logger.business.oauthAppCreated({
                appId: 'app123',
                name: 'My App',
                createdBy: 'user123',
            })).not.toThrow()

            expect(() => logger.business.oauthAppCreateFailed({
                name: 'My App',
                createdBy: 'user123',
                error: 'Validation failed',
            })).not.toThrow()
        })

        it('should call email logging methods without errors', () => {
            expect(() => logger.email.sent({
                type: 'verification',
                email: 'test@example.com',
                success: true,
            })).not.toThrow()

            expect(() => logger.email.failed({
                type: 'verification',
                email: 'test@example.com',
                error: 'SMTP error',
            })).not.toThrow()

            expect(() => logger.email.rateLimited({
                email: 'test@example.com',
                limitType: 'user',
                remainingTime: 300,
            })).not.toThrow()
        })

        it('should call phone logging methods without errors', () => {
            expect(() => logger.phone.sent({
                type: 'verification',
                phone: '+1234567890',
                success: true,
                channel: 'twilio',
            })).not.toThrow()

            expect(() => logger.phone.failed({
                type: 'verification',
                phone: '+1234567890',
                error: 'Invalid number',
                channel: 'twilio',
            })).not.toThrow()

            expect(() => logger.phone.rateLimited({
                phone: '+1234567890',
                limitType: 'user',
                remainingTime: 300,
            })).not.toThrow()
        })

        it('should handle optional parameters in security logging', () => {
            expect(() => logger.security.loginAttempt({
                email: 'test@example.com',
                success: false,
            })).not.toThrow()

            expect(() => logger.security.loginSuccess({
                userId: 'user123',
                email: 'test@example.com',
                provider: 'google',
            })).not.toThrow()
        })

        it('should handle different status codes in API response logging', () => {
            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/posts',
                statusCode: 200,
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/posts',
                statusCode: 404,
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/posts',
                statusCode: 500,
            })).not.toThrow()
        })

        it('should handle sensitive database queries', () => {
            expect(() => logger.database.query({
                query: 'SELECT * FROM users WHERE password = ?',
                sensitive: true,
            })).not.toThrow()

            expect(() => logger.database.error({
                query: 'UPDATE users SET password = ?',
                error: 'Constraint violation',
                sensitive: true,
            })).not.toThrow()
        })

        it('should handle slow database queries', () => {
            expect(() => logger.database.query({
                query: 'SELECT * FROM posts',
                duration: 5000,
                slow: true,
            })).not.toThrow()
        })

        it('should handle unhealthy system status', () => {
            expect(() => logger.system.healthCheck({
                status: 'unhealthy',
                checks: { database: false, redis: true },
            })).not.toThrow()
        })

        it('should handle phone logging with Twilio-specific fields', () => {
            expect(() => logger.phone.sent({
                type: 'verification',
                phone: '+1234567890',
                success: true,
                sid: 'SM123456',
                status: 'sent',
                direction: 'outbound-api',
                numSegments: '1',
                price: '-0.00750',
                priceUnit: 'usd',
                channel: 'twilio',
            })).not.toThrow()

            expect(() => logger.phone.sent({
                type: 'verification',
                phone: '+1234567890',
                success: false,
                errorCode: 21211,
                errorMessage: 'Invalid phone number',
                channel: 'twilio',
            })).not.toThrow()
        })
    })

    /* 上面的用例只验证「不抛错」，无法发现消息 / 级别 / 元数据回归。
     * 下面按日志族断言转发到 winston 的 message 与 meta，并覆盖截断器各分支。 */
    describe('消息与元数据契约', () => {
        it('基础级别原样转发 message 与 meta', () => {
            logger.info('hello', { a: 1 })
            logger.silly('silly')
            logger.verbose('verbose')
            logger.http('http')

            expect(winstonSpies.info).toHaveBeenCalledWith('hello', { a: 1 })
            expect(winstonSpies.silly).toHaveBeenCalledWith('silly', undefined)
            expect(winstonSpies.verbose).toHaveBeenCalledWith('verbose', undefined)
            expect(winstonSpies.http).toHaveBeenCalledWith('http', undefined)
        })

        it('安全日志带 tag 前缀，并按成功 / 失败切换级别', () => {
            logger.security.loginAttempt({ email: 'a@b.com', success: true, provider: 'github', ip: '1.2.3.4' })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[Security] Login attempt successful for a@b.com via github from 1.2.3.4',
                { provider: 'github', userAgent: undefined },
            )

            logger.security.loginAttempt({ userId: 'u1', success: false })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Security] Login attempt failed for unknown',
                { provider: undefined, userAgent: undefined },
            )

            logger.security.passwordReset({ userId: 'u1', email: 'a@b.com', ip: '1.2.3.4' })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[Security] Password reset initiated from 1.2.3.4',
                { userId: 'u1', email: 'a@b.com' },
            )

            logger.security.accountLocked({ userId: 'u1' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Security] Account locked: Unknown reason',
                { userId: 'u1', email: undefined },
            )

            logger.security.permissionDenied({ userId: 'u1', resource: '/admin', action: 'read', ip: '1.2.3.4' })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Security] Permission denied: read on /admin from 1.2.3.4',
                { userId: 'u1', resource: '/admin', action: 'read' },
            )
        })

        it('API 日志按状态码切换级别，并拼接 locale / 耗时', () => {
            logger.api.request({ method: 'GET', path: '/api/posts', ip: '1.2.3.4', locale: 'zh-CN' })
            expect(winstonSpies.http).toHaveBeenCalledWith(
                '[API] GET /api/posts from 1.2.3.4 [zh-CN]',
                { userId: undefined, userAgent: undefined },
            )

            logger.api.response({ method: 'GET', path: '/a', statusCode: 200, responseTime: 12 })
            expect(winstonSpies.http).toHaveBeenCalledWith('[API] GET /a - 200 (12ms)', { userId: undefined })
            logger.api.response({ method: 'GET', path: '/a', statusCode: 404 })
            expect(winstonSpies.warn).toHaveBeenCalledWith('[API] GET /a - 404', { userId: undefined })
            logger.api.response({ method: 'GET', path: '/a', statusCode: 500 })
            expect(winstonSpies.error).toHaveBeenCalledWith('[API] GET /a - 500', { userId: undefined })

            logger.api.error({ method: 'POST', path: '/a', error: 'boom', stack: 'trace' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[API] POST /a failed: boom',
                { userId: undefined, stack: 'trace' },
            )
        })

        it('数据库日志区分 dev / 慢查询 / 敏感 / 非 SELECT', () => {
            logger.database.query({ query: 'SELECT 1', type: 'SELECT' })
            expect(winstonSpies.debug).not.toHaveBeenCalled()

            logger.database.query({ query: 'INSERT INTO t VALUES (1)', type: 'INSERT' })
            expect(winstonSpies.debug).toHaveBeenCalledWith('[Database] Query executed [INSERT]', undefined)

            logger.database.query({ query: 'SELECT * FROM users', slow: true, duration: 5000 })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Database] Query executed [SLOW] (5000ms)',
                { query: 'SELECT * FROM users', params: undefined },
            )

            logger.database.query({ query: 'UPDATE users SET password = ?', sensitive: true })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Database] Query executed [SENSITIVE]',
                { query: '[REDACTED]', params: '[REDACTED]' },
            )

            logger.database.error({ error: 'boom', type: 'INSERT', sensitive: true, stack: 'trace' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Database] Database error [INSERT] [SENSITIVE]: boom',
                { query: '[REDACTED]', stack: 'trace' },
            )

            logger.database.migration({ name: 'M1', direction: 'down' })
            expect(winstonSpies.info).toHaveBeenCalledWith('[Database] Migration M1 down', undefined)
        })

        it('日志参数截断：长字符串 / 超长数组 / 超量键 / 超深嵌套 / 不支持类型', () => {
            const longString = 'x'.repeat(600)
            const longArray = Array.from({ length: 12 }, (_, index) => index)
            const manyKeys = Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`k${index}`, index]))
            const deepObject = { a: { b: { c: { d: 1 } } } }

            logger.database.query({
                query: 'q',
                slow: true,
                params: {
                    longString,
                    longArray,
                    manyKeys,
                    deepObject,
                    fn: () => undefined,
                    big: 10n,
                    nil: null,
                },
            })

            const meta = winstonSpies.warn.mock.calls[0]?.[1] as { params: Record<string, any> }
            const params = meta.params

            expect(params.longString).toBe(`${'x'.repeat(500)}... [truncated 100 chars]`)
            expect(params.longArray).toHaveLength(11)
            expect(params.longArray[10]).toBe('[... 2 more items]')
            expect(params.manyKeys.k0).toBe(0)
            expect(params.manyKeys.k19).toBe(19)
            expect(params.manyKeys.__truncatedKeys).toBe('5 keys omitted')
            expect(params.deepObject).toEqual({ a: { b: '[Max depth reached]' } })
            expect(params.fn).toBe('[Unsupported log value]')
            expect(params.big).toBe('[Unsupported log value]')
            expect(params.nil).toBeNull()
        })

        it('系统日志按健康状态切换级别', () => {
            logger.system.startup({ port: 3000, env: 'production', dbType: 'postgres' })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[System] System started on port 3000 (production mode)',
                { dbType: 'postgres' },
            )

            logger.system.shutdown({})
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[System] System shutting down: Unknown reason',
                { graceful: undefined },
            )

            logger.system.healthCheck({ status: 'unhealthy', checks: { database: false } })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[System] Health check failed',
                { checks: { database: false } },
            )
        })

        it('业务日志覆盖 OAuth / SSO / 会话查询失败等分支', () => {
            logger.business.oauthAppUpdated({ appId: 'a1', name: 'App', updatedBy: 'u1' })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[Business] OAuth app updated: App',
                { appId: 'a1', updatedBy: 'u1' },
            )

            logger.business.oauthAppUpdated({ appId: 'a1', updatedBy: 'u1' })
            expect(winstonSpies.info).toHaveBeenCalledWith('[Business] OAuth app updated', { appId: 'a1', updatedBy: 'u1' })

            logger.business.oauthAppDeleted({ appId: 'a1', deletedBy: 'u1' })
            expect(winstonSpies.warn).toHaveBeenCalledWith('[Business] OAuth app deleted', { appId: 'a1', deletedBy: 'u1' })

            logger.business.oauthAppListFailed({ error: 'db down', adminId: 'u1' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Business] Failed to list OAuth applications: db down',
                { adminId: 'u1' },
            )

            logger.business.ssoProviderCreated({ providerId: 'p1', name: 'SAML', createdBy: 'u1' })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[Business] SSO provider created: SAML',
                { providerId: 'p1', createdBy: 'u1' },
            )

            logger.business.ssoProviderUpdated({ providerId: 'p1', updatedBy: 'u1' })
            expect(winstonSpies.info).toHaveBeenCalledWith('[Business] SSO provider updated', { providerId: 'p1', updatedBy: 'u1' })

            logger.business.ssoProviderDeleted({ providerId: 'p1', deletedBy: 'u1' })
            expect(winstonSpies.warn).toHaveBeenCalledWith('[Business] SSO provider deleted', { providerId: 'p1', deletedBy: 'u1' })

            logger.business.sessionLogQueryFailed({ adminId: 'u1', error: 'timeout', queryParams: { page: 1 } })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Business] Failed to query session logs: timeout',
                { adminId: 'u1', queryParams: { page: 1 } },
            )
        })

        it('邮件日志覆盖模板渲染成功 / 失败与限流分支', () => {
            logger.email.templateRendered({ templateName: 'welcome', success: true })
            expect(winstonSpies.debug).toHaveBeenCalledWith(
                '[Email] Email template welcome rendered successfully',
                { templateName: 'welcome', success: true },
            )

            logger.email.templateRendered({ templateName: 'welcome', success: false })
            expect(winstonSpies.debug).toHaveBeenCalledWith(
                '[Email] Email template welcome rendering failed',
                { templateName: 'welcome', success: false },
            )

            logger.email.templateError({ templateName: 'welcome', error: 'syntax' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Email] Email template welcome error: syntax',
                { templateName: 'welcome' },
            )

            logger.email.rateLimited({ limitType: 'global' })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Email] Email rate limit reached (global)',
                { limitType: 'global', remainingTime: undefined },
            )

            logger.email.rateLimited({ email: 'a@b.com', limitType: 'user', remainingTime: 90 })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Email] Email rate limit reached (user) for a@b.com (2min remaining)',
                { limitType: 'user', remainingTime: 90 },
            )
        })

        it('短信日志覆盖渠道 / 分段 / 价格 / 错误码分支', () => {
            logger.phone.sent({ type: 'verification', phone: '+8613800138000', success: true })
            expect(winstonSpies.info).toHaveBeenCalledWith(
                '[Phone] SMS verification sent successfully to +861****138000',
                { type: 'verification', success: true, sid: undefined, channel: undefined },
            )

            logger.phone.sent({
                type: 'verification',
                phone: '+8613800138000',
                channel: 'twilio',
                status: 'delivered',
                direction: 'outbound-api',
                numSegments: '2',
                price: '-0.0075',
                priceUnit: 'usd',
            })
            expect(winstonSpies.info).toHaveBeenLastCalledWith(
                '[Phone] SMS verification sent successfully via twilio to +861****138000 (status: delivered) [2 segments]',
                {
                    type: 'verification',
                    success: undefined,
                    sid: undefined,
                    channel: 'twilio',
                    status: 'delivered',
                    direction: 'outbound-api',
                    numSegments: '2',
                    cost: '-0.0075 USD',
                },
            )

            logger.phone.sent({ type: 'verification', phone: '+8613800138000', price: '-0.0075' })
            expect(winstonSpies.info).toHaveBeenLastCalledWith(
                '[Phone] SMS verification sent successfully to +861****138000',
                { type: 'verification', success: undefined, sid: undefined, channel: undefined },
            )

            logger.phone.sent({ type: 'verification', phone: '+8613800138000', errorCode: 21211, errorMessage: 'invalid' })
            expect(winstonSpies.info).toHaveBeenLastCalledWith(
                '[Phone] SMS verification sent successfully to +861****138000',
                {
                    type: 'verification',
                    success: undefined,
                    sid: undefined,
                    channel: undefined,
                    errorCode: 21211,
                    errorMessage: 'invalid',
                },
            )

            logger.phone.failed({ type: 'verification', phone: '+8613800138000', error: 'boom' })
            expect(winstonSpies.error).toHaveBeenCalledWith(
                '[Phone] Failed to send verification SMS to +861****138000: boom',
                { type: 'verification', channel: undefined },
            )

            logger.phone.rateLimited({ limitType: 'global' })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Phone] SMS rate limit reached (global)',
                { limitType: 'global', remainingTime: undefined },
            )

            logger.phone.rateLimited({ phone: '+8613800138000', limitType: 'user', remainingTime: 30 })
            expect(winstonSpies.warn).toHaveBeenCalledWith(
                '[Phone] SMS rate limit reached (user) for +861****138000 (1min remaining)',
                { limitType: 'user', remainingTime: 30 },
            )
        })
    })

})
