import { createError } from 'h3'
import { z } from 'zod'

/** 火山 STS Token 端点 */
export const VOLCENGINE_STS_TOKEN_ENDPOINT = 'https://openspeech.bytedance.com/api/v1/sts/token'

export const VolcengineTokenResponseSchema = z.object({
    jwt_token: z.string().min(1),
})

/**
 * 向火山 STS 接口请求临时 JWT
 */
export async function requestVolcengineJWTToken(
    options: {
        appId: string
        accessKey: string
        durationSeconds: number
    },
    context?: string,
): Promise<string> {
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
                : `Failed to request Volcengine temporary JWT token${context ? ` for ${context}` : ''}`,
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
