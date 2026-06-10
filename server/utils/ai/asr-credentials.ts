import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { requestVolcengineJWTToken } from './volcengine-sts'
import type { ASRMode, ASRCredentialsOptions, ASRCredentials } from '~/types/asr'
import { SettingKey } from '~/types/setting'
import { normalizeDurationSeconds } from '~/utils/shared/duration'

/**
 * 生成前端直连 AI 厂商的临时凭证
 */
const VOLCENGINE_MIN_TOKEN_DURATION_SECONDS = 300
const VOLCENGINE_MAX_TOKEN_DURATION_SECONDS = 43200
const DEFAULT_VOLCENGINE_DIRECT_ENDPOINT = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel'
const DEFAULT_VOLCENGINE_RESOURCE_ID = 'volc.bigasr.sauc.duration'
export const DEFAULT_ASR_CREDENTIAL_TTL_SECONDS = 600
export const MIN_ASR_CREDENTIAL_TTL_SECONDS = VOLCENGINE_MIN_TOKEN_DURATION_SECONDS
export const MAX_ASR_CREDENTIAL_TTL_SECONDS = 3600

export function resolveASRCredentialTtlMilliseconds(value: string | number | null | undefined) {
    return normalizeDurationSeconds(value, DEFAULT_ASR_CREDENTIAL_TTL_SECONDS, {
        min: MIN_ASR_CREDENTIAL_TTL_SECONDS,
        max: MAX_ASR_CREDENTIAL_TTL_SECONDS,
    }) * 1000
}

export async function generateASRCredentials(options: ASRCredentialsOptions): Promise<ASRCredentials> {
    const {
        provider,
        mode,
        connectId,
        settings,
        expiresIn,
    } = options

    const now = Date.now()
    const issuedAt = now
    const expiresAt = now + expiresIn

    if (provider === 'siliconflow') {
        return generateSiliconFlowCredentials({
            mode,
            issuedAt,
            expiresIn,
            expiresAt,
            connectId,
            settings,
        })
    }

    if (provider === 'volcengine') {
        return generateVolcengineCredentials({
            mode,
            issuedAt,
            expiresAt,
            connectId,
            settings,
            expiresIn,
        })
    }

    throw createError({
        statusCode: 400,
        message: `Unsupported ASR provider: ${provider}`,
    })
}

/**
 * 生成 SiliconFlow 凭证
 */
function generateSiliconFlowCredentials(options: {
    mode: ASRMode
    issuedAt: number
    expiresIn: number
    expiresAt: number
    connectId: string
    settings: Record<string, string | undefined>
}): ASRCredentials {
    const { mode, issuedAt, expiresIn, expiresAt, connectId, settings } = options

    const apiKey = settings[SettingKey.ASR_SILICONFLOW_API_KEY]
        || settings[SettingKey.ASR_API_KEY]

    if (!apiKey) {
        throw createError({
            statusCode: 400,
            message: 'SiliconFlow API key not configured',
        })
    }

    const endpoint = settings[SettingKey.ASR_ENDPOINT]
        || 'https://api.siliconflow.cn/v1'

    const model = settings[SettingKey.ASR_MODEL]
        || settings[SettingKey.ASR_SILICONFLOW_MODEL]
        || 'FunAudioLLM/SenseVoiceSmall'

    return {
        provider: 'siliconflow',
        mode,
        authType: 'bearer',
        issuedAt,
        expiresInMs: expiresIn,
        expiresAt,
        endpoint,
        connectId,
        apiKey,
        model,
    }
}

/**
 * 生成火山引擎凭证
 */
async function generateVolcengineCredentials(options: {
    mode: ASRMode
    issuedAt: number
    expiresAt: number
    connectId: string
    settings: Record<string, string | undefined>
    expiresIn: number
}): Promise<ASRCredentials> {
    const { mode, issuedAt, expiresAt, connectId, settings, expiresIn } = options

    // 优先使用 ASR 专用配置，回退到通用配置
    const appId = settings[SettingKey.ASR_VOLCENGINE_APP_ID]
        || settings[SettingKey.VOLCENGINE_APP_ID]
    const accessKey = settings[SettingKey.ASR_VOLCENGINE_ACCESS_KEY]
        || settings[SettingKey.VOLCENGINE_ACCESS_KEY]

    if (!appId || !accessKey) {
        throw createError({
            statusCode: 400,
            message: 'Volcengine credentials not configured',
        })
    }

    const endpoint = settings[SettingKey.ASR_ENDPOINT]
        || DEFAULT_VOLCENGINE_DIRECT_ENDPOINT

    const resourceId = settings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID]
        || settings[SettingKey.ASR_MODEL]
        || DEFAULT_VOLCENGINE_RESOURCE_ID

    const durationSeconds = resolveVolcengineTokenDurationSeconds(expiresIn)
    const jwtToken = await requestVolcengineJWTToken({
        appId,
        accessKey,
        durationSeconds,
    })

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
        authQuery: {
            api_resource_id: resourceId,
            api_app_key: appId,
            api_access_key: `Jwt; ${jwtToken}`,
        },
        resourceId,
        temporaryUserId: randomUUID(),
    }
}

/**
 * 根据本地过期时间换算火山临时 Token 时长
 */
function resolveVolcengineTokenDurationSeconds(expiresIn: number): number {
    const requestedSeconds = Math.ceil(expiresIn / 1000)

    return Math.min(
        VOLCENGINE_MAX_TOKEN_DURATION_SECONDS,
        Math.max(VOLCENGINE_MIN_TOKEN_DURATION_SECONDS, requestedSeconds),
    )
}

/**
 * 获取 ASR 配置状态
 */
export function getASRConfigStatus(settings: Record<string, string | undefined>): {
    enabled: boolean
    siliconflow: boolean
    volcengine: boolean
} {
    const siliconflowApiKey = settings[SettingKey.ASR_SILICONFLOW_API_KEY]
        || settings[SettingKey.ASR_API_KEY]

    const volcengineAppId = settings[SettingKey.ASR_VOLCENGINE_APP_ID]
        || settings[SettingKey.VOLCENGINE_APP_ID]
    const volcengineAccessKey = settings[SettingKey.ASR_VOLCENGINE_ACCESS_KEY]
        || settings[SettingKey.VOLCENGINE_ACCESS_KEY]

    const siliconflow = !!siliconflowApiKey
    const volcengine = !!(volcengineAppId && volcengineAccessKey)

    return {
        enabled: siliconflow || volcengine,
        siliconflow,
        volcengine,
    }
}
