import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `server/utils/logger` 的**模块初始化分支**契约。
 *
 * 主体行为由 `logger.test.ts` 覆盖；本文件只覆盖「只能在模块加载时决定」的四个分支：
 * 1. 日志目录 / 文件不可写 → 关闭文件日志并告警；
 * 2. Serverless + 文件日志开关 → 告警并关闭文件日志；
 * 3. 配置 Axiom → 追加 Axiom transport 与异常 / 拒绝处理器；
 * 4. `NODE_ENV=development` → 数据库查询走 dev 级详细日志。
 *
 * 每个用例都用 `vi.resetModules()` + `vi.doMock()` 重建模块注册表，避免模块级常量缓存串味。
 */

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

const ENV_KEYS = {
    LOGFILES: true,
    LOG_LEVEL: 'info',
    AXIOM_DATASET_NAME: '',
    AXIOM_API_TOKEN: '',
    LOG_DIR: './logs',
}

interface MockEnvOverrides {
    LOGFILES?: boolean
    AXIOM_DATASET_NAME?: string
    AXIOM_API_TOKEN?: string
}

function mockWinston() {
    vi.doMock('winston', () => ({
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
}

async function loadLogger(options: {
    env?: MockEnvOverrides
    serverless?: boolean
    fsWriteError?: Error
}) {
    const { env = {}, serverless = false, fsWriteError } = options

    mockWinston()
    vi.doMock('winston-daily-rotate-file', () => ({ default: vi.fn() }))
    vi.doMock('nest-winston', () => ({ utilities: { format: { nestLike: vi.fn() } } }))
    vi.doMock('@axiomhq/winston', () => ({ WinstonTransport: vi.fn() }))
    vi.doMock('./env', () => ({ isServerlessEnvironment: () => serverless }))
    vi.doMock('./privacy', () => ({
        createSafeLogData: (data: unknown) => data,
        maskEmail: (email: string) => email,
        maskPhone: (phone: string) => phone,
    }))
    vi.doMock('@/utils/shared/env', async (importOriginal) => ({
        ...await importOriginal<Record<string, unknown>>(),
        ...ENV_KEYS,
        ...env,
    }))
    vi.doMock('fs', () => ({
        default: {
            existsSync: vi.fn(() => true),
            mkdirSync: vi.fn(),
            writeFileSync: vi.fn(() => {
                if (fsWriteError) {
                    throw fsWriteError
                }
            }),
            unlinkSync: vi.fn(),
        },
    }))

    return await import('./logger')
}

afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.doUnmock('winston')
    vi.doUnmock('winston-daily-rotate-file')
    vi.doUnmock('nest-winston')
    vi.doUnmock('@axiomhq/winston')
    vi.doUnmock('./env')
    vi.doUnmock('./privacy')
    vi.doUnmock('@/utils/shared/env')
    vi.doUnmock('fs')
    vi.restoreAllMocks()
    for (const spy of Object.values(winstonSpies)) {
        spy.mockClear()
    }
})

describe('logger 模块初始化分支', () => {
    it('日志文件不可写时关闭文件日志并告警', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { /* 静默初始化告警 */ })

        await loadLogger({ fsWriteError: new Error('EACCES: permission denied') })

        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to create log directory or write to file system, file logging will be disabled:',
            expect.any(Error),
        )

        const DailyRotateFile = (await import('winston-daily-rotate-file')).default as unknown as ReturnType<typeof vi.fn>
        expect(DailyRotateFile).not.toHaveBeenCalled()
    })

    it('Serverless 环境关闭文件日志并告警', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { /* 静默初始化告警 */ })

        await loadLogger({ serverless: true })

        expect(warnSpy).toHaveBeenCalledWith('Serverless environment detected, file logging is disabled')

        const DailyRotateFile = (await import('winston-daily-rotate-file')).default as unknown as ReturnType<typeof vi.fn>
        expect(DailyRotateFile).not.toHaveBeenCalled()
    })

    it('配置 Axiom 时追加日志与异常 / 拒绝处理器 transport', async () => {
        await loadLogger({ env: { AXIOM_DATASET_NAME: 'momei-logs', AXIOM_API_TOKEN: 'token' } })

        const { WinstonTransport } = await import('@axiomhq/winston')
        expect(WinstonTransport).toHaveBeenCalledTimes(2)
        expect(WinstonTransport).toHaveBeenNthCalledWith(1, {
            dataset: 'momei-logs',
            token: 'token',
            level: 'info',
        })
        expect(WinstonTransport).toHaveBeenNthCalledWith(2, {
            dataset: 'momei-logs',
            token: 'token',
        })
    })

    it('开发环境数据库查询记录完整 query 与截断后的参数', async () => {
        vi.stubEnv('NODE_ENV', 'development')

        const { default: logger } = await loadLogger({ env: { LOGFILES: false } })

        logger.database.query({ query: 'SELECT * FROM posts', params: [1, 'a'] })

        expect(winstonSpies.debug).toHaveBeenCalledWith(
            '[Database] Query executed',
            { query: 'SELECT * FROM posts', params: [1, 'a'] },
        )
    })
})
