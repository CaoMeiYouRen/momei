/**
 * 验证验证码
 * 支持多种提供者：cloudflare-turnstile, google-recaptcha, hcaptcha, captchafox
 */
export async function verifyCaptcha(token?: string, remoteip?: string) {
    const config = useRuntimeConfig()
    const secretKey = config.authCaptchaSecretKey
    const provider = config.public.authCaptcha?.provider as
        | 'cloudflare-turnstile'
        | 'google-recaptcha'
        | 'hcaptcha'
        | 'captchafox'
        | undefined
    const siteKey = config.public.authCaptcha?.siteKey

    if (!secretKey) {
        // 如果没有配置密钥，则跳过验证（通常用于开发环境）
        return true
    }

    if (!token) {
        return false
    }

    let url = ''
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    switch (provider) {
        case 'cloudflare-turnstile':
            url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
            if (remoteip) {
                formData.append('remoteip', remoteip)
            }
            break
        case 'google-recaptcha':
            url = 'https://www.google.com/recaptcha/api/siteverify'
            if (remoteip) {
                formData.append('remoteip', remoteip)
            }
            break
        case 'hcaptcha':
            url = 'https://hcaptcha.com/siteverify'
            if (remoteip) {
                formData.append('remoteip', remoteip)
            }
            if (siteKey) {
                formData.append('sitekey', siteKey)
            }
            break
        case 'captchafox':
            url = 'https://api.captchafox.com/siteverify'
            if (remoteip) {
                formData.append('remoteIp', remoteip) // 注意大小写
            }
            if (siteKey) {
                formData.append('sitekey', siteKey)
            }
            break
        default:
            return true
    }

    try {
        const result = await $fetch<{ success: boolean }>(url, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        return !!result.success
    } catch (error) {
        console.error(`Captcha verification failed for ${provider}:`, error)
        return false
    }
}
