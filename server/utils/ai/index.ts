import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import type { AIConfig, AIProvider } from '@/types/ai'

export function getAIProvider(configOverride?: Partial<AIConfig>): AIProvider {
    const config = useRuntimeConfig().ai as unknown as AIConfig
    const finalConfig = { ...config, ...configOverride }

    if (!finalConfig.enabled) {
        throw createError({
            statusCode: 503,
            message: 'AI service is disabled',
        })
    }

    if (!finalConfig.apiKey) {
        throw createError({
            statusCode: 500,
            message: 'AI API key is not configured',
        })
    }

    switch (finalConfig.provider) {
        case 'openai':
            return new OpenAIProvider(finalConfig)
        case 'anthropic':
            return new AnthropicProvider(finalConfig)
        default:
            throw createError({
                statusCode: 400,
                message: `Unsupported AI provider: ${finalConfig.provider}`,
            })
    }
}

export * from './openai-provider'
export * from './anthropic-provider'
