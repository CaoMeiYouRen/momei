/**
 * ASR (语音识别) 相关类型定义
 */

/**
 * ASR 提供者
 */
export type ASRProvider = 'siliconflow' | 'volcengine'

/**
 * ASR 模式
 */
export type ASRMode = 'batch' | 'stream'

/**
 * ASR 凭证选项
 */
export interface ASRCredentialsOptions {
    provider: ASRProvider
    mode: ASRMode
    connectId: string
    settings: Record<string, string | undefined>
    expiresIn: number
}

/**
 * ASR 凭证响应
 */
export interface ASRCredentials {
    /** 提供者 */
    provider: ASRProvider
    /** 模式 */
    mode: ASRMode
    /** 鉴权方式 */
    authType: 'bearer' | 'query'
    /** 服务端签发时间 (毫秒时间戳) */
    issuedAt: number
    /** 服务端返回的有效期 (毫秒) */
    expiresInMs: number
    /** 过期时间 (毫秒时间戳) */
    expiresAt: number
    /** 连接端点 */
    endpoint: string
    /** 连接 ID */
    connectId: string
    /** SiliconFlow API Key (仅 batch 模式) */
    apiKey?: string
    /** 模型名称 */
    model?: string
    /** 火山引擎 App ID (仅 stream 模式) */
    appId?: string
    /** 火山引擎临时 JWT (仅 stream 模式) */
    jwtToken?: string
    /** 火山引擎 Query 鉴权参数 (仅 stream 模式) */
    authQuery?: Record<string, string>
    /** 资源 ID */
    resourceId?: string
    /** 前端会话使用的临时 UID */
    temporaryUserId?: string
}

/**
 * 音频压缩级别
 */
export type CompressionLevel = 'none' | 'light' | 'medium' | 'aggressive'

/**
 * 压缩选项
 */
export interface CompressionOptions {
    level: CompressionLevel
    targetSampleRate?: number
    targetBitrate?: number
}

/**
 * 压缩结果
 */
export interface CompressionResult {
    blob: Blob
    mimeType: string
    originalSize: number
    compressedSize: number
    compressionRatio: number
}

/**
 * 浏览器支持的格式
 */
export interface SupportedFormats {
    opus: boolean
    webm: boolean
    mp3: boolean
    wav: boolean
}

/**
 * 压缩策略推荐
 */
export interface CompressionStrategy {
    mimeType: string
    codec: string
    sampleRate: number
}

/**
 * ASR 任务状态
 */
export type ASRTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * ASR 任务信息
 */
export interface ASRTask {
    id: string
    status: ASRTaskStatus
    progress: number
    result?: {
        text: string
        duration?: number
        language?: string
    }
    error?: string
    createdAt: string
    updatedAt: string
}

/**
 * 直连 ASR 选项
 */
export interface ASRDirectOptions {
    provider: ASRProvider
    mode: ASRMode
    language?: string
    compressionLevel?: CompressionLevel
}
