import type { TTSSynthesisMode } from '@/types/ai'

export interface FrontendDirectTTSResponse {
    strategy: 'frontend-direct'
    provider: 'volcengine'
    mode: TTSSynthesisMode
    estimatedCost: number
    estimatedQuotaUnits: number
    message: string
}

export function shouldUseTTSFrontendDirect(options: {
    provider?: string | null
    isServerless: boolean
    frontendDirectEnabled: boolean
}) {
    return (options.isServerless || options.frontendDirectEnabled)
        && (!options.provider || options.provider === 'volcengine')
}

export function createFrontendDirectTTSResponse(options: {
    mode: TTSSynthesisMode
    estimatedCost: number
    estimatedQuotaUnits: number
}): FrontendDirectTTSResponse {
    return {
        strategy: 'frontend-direct',
        provider: 'volcengine',
        mode: options.mode,
        estimatedCost: options.estimatedCost,
        estimatedQuotaUnits: options.estimatedQuotaUnits,
        message: 'Serverless 环境自动降级：请前端通过 POST /api/ai/tts/credentials 获取临时凭证后直连火山引擎 TTS API。',
    }
}
