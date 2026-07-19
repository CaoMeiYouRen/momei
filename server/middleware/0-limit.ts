import { rateLimit } from '@/server/utils/rate-limit'
import { getRateLimitRules, matchRateLimitRule } from '@/server/utils/rate-limit-config'
import { TEST_MODE } from '@/utils/shared/env'

export default defineEventHandler(async (event) => {
    if (TEST_MODE) {
        return
    }

    const { path, method } = event

    // 仅处理 API 路由
    if (!path.startsWith('/api')) {
        return
    }

    // 按优先级匹配规则并执行限流
    const rules = getRateLimitRules()
    for (const rule of rules) {
        if (!matchRateLimitRule(path, method, rule)) {
            continue
        }

        if (rule.skip) {
            return
        }

        await rateLimit(event, { window: rule.window, max: rule.max })
        return
    }
})
