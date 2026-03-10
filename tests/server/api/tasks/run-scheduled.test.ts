import { beforeEach, describe, expect, it, vi } from 'vitest'
import getHandler from '@/server/api/tasks/run-scheduled.get'
import postHandler from '@/server/api/tasks/run-scheduled.post'

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

describe('scheduled task webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.runRoutineMaintenanceTasks.mockResolvedValue({ friendLinksChecked: 2 })

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
    })

    it('应该接受 Vercel Bearer CRON_SECRET', async () => {
        process.env.CRON_SECRET = 'vercel-cron-secret'
        process.env.TASKS_TOKEN = 'legacy-token'

        const result = await postHandler(createEvent({ Authorization: 'Bearer vercel-cron-secret' }))

        expect(mocks.runRoutineMaintenanceTasks).toHaveBeenCalledTimes(1)
        expect(result.code).toBe(200)
        expect(result.data.source).toBe('vercel')
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
})
