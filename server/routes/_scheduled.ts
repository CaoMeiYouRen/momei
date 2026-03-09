import { runRoutineMaintenanceTasks } from '@/server/services/task'
import logger from '@/server/utils/logger'

/**
 * Cloudflare Workers Scheduled Events 处理器
 *
 * 当部署到 Cloudflare Workers/Pages 时，此路由会被定时触发。
 * Cloudflare 内部调用通过 `cf-scheduled` 请求头标识。
 *
 * @see https://developers.cloudflare.com/workers/configuration/cron-triggers/
 */
export default defineEventHandler(async (event) => {
    // Cloudflare 内部触发标识
    const cfScheduled = getHeader(event, 'cf-scheduled')

    // 非 Cloudflare Scheduled 调用，拒绝访问
    if (!cfScheduled) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
        })
    }

    logger.info('[CloudflareScheduled] Triggered by Cloudflare Scheduled Events')

    try {
        const result = await runRoutineMaintenanceTasks()

        return {
            success: true,
            executedAt: new Date().toISOString(),
            source: 'cloudflare',
            friendLinksChecked: result.friendLinksChecked,
        }
    } catch (err: any) {
        logger.error('[CloudflareScheduled] Execution failed:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal Task Error',
        })
    }
})
