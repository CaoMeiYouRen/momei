import { H3Event } from 'h3'
import { TEST_MODE } from '@/utils/shared/env'

interface RateLimitOptions {
    // 窗口时间，秒
    window: number
    // 最大请求次数
    max: number
}

export async function rateLimit(event: H3Event, options: RateLimitOptions) {
    // 测试模式下跳过所有限流，避免 E2E 测试因 429 重试阻塞
    if (TEST_MODE) {
        return
    }

    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const key = `ratelimit:${ip}:${event.path}`
    const { limiterStorage } = await import('@/server/database/storage')
    const $store = limiterStorage
    const count = await $store.increment(key, options.window)

    if (count > options.max) {
        throw createError({
            statusCode: 429,
            message: '请求过于频繁，请稍后再试',
        })
    }
}
