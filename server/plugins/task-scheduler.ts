import { CronJob } from 'cron'
import { isServerlessEnvironment } from '../utils/env'
import logger from '@/server/utils/logger'

const DEFAULT_TASK_CRON_EXPRESSION = '*/5 * * * *'

function shouldRunInitialFriendLinkHealthCheck() {
    return process.env.RUN_STARTUP_FRIEND_LINK_HEALTH_CHECK === 'true' || process.env.NODE_ENV === 'production'
}

function shouldRegisterCronJobs() {
    return process.env.ENABLE_CRON_JOB === 'true' || process.env.NODE_ENV === 'production'
}

async function runScheduledTaskScan() {
    const [{ initializeDB }, { processScheduledTasks }, { scanAndCompensateTimedOutMediaTasks }] = await Promise.all([
        import('../database'),
        import('../services/task'),
        import('../services/ai/media-task-monitor'),
    ])
    await initializeDB()
    await processScheduledTasks()
    await scanAndCompensateTimedOutMediaTasks()
}

async function runFriendLinkHealthCheck() {
    const [{ initializeDB }, { friendLinkService }] = await Promise.all([
        import('../database'),
        import('../services/friend-link'),
    ])
    await initializeDB()
    await friendLinkService.runHealthCheck()
}

/**
 * 自部署环境下的定时任务调度器插件
 */
export default defineNitroPlugin((nitroApp) => {
    // 1. 判断是否需要启用 Cron
    // 默认仅在生产环境下启用；开发/测试环境需要显式设置 ENABLE_CRON_JOB=true
    const isServerless = isServerlessEnvironment()
    const disableCron = process.env.DISABLE_CRON_JOB === 'true' || isServerless

    if (disableCron) {
        logger.info('[TaskScheduler] Cron jobs are disabled in this environment.')
        return
    }

    if (!shouldRegisterCronJobs()) {
        logger.info('[TaskScheduler] Skipping cron registration outside production.')
        return
    }

    // 2. 注册定时任务 (默认每 5 分钟执行一次)
    const cronExpression = process.env.TASK_CRON_EXPRESSION || DEFAULT_TASK_CRON_EXPRESSION

    try {
        const scheduledTaskJob = new CronJob(
            cronExpression,
            async () => {
                logger.info(`[TaskScheduler] Running scheduled task scan: ${new Date().toISOString()}`)
                await runScheduledTaskScan()
            },
            null,
            true, // 立即启动
            'UTC',
        )

        // 默认友链巡检 Cron 表达式 (每天凌晨 2 点)
        const DEFAULT_FRIEND_LINK_CRON = '0 2 * * *'
        const friendLinkCron = process.env.FRIEND_LINKS_CHECK_CRON || DEFAULT_FRIEND_LINK_CRON

        const friendLinkHealthCheckJob = new CronJob(
            friendLinkCron,
            async () => {
                try {
                    logger.info(`[TaskScheduler] Running friend link health check: ${new Date().toISOString()}`)
                    await runFriendLinkHealthCheck()
                } catch (error) {
                    logger.error('[TaskScheduler] Friend link health check failed:', error)
                }
            },
            null,
            true,
            'UTC',
        )

        if (shouldRunInitialFriendLinkHealthCheck()) {
            void runFriendLinkHealthCheck()
                .catch((error) => {
                    logger.error('[TaskScheduler] Initial friend link health check failed:', error)
                })
        } else {
            logger.info('[TaskScheduler] Skipping eager friend link health check outside production.')
        }

        // AI 任务清理 Cron (每天凌晨 3 点)
        const AI_TASK_CLEANUP_CRON = '0 3 * * *'
        const aiTaskCleanupJob = new CronJob(
            AI_TASK_CLEANUP_CRON,
            async () => {
                const { purgeExpiredAiTasks } = await import('../services/ai/cleanup')
                const { deleted } = await purgeExpiredAiTasks()
                if (deleted > 0) {
                    logger.info(`[TaskScheduler] AI task cleanup completed: ${deleted} tasks purged.`)
                }
            },
            null,
            true,
            'UTC',
        )

        nitroApp.hooks.hook('close', () => {
            logger.info('[TaskScheduler] Stopping cron jobs.')

            void friendLinkHealthCheckJob.stop()
            void scheduledTaskJob.stop()
            void aiTaskCleanupJob.stop()
        })

        logger.info(`[TaskScheduler] Cron jobs registered successfully. Tasks: ${cronExpression}, FriendLinks: ${friendLinkCron}, AITaskCleanup: ${AI_TASK_CLEANUP_CRON}`)
    } catch (err) {
        logger.error('[TaskScheduler] Failed to register cron jobs:', err)
    }
})
