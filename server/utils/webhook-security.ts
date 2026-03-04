import crypto from 'node:crypto'
import logger from '@/server/utils/logger'

/**
 * Webhook 安全校验配置
 */
export interface WebhookSecurityConfig {
    /** 用于 HMAC 签名的密钥 */
    secret: string
    /** 时间戳容差 (毫秒)，默认 5 分钟 */
    timestampTolerance?: number
    /** 签名算法 */
    algorithm?: 'sha256' | 'sha512'
}

/**
 * Webhook 请求上下文
 */
export interface WebhookRequest {
    /** 请求时间戳 (毫秒) */
    timestamp: number
    /** 签名值 */
    signature: string
    /** 请求来源标识 */
    source?: 'vercel' | 'cloudflare' | 'external'
    /** 请求体 (用于签名计算) */
    body?: string
}

/**
 * 安全校验结果
 */
export interface SecurityCheckResult {
    valid: boolean
    reason?: string
}

const DEFAULT_TIMESTAMP_TOLERANCE = 5 * 60 * 1000 // 5 分钟

/**
 * 生成 HMAC 签名
 * @param payload 签名内容
 * @param secret 密钥
 * @param algorithm 签名算法
 */
export function generateSignature(
    payload: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
): string {
    return crypto
        .createHmac(algorithm, secret)
        .update(payload)
        .digest('hex')
}

/**
 * 验证 HMAC 签名 (使用 timingSafeEqual 防止时序攻击)
 * @param payload 签名内容
 * @param signature 预期签名
 * @param secret 密钥
 * @param algorithm 签名算法
 */
export function verifySignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256',
): boolean {
    try {
        const expectedSignature = generateSignature(payload, secret, algorithm)
        const expectedBuffer = Buffer.from(expectedSignature, 'hex')
        const actualBuffer = Buffer.from(signature, 'hex')

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
 * 验证时间戳是否在容差范围内
 * @param timestamp 请求时间戳 (毫秒)
 * @param tolerance 容差 (毫秒)
 */
export function validateTimestamp(
    timestamp: number,
    tolerance: number = DEFAULT_TIMESTAMP_TOLERANCE,
): SecurityCheckResult {
    const now = Date.now()
    const diff = Math.abs(now - timestamp)

    if (diff > tolerance) {
        return {
            valid: false,
            reason: `Timestamp expired. Diff: ${diff}ms, Tolerance: ${tolerance}ms`,
        }
    }

    return { valid: true }
}

/**
 * 构建签名 payload (时间戳 + 来源 + 请求体)
 * @param req Webhook 请求上下文
 */
export function buildSignaturePayload(req: Pick<WebhookRequest, 'timestamp' | 'source' | 'body'>): string {
    const parts = [String(req.timestamp)]

    if (req.source) {
        parts.push(req.source)
    }

    if (req.body) {
        parts.push(req.body)
    }

    return parts.join('\n')
}

/**
 * 综合 Webhook 安全校验
 * @param req Webhook 请求上下文
 * @param config 安全配置
 */
export function validateWebhookRequest(
    req: WebhookRequest,
    config: WebhookSecurityConfig,
): SecurityCheckResult {
    const { secret, timestampTolerance = DEFAULT_TIMESTAMP_TOLERANCE, algorithm = 'sha256' } = config

    // 1. 校验时间戳
    const timestampResult = validateTimestamp(req.timestamp, timestampTolerance)
    if (!timestampResult.valid) {
        logger.warn('[WebhookSecurity] Timestamp validation failed', {
            timestamp: req.timestamp,
            reason: timestampResult.reason,
        })
        return timestampResult
    }

    // 2. 构建签名 payload
    const payload = buildSignaturePayload(req)

    // 3. 校验签名
    const signatureValid = verifySignature(payload, req.signature, secret, algorithm)
    if (!signatureValid) {
        logger.warn('[WebhookSecurity] Signature validation failed', {
            source: req.source,
            timestamp: req.timestamp,
        })
        return {
            valid: false,
            reason: 'Invalid signature',
        }
    }

    logger.info('[WebhookSecurity] Validation passed', { source: req.source })
    return { valid: true }
}
