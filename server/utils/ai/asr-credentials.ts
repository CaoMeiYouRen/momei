import crypto from 'node:crypto'
import type { ASRMode, ASRCredentialsOptions, ASRCredentials } from '~/types/asr'
import { SettingKey } from '~/types/setting'

/**
 * 生成前端直连 AI 厂商的临时凭证
 *
 * 安全设计:
 * 1. 凭证有效期 5 分钟
 * 2. 绑定用户 ID 和 connectId
 * 3. 安全令牌用于后续回调验证
 *
 * 安全警告:
 * - 直连模式下 API Key 会暴露给前端，请使用有限权限的 API Key
 * - 必须配置 WEBHOOK_SECRET 或 TASKS_TOKEN 环境变量
 */
export function generateASRCredentials(options: ASRCredentialsOptions): ASRCredentials {
    const {
        provider,
        mode,
        userId,
        connectId,
        settings,
        expiresIn,
    } = options

    const now = Date.now()
    const expiresAt = now + expiresIn

    // 生成安全令牌 (用于验证前端请求合法性)
    const securityPayload = `${userId}|${connectId}|${expiresAt}`
    const secret = process.env.WEBHOOK_SECRET || process.env.TASKS_TOKEN

    if (!secret) {
        throw createError({
            statusCode: 500,
            message: 'WEBHOOK_SECRET or TASKS_TOKEN environment variable is required for ASR direct mode',
        })
    }

    const securityToken = crypto
        .createHmac('sha256', secret)
        .update(securityPayload)
        .digest('hex')

    if (provider === 'siliconflow') {
        return generateSiliconFlowCredentials({
            mode,
            expiresAt,
            connectId,
            settings,
            securityToken,
        })
    }

    if (provider === 'volcengine') {
        return generateVolcengineCredentials({
            mode,
            expiresAt,
            connectId,
            settings,
            securityToken,
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
    expiresAt: number
    connectId: string
    settings: Record<string, string | undefined>
    securityToken: string
}): ASRCredentials {
    const { mode, expiresAt, connectId, settings, securityToken } = options

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
        expiresAt,
        endpoint,
        connectId,
        apiKey,
        model,
        securityToken,
    }
}

/**
 * 生成火山引擎凭证
 */
function generateVolcengineCredentials(options: {
    mode: ASRMode
    expiresAt: number
    connectId: string
    settings: Record<string, string | undefined>
    securityToken: string
}): ASRCredentials {
    const { mode, expiresAt, connectId, settings, securityToken } = options

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
        || 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async'

    const resourceId = settings[SettingKey.ASR_MODEL]
        || settings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID]
        || 'volc.seedasr.sauc.duration'

    // 生成火山签名头
    const authHeaders = {
        'X-Api-App-Id': appId,
        'X-Api-App-Key': appId,
        'X-Api-Access-Key': accessKey,
        'X-Api-Resource-Id': resourceId,
        'X-Api-Connect-Id': connectId,
    }

    return {
        provider: 'volcengine',
        mode,
        expiresAt,
        endpoint,
        connectId,
        appId,
        authHeaders,
        resourceId,
        securityToken,
    }
}

/**
 * 验证安全令牌
 */
export function verifyASRSecurityToken(
    userId: string,
    connectId: string,
    expiresAt: number,
    token: string,
): boolean {
    // 检查是否过期
    if (Date.now() > expiresAt) {
        return false
    }

    const secret = process.env.WEBHOOK_SECRET || process.env.TASKS_TOKEN
    if (!secret) {
        console.error('[ASR Security] WEBHOOK_SECRET or TASKS_TOKEN not configured')
        return false
    }

    const expectedPayload = `${userId}|${connectId}|${expiresAt}`
    const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(expectedPayload)
        .digest('hex')

    try {
        const expectedBuffer = Buffer.from(expectedToken, 'hex')
        const actualBuffer = Buffer.from(token, 'hex')

        // 长度不匹配时返回 false
        if (expectedBuffer.length !== actualBuffer.length) {
            return false
        }

        return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    } catch {
        return false
    }
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

    const volcengineAppId = settings[SettingKey.VOLCENGINE_APP_ID]
    const volcengineAccessKey = settings[SettingKey.VOLCENGINE_ACCESS_KEY]

    const siliconflow = !!siliconflowApiKey
    const volcengine = !!(volcengineAppId && volcengineAccessKey)

    return {
        enabled: siliconflow || volcengine,
        siliconflow,
        volcengine,
    }
}
