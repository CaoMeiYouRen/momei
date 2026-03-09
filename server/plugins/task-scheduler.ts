import { CronJob } from 'cron'
import { processScheduledTasks } from '../services/task'
import { friendLinkService } from '../services/friend-link'
import { isServerlessEnvironment } from '../utils/env'
import logger from '@/server/utils/logger'

const DEFAULT_TASK_CRON_EXPRESSION = '*/5 * * * *'
const DEFAULT_FRIEND_LINK_INTERVAL_MINUTES = 1440
const MIN_FRIEND_LINK_INTERVAL_MINUTES = 5

function normalizeFriendLinkIntervalMinutes(value: unknown) {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return DEFAULT_FRIEND_LINK_INTERVAL_MINUTES
    }

    return Math.max(MIN_FRIEND_LINK_INTERVAL_MINUTES, Math.floor(parsed))
}

async function resolveFriendLinkIntervalMinutes() {
    try {
        const meta = await friendLinkService.getMeta()
        return normalizeFriendLinkIntervalMinutes(meta.checkIntervalMinutes)
    } catch (error) {
        logger.warn('[TaskScheduler] Failed to resolve friend link interval. Falling back to environment/default value.', error)
        return normalizeFriendLinkIntervalMinutes(process.env.FRIEND_LINKS_CHECK_INTERVAL_MINUTES)
    }
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
                await processScheduledTasks()
            },
            null,
            true, // 立即启动
            'UTC',
        )

        let friendLinkTimer: ReturnType<typeof setTimeout> | null = null
        let disposed = false

        const scheduleNextFriendLinkHealthCheck = async () => {
            if (disposed) {
                return
            }

            const intervalMinutes = await resolveFriendLinkIntervalMinutes()
            const delay = intervalMinutes * 60 * 1000

            logger.info(`[TaskScheduler] Next friend link health check scheduled in ${intervalMinutes} minutes.`)

            friendLinkTimer = setTimeout(async () => {
                try {
                    logger.info(`[TaskScheduler] Running friend link health check: ${new Date().toISOString()}`)
                    await friendLinkService.runHealthCheck()
                } catch (error) {
                    logger.error('[TaskScheduler] Friend link health check failed:', error)
                } finally {
                    await scheduleNextFriendLinkHealthCheck()
                }
            }, delay)
        }

        void friendLinkService.runHealthCheck()
            .catch((error) => {
                logger.error('[TaskScheduler] Initial friend link health check failed:', error)
            })
            .finally(() => {
                void scheduleNextFriendLinkHealthCheck()
            })

        nitroApp.hooks.hook('close', () => {
            logger.info('[TaskScheduler] Stopping cron jobs.')

            disposed = true

            if (friendLinkTimer) {
                clearTimeout(friendLinkTimer)
                friendLinkTimer = null
            }

            void scheduledTaskJob.stop()
        })

        logger.info(`[TaskScheduler] Cron jobs registered successfully. Schedule: ${cronExpression}`)
    } catch (err) {
        logger.error('[TaskScheduler] Failed to register cron jobs:', err)
    }
})
