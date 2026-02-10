import { processScheduledPosts } from '@/server/services/task'

/**
 * 定时任务 Webhook 接口 (供 Serverless 环境触发)
 * 安全：校验 TASKS_TOKEN 环境变量
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const tasksToken = config.tasksToken || process.env.TASKS_TOKEN

    // 1. 安全校验
    if (tasksToken) {
        const query = getQuery(event)
        const headerToken = getHeader(event, 'X-Tasks-Token')
        const requestToken = query.token || headerToken

        if (requestToken !== tasksToken) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized: Invalid Tasks Token',
            })
        }
    } else if (process.env.NODE_ENV === 'production') {
        // 如果未配置 Token，但在非开发环境下调用，出于安全考虑拒绝服务 (除非开发者明确不设防)
        console.warn('[Security] TASKS_TOKEN is not set. Webhook is disabled in production for safety.')
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: TASKS_TOKEN missing in production',
        })
    }

    // 2. 执行任务渲染
    try {
        await processScheduledPosts()
        return {
            code: 200,
            message: 'Scheduled tasks processed successfully',
        }
    } catch (err: any) {
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal Task Error',
        })
    }
})
