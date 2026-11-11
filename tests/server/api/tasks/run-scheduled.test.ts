import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import getHandler from '@/server/api/tasks/run-scheduled.get'
import postHandler, { buildSignaturePayload, generateSignature } from '@/server/api/tasks/run-scheduled.post'

const mocks = vi.hoisted(() => ({
    runRoutineMaintenanceTasks: vi.fn(),
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    runtimeConfig: {
        public: {},
    } as Record<string, any>,
}))

vi.mock('@/server/services/task', () => ({
    runRoutineMaintenanceTasks: mocks.runRoutineMaintenanceTasks,
}))

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()
    return {
        ...actual,
        useRuntimeConfig: () => mocks.runtimeConfig,
    }
})

vi.mock('@/server/utils/logger', () => ({
    default: mocks.logger,
}))

function createEvent(headers: Record<string, string> = {}, query: Record<string, string> = {}, body: Record<string, unknown> = {}) {
    return {
        headers,
        query,
        body,
    } as any
}

/** 构造一组合法的 HMAC 请求头（时间戳取当前时刻，避免容差过期）。 */
function createSignatureHeaders(options: { secret: string, timestamp?: number, source?: 'vercel' | 'cloudflare' | 'external', body?: Record<string, unknown> }): Record<string, string> {
    const timestamp = options.timestamp ?? Date.now()
    const source = options.source ?? 'cloudflare'
    const body = options.body ?? {}
    const signature = generateSignature(
        buildSignaturePayload({ timestamp, source, body: JSON.stringify(body) }),
        options.secret,
    )

    return {
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': String(timestamp),
        'X-Webhook-Source': source,
    }
}

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

