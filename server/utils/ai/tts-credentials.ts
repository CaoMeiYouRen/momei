/**
 * TTS 前端直连凭证生成（火山引擎 JWT 方案）
 *
 * 复用 ASR 凭证生成模式：服务端通过 AppId + Access Token 向火山 STS 接口请求
 * 临时 JWT，前端携带 JWT 直连火山 TTS API（HTTP 单向流式 / WebSocket 双向流式）。
 *
 * JWT 有效期默认 10 分钟（范围 5min-12h），前端需在过期前完成音频生成。
 *
 * 方案参考：
 *   - 火山引擎语音技术 API 文档：JWT Token 临时鉴权
 *   - 现有 ASR 直连：server/utils/ai/asr-credentials.ts
 */
import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { z } from 'zod'
import { SettingKey } from '~/types/setting'
import { normalizeDurationSeconds } from '~/utils/shared/duration'

/** 火山 STS Token 端点 */
const VOLCENGINE_STS_TOKEN_ENDPOINT = 'https://openspeech.bytedance.com/api/v1/sts/token'

/** 凭证有效期限制 */
const MIN_CREDENTIAL_TTL_SECONDS = 300 // 5 分钟
const MAX_CREDENTIAL_TTL_SECONDS = 43200 // 12 小时
const DEFAULT_CREDENTIAL_TTL_SECONDS = 600 // 10 分钟

/** TTS 单向流式 (speech) 端点 */
const VOLCENGINE_TTS_SPEECH_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

/** TTS 双向流式 (播客) WebSocket 端点 */
const VOLCENGINE_TTS_PODCAST_ENDPOINT = 'wss://openspeech.bytedance.com/api/v3/sami/podcasttts'

/** 播客模式固定 AppKey */
const VOLCENGINE_PODCAST_APP_KEY = 'aGjiRDfUWi'

/** 默认资源 ID（speech 模式） */
const DEFAULT_RESOURCE_ID = 'volc.service_type.10029'

/** 播客资源 ID */
const PODCAST_RESOURCE_ID = 'volc.service_type.10050'

// ---- 类型定义 ----

export interface TTSCredentialsOptions {
    /** Provider: 仅支持 volcengine */
    provider: 'volcengine'
    /** TTS 模式: speech (HTTP 单向流式) | podcast (WebSocket 双向流式) */
    mode: 'speech' | 'podcast'
    /** 连接 ID（前端生成） */
    connectId: string
    /** 数据库设置映射 */
    settings: Record<string, string | undefined>
    /** 凭证有效期（毫秒） */
    expiresIn: number
}

export interface TTSCredentials {
    provider: 'volcengine'
    mode: 'speech' | 'podcast'
    /** 鉴权方式：query（URL 参数传递 JWT） */
    authType: 'query'
    /** 签发时间 */
    issuedAt: number
    /** 有效期（毫秒） */
    expiresInMs: number
    /** 过期时间 */
    expiresAt: number
    /** TTS API 端点 */
    endpoint: string
    /** 连接 ID */
    connectId: string
    /** 火山 App ID */
    appId: string
    /** 临时 JWT */
    jwtToken: string
    /** URL Query 鉴权参数（WebSocket 播客模式；HTTP 用 Header） */
    authQuery: Record<string, string>
    /** 资源 ID */
    resourceId: string
    /** 播客 AppKey（仅 podcast 模式） */
    appKey?: string
    /** 临时用户 ID */
    temporaryUserId: string
}

// ---- Zod Schema ----

const VolcengineTokenResponseSchema = z.object({
    jwt_token: z.string().min(1),
})

// ---- 公开 API ----

/**
 * 解析 TTS 凭证 TTL（秒 → 毫秒）
 */
export function resolveTTSCredentialTtlMilliseconds(value: string | number | null | undefined): number {
    return normalizeDurationSeconds(value, DEFAULT_CREDENTIAL_TTL_SECONDS, {
        min: MIN_CREDENTIAL_TTL_SECONDS,
        max: MAX_CREDENTIAL_TTL_SECONDS,
    }) * 1000
}

/**
 * 生成 TTS 前端直连凭证
 */
export async function generateTTSCredentials(options: TTSCredentialsOptions): Promise<TTSCredentials> {
    const { provider, mode, connectId, settings, expiresIn } = options

    if (provider !== 'volcengine') {
        throw createError({
            statusCode: 400,
            message: `TTS frontend direct only supports volcengine, got: ${provider}`,
        })
    }

    const now = Date.now()
    const issuedAt = now
    const expiresAt = now + expiresIn

    // 获取 Volcengine 配置（复用通用配置，可被 TTS 专用覆盖）
    const appId = settings[SettingKey.VOLCENGINE_APP_ID] || ''
    const accessKey = settings[SettingKey.VOLCENGINE_ACCESS_KEY] || ''

    if (!appId || !accessKey) {
        throw createError({
            statusCode: 400,
            message: 'Volcengine AppId or Access Key not configured for TTS direct',
        })
    }

    // TTS 模式特定配置
    const isPodcast = mode === 'podcast'
    const endpoint = isPodcast ? VOLCENGINE_TTS_PODCAST_ENDPOINT : VOLCENGINE_TTS_SPEECH_ENDPOINT
    const resourceId = isPodcast ? PODCAST_RESOURCE_ID : DEFAULT_RESOURCE_ID
    const appKey = isPodcast ? VOLCENGINE_PODCAST_APP_KEY : undefined

    // 计算 JWT Token 有效期
    const durationSeconds = resolveCredentialDurationSeconds(expiresIn)

    // 向火山 STS 请求临时 JWT
    const jwtToken = await requestVolcengineJWTToken({
        appId,
        accessKey,
        durationSeconds,
    })

    // 构建 URL Query 鉴权参数（WebSocket 播客模式用；HTTP speech 模式用 Header）
    const authQuery: Record<string, string> = {
        api_resource_id: resourceId,
        api_appid: appId,
        api_access_key: `Jwt; ${jwtToken}`,
    }

    if (appKey) {
        authQuery.api_app_key = appKey
    }

    return {
        provider: 'volcengine',
        mode,
        authType: 'query',
        issuedAt,
        expiresInMs: expiresIn,
        expiresAt,
        endpoint,
        connectId,
        appId,
        jwtToken,
        authQuery,
        resourceId,
        appKey,
        temporaryUserId: randomUUID(),
    }
}

// ---- 内部函数 ----

/**
 * 根据本地过期时间换算火山临时 Token 时长
 */
function resolveCredentialDurationSeconds(expiresIn: number): number {
    const requestedSeconds = Math.ceil(expiresIn / 1000)
    return Math.min(
        MAX_CREDENTIAL_TTL_SECONDS,
        Math.max(MIN_CREDENTIAL_TTL_SECONDS, requestedSeconds),
    )
}

/**
 * 向火山 STS 接口请求临时 JWT
 */
async function requestVolcengineJWTToken(options: {
    appId: string
    accessKey: string
    durationSeconds: number
}): Promise<string> {
    const response = await fetch(VOLCENGINE_STS_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer; ${options.accessKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            appid: options.appId,
            duration: options.durationSeconds,
        }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
        throw createError({
            statusCode: 502,
            message: payload && typeof payload === 'object' && 'message' in payload
                ? String(payload.message)
                : 'Failed to request Volcengine temporary JWT token for TTS',
        })
    }

    const parsed = VolcengineTokenResponseSchema.safeParse(payload)
    if (!parsed.success) {
        throw createError({
            statusCode: 502,
            message: 'Invalid Volcengine temporary JWT token response',
        })
    }

    return parsed.data.jwt_token
}
