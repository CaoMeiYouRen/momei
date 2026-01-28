import { AUTH_CAPTCHA_SECRET_KEY, AUTH_CAPTCHA_PROVIDER } from '@/utils/shared/env'

/**
 * 验证验证码
 */
export async function verifyCaptcha(token?: string) {
    if (!AUTH_CAPTCHA_SECRET_KEY) {
        // 如果没有配置密钥，则跳过验证（通常用于开发环境）
        return true
    }

    if (!token) {
        return false
    }

    if (AUTH_CAPTCHA_PROVIDER === 'cloudflare-turnstile') {
        const formData = new FormData()
        formData.append('secret', AUTH_CAPTCHA_SECRET_KEY)
        formData.append('response', token)

        const result = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        })

        return result.success
    }

    // 默认返回 true，或者可以根据需要扩展其他提供者
    return true
}
