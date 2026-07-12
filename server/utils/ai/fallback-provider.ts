import logger from '@/server/utils/logger'
import type {
    AIProvider,
    AIChatOptions,
    AIChatResponse,
    AIImageOptions,
    AIImageResponse,
    TTSVoiceQuery,
    TTSAudioVoice,
    TTSOptions,
    TranscribeOptions,
    TranscribeResponse,
} from '@/types/ai'

/**
 * AI 提供商降级事件记录结构
 */
export interface AIFallbackEvent {
    timestamp: string
    category: 'text' | 'image'
    primaryProvider: string
    fallbackProvider: string
    operation: string
    primaryError: string
    fallbackSuccess: boolean
    fallbackError?: string
    retryCount: number
}

/**
 * 带有自动重试与降级能力的 AI Provider 包装器。
 *
 * 职责：
 * 1. 优先使用主 Provider 执行操作
 * 2. 主 Provider 失败时记录降级日志
 * 3. 自动切换备用 Provider 重试
 * 4. 如果 fallback 也失败，抛出最终错误（包含主+备的失败详情）
 * 5. 所有降级事件通过 logger 输出，可被监控系统采集
 */
export class FallbackAIProvider implements AIProvider {
    name: string

    private fallbackEvents: AIFallbackEvent[] = []

    constructor(
        private primary: AIProvider,
        private fallback: AIProvider,
        private category: 'text' | 'image',
        private options: {
            maxRetries?: number
            retryDelayMs?: number
        } = {},
    ) {
        this.name = `${primary.name}+fallback:${fallback.name}`
    }

    /**
     * 获取本轮降级事件记录（可用于持久化到任务日志）
     */
    getFallbackEvents(): readonly AIFallbackEvent[] {
        return this.fallbackEvents
    }

    /**
     * 清空降级事件记录
     */
    clearFallbackEvents(): void {
        this.fallbackEvents = []
    }

    /**
     * 带 fallback 的 chat 调用
     * 主提供商失败 → 记录降级 → 尝试备用提供商
     */
    async chat(options: AIChatOptions): Promise<AIChatResponse> {
        return this.withFallback(
            'chat',
            (provider) => {
                if (!provider.chat) {
                    throw new Error(`Provider ${provider.name} does not support chat`)
                }
                return provider.chat(options)
            },
        )
    }

