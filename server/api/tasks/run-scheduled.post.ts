import { z } from 'zod'
import {
    validateWebhookRequest,
    buildSignaturePayload,
    generateSignature,
} from '@/server/utils/webhook-security'
import { processScheduledTasks } from '@/server/services/task'
import logger from '@/server/utils/logger'

/**
 * 请求体验证 Schema
 */
const RequestSchema = z.object({
    timestamp: z.number().int().positive(),
    signature: z.string().min(1),
    source: z.enum(['vercel', 'cloudflare', 'external']).optional(),
})

/**
 * 定时任务 Webhook 接口 (供 Serverless 环境触发)
 *
 * 安全机制:
 * 1. HMAC-SHA256 签名验证 (推荐)
 * 2. 时间戳防重放攻击 (5 分钟容差)
 * 3. 兼容简单 Token 模式 (向后兼容)
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const tasksToken = config.tasksToken || process.env.TASKS_TOKEN
    const webhookSecret = config.webhookSecret || process.env.WEBHOOK_SECRET || tasksToken

    // 读取请求信息
    const body = await readBody(event).catch(() => ({}))
    const query = getQuery(event)
    const headerToken = getHeader(event, 'X-Tasks-Token')
    const headerSignature = getHeader(event, 'X-Webhook-Signature')
    const headerTimestamp = getHeader(event, 'X-Webhook-Timestamp')
    const headerSource = getHeader(event, 'X-Webhook-Source')

    // 模式 1: HMAC 签名模式 (推荐)
    if (headerSignature && headerTimestamp) {
        if (!webhookSecret) {
            logger.error('[TasksWebhook] WEBHOOK_SECRET not configured')
            throw createError({
                statusCode: 500,
                statusMessage: 'Server Configuration Error',
            })
        }

        const parseResult = RequestSchema.safeParse({
            timestamp: Number(headerTimestamp),
            signature: headerSignature,
            source: headerSource,
        })

        if (!parseResult.success) {
            throw createError({
                statusCode: 400,
                statusMessage: `Invalid request: ${parseResult.error.message}`,
            })
        }

        const validationResult = validateWebhookRequest(
            {
                timestamp: parseResult.data.timestamp,
                signature: parseResult.data.signature,
                source: parseResult.data.source,
                body: JSON.stringify(body),
            },
            { secret: webhookSecret },
        )

        if (!validationResult.valid) {
            logger.warn('[TasksWebhook] Security validation failed', {
                reason: validationResult.reason,
                source: parseResult.data.source,
            })
            throw createError({
                statusCode: 401,
                statusMessage: `Unauthorized: ${validationResult.reason}`,
            })
        }

        return executeTasks(parseResult.data.source || 'external')
    }

    // 模式 2: 简单 Token 模式 (向后兼容)
    if (tasksToken) {
        const requestToken = query.token || headerToken

        if (requestToken !== tasksToken) {
            logger.warn('[TasksWebhook] Invalid token provided')
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized: Invalid Tasks Token',
            })
        }

        return executeTasks('external')
    }

    // 模式 3: 生产环境未配置安全机制
    if (process.env.NODE_ENV === 'production') {
        logger.warn('[TasksWebhook] No security mechanism configured in production')
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Security configuration required in production',
        })
    }

    // 模式 4: 开发环境无安全配置 (仅允许开发使用)
    logger.warn('[TasksWebhook] Running without security in development mode')
    return executeTasks('external')
})

/**
 * 执行定时任务
 */
async function executeTasks(source: string) {
    try {
        logger.info(`[TasksWebhook] Starting scheduled tasks (triggered by: ${source})`)
        await processScheduledTasks()

        return {
            code: 200,
            message: 'Scheduled tasks processed successfully',
            data: {
                executedAt: new Date().toISOString(),
                source,
            },
        }
    } catch (err: any) {
        logger.error('[TasksWebhook] Task execution failed:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err.message || 'Internal Task Error',
        })
    }
}

// 导出工具函数供外部使用
export { generateSignature, buildSignaturePayload }
