/**
 * TTS 前端直连相关类型定义
 *
 * 从 composables/use-tts-volcengine-direct.ts 抽取，
 * 用于满足 ESLint max-lines 约束。
 */
export interface TTSVolcengineDirectParams {
    /** 已创建的后台任务 ID */
    taskId?: string | null
    /** TTS 模式 */
    mode: 'speech' | 'podcast'
    /** 合成文本 */
    text: string
    /** 音色 ID */
    voice: string
    /** 语速 (0.25 - 2.0) */
    speed?: number
    /** 音量 (0.5 - 2.0) */
    volume?: number
    /** 语言代码 */
    language?: string
    /** 关联文章 ID */
    postId?: string | null
}

export interface TTSVolcengineDirectResult {
    audioUrl: string
    duration: number
}

export interface TTSDirectProviderUsage {
    totalTokens?: number
}

export interface TTSVolcengineGeneratedAudio {
    audioBytes: Uint8Array
    providerUsage: TTSDirectProviderUsage | null
}

/** 服务端下发的 Volcengine TTS 临时凭证 */
export interface VolcengineTTSCredentials {
    provider: 'volcengine'
    mode: 'speech' | 'podcast'
    authType: 'query'
    issuedAt: number
    expiresInMs: number
    expiresAt: number
    endpoint: string
    connectId: string
    appId: string
    jwtToken: string
    authQuery: Record<string, string>
    resourceId: string
    appKey?: string
    temporaryUserId: string
}
