/**
 * CLI 侧请求频率限制器
 *
 * 特性：
 * - 令牌桶算法，限制每秒请求数（RPS）
 * - 支持短时突发（burst）
 * - 429 自动重试（指数退避）
 * - 可配置最大重试次数
 */

const kMinDelay = 1 // 最小延迟间隔（秒）

export interface RateLimiterOptions {
    /** 每秒允许的最大请求数，默认 5 */
    rps?: number
    /** 最大并发数，默认 3 */
    concurrency?: number
    /** 429 重试最大次数，默认 3 */
    maxRetries?: number
    /** 429 重试基础等待时间（毫秒），默认 1000 */
    baseRetryDelayMs?: number
}

interface PendingTask {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
    started: boolean
}

export class RateLimiter {
    private rps: number
    private maxConcurrency: number
    private maxRetries: number
    private baseRetryDelayMs: number

    /** 令牌桶当前令牌数 */
    private tokens: number
    /** 上次令牌补充时间 */
    private lastRefill: number
    /** 当前正在执行的任务数 */
    private inflight = 0
    /** 等待队列 */
    private queue: PendingTask[] = []

    constructor(options: RateLimiterOptions = {}) {
        this.rps = options.rps ?? 5
        this.maxConcurrency = options.concurrency ?? 3
        this.maxRetries = options.maxRetries ?? 3
        this.baseRetryDelayMs = options.baseRetryDelayMs ?? 1000
        this.tokens = this.rps // 初始满令牌
        this.lastRefill = Date.now()
    }

    /**
     * 补充令牌（每秒调用一次）
     */
    private refillTokens(): void {
        const now = Date.now()
        const elapsed = (now - this.lastRefill) / 1000
        this.tokens = Math.min(this.rps, this.tokens + elapsed * this.rps)
        this.lastRefill = now
    }

    /**
     * 获取一个令牌（阻塞直到可用）
     */
    private async acquireToken(): Promise<void> {
        this.refillTokens()

        if (this.tokens >= 1 && this.inflight < this.maxConcurrency) {
            this.tokens -= 1
            this.inflight += 1
            return
        }

        // 等待至少 kMinDelay 秒再重试
        await new Promise((resolve) => setTimeout(resolve, kMinDelay * 1000))
        return this.acquireToken()
    }

    /**
     * 释放令牌（任务完成后调用）
     */
    private releaseToken(): void {
        this.inflight -= 1
        this.processQueue()
    }

    /**
     * 处理等待队列
     */
    private processQueue(): void {
        while (this.queue.length > 0 && this.tokens >= 1 && this.inflight < this.maxConcurrency) {
            const task = this.queue.shift()!
            if (!task.started) {
                task.started = true
                this.tokens -= 1
                this.inflight += 1
                task.resolve(null)
            }
        }
    }

    /**
     * 判断错误是否为 429（可重试）
     */
    private isRetryableError(error: unknown): boolean {
        if (error && typeof error === 'object') {
            const err = error as { statusCode?: number, message?: string, status?: number }
            return err.statusCode === 429 || err.status === 429
                || (typeof err.message === 'string' && err.message.includes('429'))
        }
        return false
    }

    /**
     * 等待指定时间（指数退避）
     */
    private async waitForRetry(attempt: number): Promise<void> {
        const delay = this.baseRetryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500
        await new Promise((resolve) => setTimeout(resolve, delay))
    }

    /**
     * 在限流状态下执行异步函数
     * - 自动控制请求速率
     * - 遇到 429 自动重试（指数退避）
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // 等待令牌
        await this.acquireToken()

        let lastError: unknown

        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            try {
                const result = await fn()
                this.releaseToken()
                return result
            } catch (error: unknown) {
                lastError = error

                if (this.isRetryableError(error) && attempt <= this.maxRetries) {
                    await this.waitForRetry(attempt)
                    continue
                }

                this.releaseToken()
                throw error
            }
        }

        this.releaseToken()
        throw lastError
    }

    /**
     * 批量执行任务（自动控制并发和速率）
     */
    async executeBatch<T>(
        tasks: (() => Promise<T>)[],
        onProgress?: (completed: number, total: number) => void,
    ): Promise<T[]> {
        const results: T[] = []
        let completed = 0
        const total = tasks.length

        for (let i = 0; i < tasks.length; i += this.maxConcurrency) {
            const batch = tasks.slice(i, i + this.maxConcurrency)
            const batchResults = await Promise.allSettled(
                batch.map((task) => this.execute(task)),
            )

            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value)
                } else {
                    throw result.reason
                }
            }

            completed += batch.length
            if (onProgress) {
                onProgress(completed, total)
            }
        }

        return results
    }
}
