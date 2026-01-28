import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { MockAIProvider } from './mock-provider'
import type { AIConfig, AIProvider } from '@/types/ai'
import {
    AI_ENABLED,
    AI_PROVIDER,
    AI_API_KEY,
    AI_MODEL,
    AI_API_ENDPOINT,
    AI_MAX_TOKENS,
    AI_TEMPERATURE,
    DEMO_MODE,
} from '@/utils/shared/env'
import { getSettings } from '~/server/services/setting'

export async function getAIProvider(configOverride?: Partial<AIConfig>): Promise<AIProvider> {
    const dbSettings = await getSettings([
        'ai_enabled',
        'ai_provider',
        'ai_api_key',
        'ai_model',
        'ai_endpoint',
    ])

    const config: AIConfig = {
        enabled: dbSettings.ai_enabled === 'true' || AI_ENABLED,
        provider: (dbSettings.ai_provider as any) || AI_PROVIDER,
        apiKey: (dbSettings.ai_api_key as string) || (AI_API_KEY as string),
        model: dbSettings.ai_model || AI_MODEL,
        endpoint: dbSettings.ai_endpoint || AI_API_ENDPOINT,
        maxTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
    }
    const finalConfig = { ...config, ...configOverride }

    // If Demo mode is enabled, always return MockAIProvider
    const runtimeConfig = useRuntimeConfig()
    if (DEMO_MODE || runtimeConfig.public.demoMode === true) {
        return new MockAIProvider()
    }

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