describe('scheduled task webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.runRoutineMaintenanceTasks.mockResolvedValue({
            friendLinksChecked: 2,
            aiMediaCompensation: {
                scanned: 1,
                completed: 1,
                failed: 0,
                resumed: 0,
                skipped: 0,
                staleBefore: '2026-04-07T11:55:00.000Z',
            },
        })

        vi.stubGlobal('readBody', vi.fn((event: { body?: Record<string, unknown> }) => Promise.resolve(event.body || {})))
        vi.stubGlobal('getQuery', vi.fn((event: { query?: Record<string, string> }) => event.query || {}))
        vi.stubGlobal(
            'getHeader',
            vi.fn((event: { headers?: Record<string, string> }, name: string) => {
                const key = Object.keys(event.headers || {}).find(
                    (headerName) => headerName.toLowerCase() === name.toLowerCase(),
                )
                return key ? event.headers?.[key] : undefined
            }),
        )

        mocks.runtimeConfig.cronSecret = undefined
        mocks.runtimeConfig.tasksToken = undefined
        mocks.runtimeConfig.webhookSecret = undefined
        delete process.env.CRON_SECRET
        delete process.env.TASKS_TOKEN
        delete process.env.WEBHOOK_SECRET
        process.env.NODE_ENV = 'test'
    })

    afterEach(() => {
        // 回收本文件写入的 env，避免生产环境分支用例污染后续套件
        if (ORIGINAL_NODE_ENV === undefined) {
            delete process.env.NODE_ENV
        } else {
            process.env.NODE_ENV = ORIGINAL_NODE_ENV
        }
        delete process.env.CRON_SECRET
        delete process.env.TASKS_TOKEN
        delete process.env.WEBHOOK_SECRET
    })

    it('应该接受 Vercel Bearer CRON_SECRET', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret'
        process.env.TASKS_TOKEN = 'legacy-token'

        const result = await postHandler(createEvent({ Authorization: 'Bearer vercel-cron-secret' }))

        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
        expect(result.code).toBe(200)
        expect(result.data.source).toBe('vercel')
        expect(result.data.aiMediaCompensation).toEqual(expect.objectContaining({
            scanned: 1,
            completed: 1,
        }))
    })

    it('应该拒绝错误的 Vercel CRON_SECRET', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret'
        process.env.TASKS_TOKEN = 'legacy-token'

        await expect(
            postHandler(createEvent({ Authorization: 'Bearer invalid-secret' })),
        ).rejects.toMatchObject({
            message: 'Unauthorized: Invalid CRON_SECRET',
            statusCode: 401,
        })
    })

    it('应该继续支持旧版 TASKS_TOKEN', async () => {
        process.env.TASKS_TOKEN = 'legacy-token'

        const result = await postHandler(createEvent({ 'X-Tasks-Token': 'legacy-token' }))

        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
        expect(result.data.source).toBe('external')
    })

    it('GET 入口应该复用相同的鉴权逻辑', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret'

        const result = await getHandler(createEvent({ Authorization: 'Bearer vercel-cron-secret' }))

        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
        expect(result.code).toBe(200)
        expect(result.data.source).toBe('vercel')
    })

    // --- HMAC 签名模式（模式 1） ---

    it('应该接受合法的 HMAC 签名并按来源执行', async () => {
        process.env.WEBHOOK_SECRET = 'webhook-secret'

        const body = { ping: 'pong' }
        const result = await postHandler(createEvent(createSignatureHeaders({
            secret: 'webhook-secret',
            source: 'cloudflare',
            body,
        }), {}, body))

        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
        expect(result.data.source).toBe('cloudflare')
    })

    it('应该拒绝签名不匹配的 HMAC 请求', async () => {
        process.env.WEBHOOK_SECRET = 'webhook-secret'

        const headers = createSignatureHeaders({ secret: 'webhook-secret' })
        headers['X-Webhook-Signature'] = 'deadbeef'

        await expect(
            postHandler(createEvent(headers)),
        ).rejects.toMatchObject({
            message: 'Unauthorized: Invalid signature',
            statusCode: 401,
        })
        expect(mocks.logger.warn).toHaveBeenCalledWith(
            '[TasksWebhook] Security validation failed',
            expect.objectContaining({ reason: 'Invalid signature' }),
        )
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('请求体被篡改时 HMAC 校验必须失败', async () => {
        process.env.WEBHOOK_SECRET = 'webhook-secret'

        // 签名基于 { ping: 'pong' }，实际提交 { ping: 'evil' }
        const headers = createSignatureHeaders({
            secret: 'webhook-secret',
            source: 'external',
            body: { ping: 'pong' },
        })

        await expect(
            postHandler(createEvent(headers, {}, { ping: 'evil' })),
        ).rejects.toMatchObject({
            message: 'Unauthorized: Invalid signature',
            statusCode: 401,
        })
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('应该拒绝时间戳超出容差的 HMAC 请求', async () => {
        process.env.WEBHOOK_SECRET = 'webhook-secret'

        const expiredTimestamp = Date.now() - 10 * 60 * 1000
        const headers = createSignatureHeaders({
            secret: 'webhook-secret',
            timestamp: expiredTimestamp,
        })

        await expect(
            postHandler(createEvent(headers)),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: expect.stringContaining('Timestamp expired'),
        })
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('应该在缺少 WEBHOOK_SECRET 时拒绝 HMAC 模式', async () => {
        await expect(
            postHandler(createEvent({
                'X-Webhook-Signature': 'any',
                'X-Webhook-Timestamp': String(Date.now()),
            })),
        ).rejects.toMatchObject({
            message: 'Server Configuration Error',
            statusCode: 500,
        })
        expect(mocks.logger.error).toHaveBeenCalledWith('[TasksWebhook] WEBHOOK_SECRET not configured')
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('应该拒绝非法的 HMAC 来源标识', async () => {
        process.env.WEBHOOK_SECRET = 'webhook-secret'

        const headers = createSignatureHeaders({ secret: 'webhook-secret' })
        headers['X-Webhook-Source'] = 'unknown-source'

        await expect(
            postHandler(createEvent(headers)),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    // --- 简单 Token 模式的 query 入口 + 无安全配置分支 ---

    it('应该支持 query 参数透传旧版 TASKS_TOKEN', async () => {
        process.env.TASKS_TOKEN = 'legacy-token'

        const result = await postHandler(createEvent({}, { token: 'legacy-token' }))

        expect(result.data.source).toBe('external')
        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
    })

    it('应该拒绝错误的旧版 TASKS_TOKEN', async () => {
        process.env.TASKS_TOKEN = 'legacy-token'

        await expect(
            postHandler(createEvent({ 'X-Tasks-Token': 'wrong-token' })),
        ).rejects.toMatchObject({
            message: 'Unauthorized: Invalid Tasks Token',
            statusCode: 401,
        })
        expect(mocks.logger.warn).toHaveBeenCalledWith('[TasksWebhook] Invalid token provided')
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('应该忽略非 Bearer 形态的 Authorization 头', async () => {
        const result = await postHandler(createEvent({ Authorization: 'Token legacy-token' }))

        expect(result.data.source).toBe('external')
        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
    })

    it('生产环境未配置任何安全机制时应拒绝执行', async () => {
        process.env.NODE_ENV = 'production'

        await expect(
            postHandler(createEvent()),
        ).rejects.toMatchObject({
            message: 'Forbidden: Security configuration required in production',
            statusCode: 403,
        })
        expect(mocks.runRoutineMaintenanceTasks).not.toHaveBeenCalled()
    })

    it('开发环境未配置安全机制时应放行并记录警告', async () => {
        const result = await postHandler(createEvent())

        expect(result.data.source).toBe('external')
        expect(mocks.logger.warn).toHaveBeenCalledWith(
            '[TasksWebhook] Running without security in development mode',
        )
    })

    it('任务执行抛错时应转换为 500 并透传错误信息', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret'
        mocks.runRoutineMaintenanceTasks.mockRejectedValueOnce(new Error('maintenance boom'))

        await expect(
            postHandler(createEvent({ Authorization: 'Bearer vercel-cron-secret' })),
        ).rejects.toMatchObject({
            message: 'maintenance boom',
            statusCode: 500,
        })
        expect(mocks.logger.error).toHaveBeenCalledWith(
            '[TasksWebhook] Task execution failed:',
            expect.any(Error),
        )
    })
})
