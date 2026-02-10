import { CronJob } from 'cron'
import { processScheduledTasks } from '../services/task'
import { isServerlessEnvironment } from '../utils/env'
import logger from '@/server/utils/logger'

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
    const cronExpression = (process.env.TASK_CRON_EXPRESSION as string) || '*/5 * * * *'

    try {
        const job = new CronJob(
            cronExpression,
            async () => {
                logger.info(`[TaskScheduler] Running scheduled task scan: ${new Date().toISOString()}`)
                await processScheduledTasks()
            },
            null,
            true, // 立即启动
            'UTC',
        )

        nitroApp.hooks.hook('close', () => {
            logger.info('[TaskScheduler] Stopping cron jobs.')
            void job.stop()
        })

        logger.info(`[TaskScheduler] Cron jobs registered successfully. Schedule: ${cronExpression}`)
    } catch (err) {
        logger.error('[TaskScheduler] Failed to register cron jobs:', err)
    }
})
