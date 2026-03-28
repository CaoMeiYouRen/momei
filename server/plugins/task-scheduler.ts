import { CronJob } from 'cron'
import { isServerlessEnvironment } from '../utils/env'
import logger from '@/server/utils/logger'

const DEFAULT_TASK_CRON_EXPRESSION = '*/5 * * * *'

async function runScheduledTaskScan() {
    const [{ initializeDB }, { processScheduledTasks }] = await Promise.all([
        import('../database'),
        import('../services/task'),
    ])
    await initializeDB()
    await processScheduledTasks()
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
    // 默认在生产环境下尝试启用，除非明确设置了 DISABLE_CRON_JOB 或处于无服务器环境
    const disableCron = process.env.DISABLE_CRON_JOB === 'true' || isServerlessEnvironment()

    if (disableCron) {
        logger.info('[TaskScheduler] Cron jobs are disabled in this environment.')
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

        void runFriendLinkHealthCheck()
            .catch((error) => {
                logger.error('[TaskScheduler] Initial friend link health check failed:', error)
            })

        nitroApp.hooks.hook('close', () => {
            logger.info('[TaskScheduler] Stopping cron jobs.')

            void friendLinkHealthCheckJob.stop()
            void scheduledTaskJob.stop()
        })

        logger.info(`[TaskScheduler] Cron jobs registered successfully. Tasks: ${cronExpression}, FriendLinks: ${friendLinkCron}`)
    } catch (err) {
        logger.error('[TaskScheduler] Failed to register cron jobs:', err)
    }
})
