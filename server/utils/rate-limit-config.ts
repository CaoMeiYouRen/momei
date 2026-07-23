/**
 * 限流配置模块
 *
 * 集中管理所有 API 路由的限流规则，支持通过环境变量覆盖默认值。
 *
 * 环境变量命名规则：
 *   NUXT_RATE_LIMIT_<RULE_NAME>_MAX=<number>   — 覆盖最大请求数
 *   NUXT_RATE_LIMIT_<RULE_NAME>_WINDOW=<number> — 覆盖时间窗口（秒）
 *
 * 内置规则名称（对应 RULE_NAME）：
 *   EXTERNAL    — /api/external/* 外部 API（CLI/MCP 导入导出）
 *   AI          — /api/ai/* AI 接口
 *   AI_STATUS   — /api/ai/task/status/* AI 任务轮询
 *   SEARCH      — /api/search/* 搜索
 *   SUBSCRIBE   — /api/subscribers/subscribe 订阅
 *   FILE        — /api/file/* 文件上传
 *   VIEWS       — POST /api/posts/:id/views 文章浏览量计数（通过 match 确保只匹配 /views 结尾路径）
 *   DEFAULT_POST — POST/PATCH/PUT/DELETE 通用写请求
 *   DEFAULT_GET — GET 通用读请求
 */

export interface RateLimitRule {
    /** 规则标识名，用于环境变量覆盖 */
    name: string
    /** 路径前缀匹配 */
    prefix: string
    /** 时间窗口（秒），默认 60 */
    window: number
    /** 窗口内最大请求数 */
    max: number
    /** 仅匹配的 HTTP 方法（为空则匹配所有方法） */
    methods?: string[]
    /** 跳过限流（如 auth 路由由 better-auth 处理） */
    skip?: boolean
    /** 规则说明 */
    description?: string
    /** 可选的精准路径匹配函数，在 startsWith 通过后进一步过滤 */
    match?: (path: string) => boolean
}

/**
 * 默认限流规则表（按优先级从高到低排列）
 */
export const DEFAULT_RULES: RateLimitRule[] = [
    // auth 路由的频率限制由 better-auth 提供
    { name: 'AUTH', prefix: '/api/auth', window: 60, max: Infinity, skip: true, description: 'Auth bypass' },

    // 文件上传
    { name: 'FILE', prefix: '/api/file', window: 60, max: 5, description: 'File upload' },
    { name: 'AVATAR', prefix: '/api/user/avatar', window: 60, max: 5, description: 'Avatar upload' },

    // 订阅
    { name: 'SUBSCRIBE', prefix: '/api/subscribers/subscribe', window: 60, max: 3, description: 'Subscribe' },

    // AI 接口
    { name: 'AI_STATUS', prefix: '/api/ai/task/status/', window: 60, max: 30, description: 'AI task polling' },
    { name: 'AI', prefix: '/api/ai', window: 60, max: 10, description: 'AI API' },

    // 搜索（全文搜索压力大）
    { name: 'SEARCH', prefix: '/api/search', window: 60, max: 10, description: 'Search' },

    // 外部 API（CLI/MCP 等批量操作，容忍度更高）
    { name: 'EXTERNAL', prefix: '/api/external', window: 60, max: 60, description: 'External API (import/export)' },

    // 文章浏览量计数（POST /api/posts/:id/views），较严格的限流防止刷量
    // match 确保只匹配 /api/posts/:id/views，不影响 POST /api/posts/ 创建文章
    { name: 'VIEWS', prefix: '/api/posts', window: 600, max: 3, methods: ['POST'], description: 'Post view count', match: (path) => path.endsWith('/views') },

    // 通用写请求
    { name: 'DEFAULT_POST', prefix: '/api', window: 60, max: 20, methods: ['POST', 'PATCH', 'PUT', 'DELETE'], description: 'Default write' },

    // 通用读请求
    { name: 'DEFAULT_GET', prefix: '/api', window: 60, max: 60, description: 'Default read' },
]

/**
 * 解析环境变量覆盖值
 */
function parseEnvOverride(baseName: string): { max?: number, window?: number } {
    const result: { max?: number, window?: number } = {}

    const maxStr = process.env[`NUXT_RATE_LIMIT_${baseName}_MAX`]
    const windowStr = process.env[`NUXT_RATE_LIMIT_${baseName}_WINDOW`]

    if (maxStr) {
        const parsed = Number.parseInt(maxStr, 10)
        if (Number.isFinite(parsed) && parsed > 0) {
            result.max = parsed
        }
    }

    if (windowStr) {
        const parsed = Number.parseInt(windowStr, 10)
        if (Number.isFinite(parsed) && parsed > 0) {
            result.window = parsed
        }
    }

    return result
}

/**
 * 获取最终生效的限流规则列表（合并环境变量覆盖）
 */
export function getRateLimitRules(): RateLimitRule[] {
    return DEFAULT_RULES.map((rule) => {
        const override = parseEnvOverride(rule.name)
        if (!override.max && !override.window) {
            return rule
        }

        return {
            ...rule,
            ...(override.max !== undefined ? { max: override.max } : {}),
            ...(override.window !== undefined ? { window: override.window } : {}),
        }
    })
}

/**
 * 判断请求是否匹配限流规则
 */
export function matchRateLimitRule(
    path: string,
    method: string,
    rule: RateLimitRule,
): boolean {
    if (!path.startsWith(rule.prefix)) {
        return false
    }

    if (rule.methods && rule.methods.length > 0 && !rule.methods.includes(method)) {
        return false
    }

    if (rule.match && !rule.match(path)) {
        return false
    }

    return true
}