    /**
     * 带 fallback 的图片生成调用
     */
    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        return this.withFallback(
            'generateImage',
            (provider) => {
                if (!provider.generateImage) {
                    throw new Error(`Provider ${provider.name} does not support image generation`)
                }
                return provider.generateImage(options)
            },
        )
    }

    /**
     * 其他 AIProvider 接口方法直接透传主 Provider
     * fallback 主要针对 chat 和 generateImage，其余非核心接口不需要降级
     */
    async check(): Promise<boolean> {
        return this.primary.check?.() ?? true
    }

    async getVoices?(query?: TTSVoiceQuery): Promise<TTSAudioVoice[]> {
        return this.primary.getVoices?.(query) ?? []
    }

    async generateSpeech?(text: string, voice: string | string[], options: TTSOptions): Promise<ReadableStream<Uint8Array>> {
        return this.primary.generateSpeech?.(text, voice, options) as Promise<ReadableStream<Uint8Array>>
    }

    async estimateTTSCost?(text: string, voice: string | string[]): Promise<number> {
        return this.primary.estimateTTSCost?.(text, voice) ?? 0
    }

    async estimateCost?(text: string, voice: string | string[]): Promise<number> {
        return this.primary.estimateCost?.(text, voice) ?? 0
    }

    async transcribe?(options: TranscribeOptions): Promise<TranscribeResponse> {
        return this.primary.transcribe?.(options) as Promise<TranscribeResponse>
    }

    /**
     * 带 fallback 的流式 chat 调用。
     *
     * 注意（设计约束）：
     * 1. AsyncGenerator 是惰性的——生成器函数执行返回 Generator 对象，但实际流逻辑在调用方
     *    迭代 `.next()` 时才发生。因此 try/catch 只能捕获创建 Generator 时的同步异常，
     *    无法捕获流式传输中途的 SSE 断连等异步错误。
     * 2. 流式调用在中途失败时切换 fallback 成本极高（已发送的部分无法回滚），
     *    因此采取保守策略：仅在初始连接阶段检测 primary 不可用时降级到 fallback。
     * 3. 若需要流式中途的完整容错，需在调用层实现 wrapper AsyncGenerator 拦截 yield 异常。
     */
    chatStream?(options: AIChatOptions): AsyncGenerator<import('@/types/ai').AIChatStreamChunk, void, void> {
        if (this.primary.chatStream) {
            try {
                return this.primary.chatStream(options)
            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error(String(error))
                logger.warn(`[FallbackAI] Primary provider ${this.primary.name} chatStream failed, falling back to ${this.fallback.name}`, {
                    category: this.category,
                    error: err.message,
                })
            }
        }

        if (!this.fallback.chatStream) {
            throw new Error(`Neither primary (${this.primary.name}) nor fallback (${this.fallback.name}) support chatStream`)
        }
        return this.fallback.chatStream(options)
    }

    /**
     * 通用 fallback 执行模板
     */
    private async withFallback<TResult>(
        operation: string,
        fn: (provider: AIProvider) => Promise<TResult>,
    ): Promise<TResult> {
        // maxRetries = 最大尝试次数（含首次），默认 2 即首次+1次重试
        const maxAttempts = this.options.maxRetries ?? 2
        const retryDelayMs = this.options.retryDelayMs ?? 1000

        let lastPrimaryError: Error | null = null
        let actualRetries = 0

        // 第一阶段：尝试主 Provider（允许重试）
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn(this.primary)
            } catch (error: unknown) {
                lastPrimaryError = error instanceof Error ? error : new Error(String(error))

                if (this.isNonRetryableError(lastPrimaryError)) {
                    // 非可重试错误，直接进入 fallback
                    break
                }

                if (attempt < maxAttempts) {
                    actualRetries++
                    logger.warn(`[FallbackAI] Primary provider ${this.primary.name} failed (attempt ${attempt}/${maxAttempts}), retrying...`, {
                        category: this.category,
                        operation,
                        error: lastPrimaryError.message,
                    })
                    await this.sleep(retryDelayMs)
                }
            }
        }

        // 第二阶段：记录降级事件
        const fallbackEvent: AIFallbackEvent = {
            timestamp: new Date().toISOString(),
            category: this.category,
            primaryProvider: this.primary.name,
            fallbackProvider: this.fallback.name,
            operation,
            primaryError: lastPrimaryError?.message || 'Unknown error',
            fallbackSuccess: false,
            retryCount: actualRetries,
        }

        logger.warn(`[FallbackAI] Degrading from ${this.primary.name} to ${this.fallback.name} for ${operation}`, {
            category: this.category,
            operation,
            primaryError: lastPrimaryError?.message,
        })

        // 第三阶段：尝试备用 Provider
        try {
            const result = await fn(this.fallback)
            fallbackEvent.fallbackSuccess = true
            this.fallbackEvents.push(fallbackEvent)

            logger.info(`[FallbackAI] Fallback successful: ${this.fallback.name} handled ${operation} after ${this.primary.name} failed`, {
                category: this.category,
                operation,
                fallbackProvider: this.fallback.name,
            })

            return result
        } catch (error: unknown) {
            const fallbackError = error instanceof Error ? error : new Error(String(error))
            fallbackEvent.fallbackSuccess = false
            fallbackEvent.fallbackError = fallbackError.message
            this.fallbackEvents.push(fallbackEvent)

            logger.error(`[FallbackAI] Both primary and fallback providers failed for ${operation}`, {
                category: this.category,
                operation,
                primaryProvider: this.primary.name,
                fallbackProvider: this.fallback.name,
                primaryError: lastPrimaryError?.message,
                fallbackError: fallbackError.message,
            })

            // 抛出综合错误，包含主备双方的失败信息
            throw new Error(
                `AI ${operation} failed. Primary (${this.primary.name}): ${lastPrimaryError?.message}. `
                + `Fallback (${this.fallback.name}): ${fallbackError.message}`,
            )
        }
    }

    /**
     * 判断错误是否不可重试（4xx 客户端错误通常不值得重试）
     */
    private isNonRetryableError(error: Error): boolean {
        // 401/403/404/409 客户端错误不值得重试，但 429 Rate Limit 应重试
        if (/\b40[1349]\b/.test(error.message)) {
            return true
        }
        const nonRetryablePatterns = [
            'does not support',
            'not configured',
            'is disabled',
            'Unauthorized',
            'Forbidden',
            'Not Found',
            'api key',
            'API key',
        ]
        return nonRetryablePatterns.some((pattern) => error.message.includes(pattern))
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
