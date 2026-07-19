import { beforeEach, describe, expect, it, vi } from 'vitest'

async function flushAsyncStartup() {
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

const mocks = vi.hoisted(() => {
    const cronJobs: { cronTime: string, onTick: () => Promise<void> | void, stop: ReturnType<typeof vi.fn> }[] = []

    class FakeCronJob {
        stop = vi.fn()

        constructor(
            cronTime: string,
            onTick: () => Promise<void> | void,
        ) {
            cronJobs.push({ cronTime, onTick, stop: this.stop })
        }
    }

    return {
        cronJobs,
        CronJob: FakeCronJob,
        isServerlessEnvironment: vi.fn(),
        initializeDB: vi.fn(),
        processScheduledTasks: vi.fn(),
        scanAndCompensateTimedOutMediaTasks: vi.fn(),
        friendLinkHealthCheck: vi.fn(),
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        },
    }
})

vi.mock('cron', () => ({
    CronJob: mocks.CronJob,
}))

vi.mock('../utils/env', () => ({
    isServerlessEnvironment: mocks.isServerlessEnvironment,
}))

vi.mock('../database', () => ({
    initializeDB: mocks.initializeDB,
}))

vi.mock('../services/task', () => ({
    processScheduledTasks: mocks.processScheduledTasks,
}))

vi.mock('../services/ai/media-task-monitor', () => ({
    scanAndCompensateTimedOutMediaTasks: mocks.scanAndCompensateTimedOutMediaTasks,
}))

vi.mock('../services/friend-link', () => ({
    friendLinkService: {
        runHealthCheck: mocks.friendLinkHealthCheck,
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: mocks.logger,
}))

describe('task scheduler plugin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.cronJobs.length = 0
        mocks.isServerlessEnvironment.mockReturnValue(false)
        mocks.initializeDB.mockResolvedValue(undefined)
        mocks.processScheduledTasks.mockResolvedValue(undefined)
        mocks.scanAndCompensateTimedOutMediaTasks.mockResolvedValue({
            scanned: 0,
            completed: 0,
            failed: 0,
            resumed: 0,
            skipped: 0,
            staleBefore: '2026-04-07T00:00:00.000Z',
        })
        mocks.friendLinkHealthCheck.mockResolvedValue(0)
        delete process.env.DISABLE_CRON_JOB
        delete process.env.ENABLE_CRON_JOB
        delete process.env.TASK_CRON_EXPRESSION
        delete process.env.FRIEND_LINKS_CHECK_CRON
        delete process.env.RUN_STARTUP_FRIEND_LINK_HEALTH_CHECK
        process.env.NODE_ENV = 'test'
    })

    it('should include AI media compensation in the self-hosted scheduled task scan', async () => {
        process.env.ENABLE_CRON_JOB = 'true'
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./task-scheduler')).default
        const nitroApp = {
            hooks: {
                hook: vi.fn(),
            },
        }

        plugin(nitroApp as any)

        expect(mocks.cronJobs).toHaveLength(3)
        expect(mocks.friendLinkHealthCheck).not.toHaveBeenCalled()
        const scheduledTaskJob = mocks.cronJobs.find((job) => job.cronTime === '*/5 * * * *')
        expect(scheduledTaskJob).toBeTruthy()

        await scheduledTaskJob?.onTick()

        expect(mocks.initializeDB).toHaveBeenCalled()
        expect(mocks.processScheduledTasks).toHaveBeenCalledTimes(1)
        expect(mocks.scanAndCompensateTimedOutMediaTasks).toHaveBeenCalledTimes(1)
    })

    it('should skip cron registration outside production', async () => {
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./task-scheduler')).default

        plugin({
            hooks: {
                hook: vi.fn(),
            },
        } as any)

        expect(mocks.cronJobs).toHaveLength(0)
        expect(mocks.initializeDB).not.toHaveBeenCalled()
        expect(mocks.logger.info).toHaveBeenCalledWith('[TaskScheduler] Skipping cron registration outside production.')
    })

    it('should not register cron jobs in serverless environments', async () => {
        mocks.isServerlessEnvironment.mockReturnValue(true)
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./task-scheduler')).default

        plugin({
            hooks: {
                hook: vi.fn(),
            },
        } as any)

        expect(mocks.cronJobs).toHaveLength(0)
        expect(mocks.processScheduledTasks).not.toHaveBeenCalled()
        expect(mocks.scanAndCompensateTimedOutMediaTasks).not.toHaveBeenCalled()
    })

    it('should keep the eager friend link health check in production', async () => {
        process.env.NODE_ENV = 'production'
        vi.stubGlobal('defineNitroPlugin', (plugin: (nitroApp: any) => unknown) => plugin)
        const plugin = (await import('./task-scheduler')).default

        plugin({
            hooks: {
                hook: vi.fn(),
            },
        } as any)

        await flushAsyncStartup()

        expect(mocks.friendLinkHealthCheck).toHaveBeenCalledTimes(1)
    })
})
