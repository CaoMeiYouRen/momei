import crypto from 'node:crypto'
import { isValidCustomUrl } from '~/utils/shared/validate'
import { AUTH_SECRET } from '~/utils/shared/env'

export { isValidCustomUrl }

/**
 * 为值生成签名
 * @param value 要签名的值
 * @returns 签名后的值 (format: value.signature)
 */
export const signCookieValue = (value: string): string => {
    if (!AUTH_SECRET) {
        return value
    }
    const signature = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(value)
        .digest('base64url')
    return `${value}.${signature}`
}

/**
 * 验证并提取签名后的值
 * @param signedValue 签名后的值 (format: value.signature)
 * @returns 原始值，如果校验失败则返回 null
 */
export const verifyCookieValue = (signedValue: string | undefined): string | null => {
    if (!signedValue) {
        return null
    }

    const parts = signedValue.split('.')
    if (parts.length !== 2) {
        // 如果没有签名部分，但在开发环境下没有密钥，则降级处理（可选，但为了安全建议严格校验）
        if (!AUTH_SECRET) {
            return signedValue
        }
        return null
    }

    const [value, signature] = parts
    if (!value || !signature) {
        return null
    }

    const expectedSignature = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(value)
        .digest('base64url')

    if (signature === expectedSignature) {
        return value
    }

    return null
}
