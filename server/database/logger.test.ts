import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import logger from '../utils/logger'
import { CustomLogger } from './logger'

vi.mock('../utils/logger', () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        database: {
            query: vi.fn(),
            error: vi.fn(),
            migration: vi.fn(),
        },
    },
}))

describe('CustomLogger', () => {
    let customLogger: CustomLogger

    beforeEach(() => {
        vi.clearAllMocks()
        customLogger = new CustomLogger()
        // Force production mode for some tests if needed, or dev mode
        process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
        vi.useRealTimers()
        process.env.NODE_ENV = 'test'
    })

    describe('logQuery', () => {
        it('should log simple query', () => {
            customLogger.logQuery('SELECT * FROM posts', [])
            expect(logger.database.query).toHaveBeenCalledWith(expect.objectContaining({
                query: 'SELECT * FROM posts',
            }))
        })

        it('should mask sensitive parameters in development', () => {
            // containsSensitiveData checks the query string too
            customLogger.logQuery('INSERT INTO users (email, password) VALUES (?, ?)', ['test@example.com', 'secret123'])
            const callArgs = (logger.database.query as any).mock.calls[0][0]
            expect(callArgs.query).toContain('SENSITIVE-INSERT')
            expect(callArgs.params).toContain('[REDACTED]')
        })

        it('should handle non-string parameters', () => {
            const now = new Date()
            customLogger.logQuery('SELECT * FROM posts WHERE createdAt > ?', [now, 123, true])
            const callArgs = (logger.database.query as any).mock.calls[0][0]
            expect(callArgs.params).toContain(now)
            expect(callArgs.params).toContain(123)
            expect(callArgs.params).toContain(true)
        })

        it('should hide parameters in production', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'production'
            try {
                // SELECT queries in production are not logged
                customLogger.logQuery('SELECT * FROM posts WHERE id = ?', [1])
                expect(logger.database.query).not.toHaveBeenCalled()

                // INSERT/UPDATE/DELETE are logged without params
                customLogger.logQuery('UPDATE posts SET title = ?', ['test'])
                expect(logger.database.query).toHaveBeenCalledWith(expect.objectContaining({
                    query: 'UPDATE operation executed',
                }))
            } finally {
                process.env.NODE_ENV = originalEnv
            }
        })

        it('should use buffer for high frequency queries', () => {
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'production'
            try {
                const query = 'UPDATE posts SET views = views + 1'
                customLogger.logQuery(query, [])
                expect(logger.database.query).toHaveBeenCalledTimes(1)

                // Second call within 10s should be buffered and not logged in production
                customLogger.logQuery(query, [])
                expect(logger.database.query).toHaveBeenCalledTimes(1)
            } finally {
                process.env.NODE_ENV = originalEnv
            }
        })
    })

    describe('logQueryError', () => {
        it('should log query error', () => {
            customLogger.logQueryError('error message', 'SELECT * FROM posts', [1])
            expect(logger.database.error).toHaveBeenCalled()
        })
    })

    describe('logQuerySlow', () => {
        it('should log slow query with parameters in dev', () => {
            process.env.NODE_ENV = 'development'
            customLogger.logQuerySlow(1000, 'SELECT * FROM posts WHERE id = ?', [1, 'test', new Date()])
            expect(logger.database.query).toHaveBeenCalled()
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Slow Query'))
        })

        it('should log slow query with sensitive parameters in dev', () => {
            process.env.NODE_ENV = 'development'
            customLogger.logQuerySlow(1000, 'SELECT * FROM posts', ['password123'])
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('[PARAM_0]'))
        })
    })

    describe('Buffer and Stats', () => {
        it('should flush buffer and reset stats', () => {
            vi.useFakeTimers()
            const timerLogger = new CustomLogger()
            const query = 'UPDATE posts SET count = count + 1'
            timerLogger.logQuery(query, [])

            vi.advanceTimersByTime(61000)
            vi.useRealTimers()
        })
    })

    describe('logSchemaBuild', () => {
        it('should log schema build', () => {
            customLogger.logSchemaBuild('build message')
            expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('build message'))
        })
    })

    describe('logMigration', () => {
        it('should log migration', () => {
            customLogger.logMigration('migration message')
            expect(logger.database.migration).toHaveBeenCalled()
        })
    })

    describe('log', () => {
        it('should log info messages', () => {
            customLogger.log('info', 'test info')
            expect(logger.info).toHaveBeenCalled()
        })

        it('should log warn messages', () => {
            customLogger.log('warn', 'test warn')
            expect(logger.warn).toHaveBeenCalled()
        })

        it('should log log level as info', () => {
            customLogger.log('log', 'test log')
            expect(logger.info).toHaveBeenCalled()
        })
    })

    describe('Query Type Logic', () => {
        it('should identify different query types', () => {
            const queries = ['UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'BEGIN', 'START', 'COMMIT', 'ROLLBACK']
            queries.forEach((type) => {
                customLogger.logQuery(`${type} something`, [])
            })
            expect(logger.database.query).toHaveBeenCalled()
        })

        it('should handle unknown query types', () => {
            customLogger.logQuery('UNKNOWN QUERY', [])
            expect(logger.database.query).toHaveBeenCalledWith(expect.objectContaining({
                query: expect.stringContaining('UNKNOWN'),
            }))
        })

        it('should use cache for query type', () => {
            const query = 'SELECT 1'.repeat(20)
            customLogger.logQuery(query, [])
            customLogger.logQuery(query, [])
        })
    })

    describe('Sensitive Data Detection', () => {
        it('should detect sensitive keywords in query string', () => {
            customLogger.logQuery('SELECT password FROM users', [])
        })

        it('should detect sensitive data in parameters', () => {
            customLogger.logQuery('UPDATE users SET phone = ?', ['13800138000'])
            const callArgs = (logger.database.query as any).mock.calls[0][0]
            expect(callArgs.params).toContain('[REDACTED]')
        })
    })

    describe('CustomLogger 统计与缓冲边界', () => {
        it('慢查询无参数时格式化结果为空串', () => {
            process.env.NODE_ENV = 'development'

            customLogger.logQuerySlow(1200, 'SELECT 1')

            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Slow Query'))
            expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/OK$/u))
        })

        it('生产环境慢查询只输出参数数量', () => {
            process.env.NODE_ENV = 'production'

            customLogger.logQuerySlow(1200, 'SELECT * FROM posts WHERE id = ?', [1, 2])

            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('[2 parameters]'))
        })

        it('错误计数每满 10 次输出一次告警', () => {
            for (let index = 0; index < 10; index += 1) {
                customLogger.logQueryError('boom', 'SELECT 1')
            }

            expect(logger.warn).toHaveBeenCalledWith('Database error count reached: 10')
        })

        it('未识别的日志级别回落到 debug', () => {
            customLogger.log('debug' as never, 'raw message', undefined)

            expect(logger.debug).toHaveBeenCalledWith('raw message', { queryRunner: undefined })
        })

        it('定时任务输出重复查询汇总、清理过期键并重置统计', () => {
            vi.useFakeTimers()
            try {
                const timerLogger = new CustomLogger()
                const query = 'UPDATE posts SET count = count + 1'

                timerLogger.logQuery(query, [])
                timerLogger.logQuery(query, [])

                // 60s：count>1 → 输出汇总（elapsed 恰为 60000，尚不重置统计）
                vi.advanceTimersByTime(60001)
                expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Query summary'))
                expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Database stats'))

                // 120s：elapsed>60s 且 total>0 → 重置统计
                vi.advanceTimersByTime(60001)
                expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Database stats'))

                // 180s：超过 2×刷新间隔 → 过期键被清理（不再输出汇总）
                logger.debug.mockClear()
                vi.advanceTimersByTime(60001)
                expect(logger.debug).not.toHaveBeenCalledWith(expect.stringContaining('Query summary'))
            } finally {
                vi.useRealTimers()
            }
        })

        it('getStats 返回统计快照副本', () => {
            const stats = customLogger.getStats()

            expect(stats).toMatchObject({ total: expect.any(Number), slow: expect.any(Number), errors: expect.any(Number) })
            expect(stats).not.toBe(customLogger.getStats())
        })
    })
})
