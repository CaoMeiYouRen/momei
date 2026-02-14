import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest'

const mockFetch = vi.fn()
// @ts-expect-error test-internal
globalThis.$fetch = mockFetch

// 导入要测试的函数
import { verifyCaptcha } from './captcha'

describe('verifyCaptcha', () => {
    beforeAll(() => {
        // useNuxtApp() 可能会被初始化
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const setMockConfig = (secret: string, provider: string = 'cloudflare-turnstile') => {
        const app = useNuxtApp()
        // 使用 Object.assign 注入配置
        Object.assign(app.$config, {
            authCaptchaSecretKey: secret,
            public: {
                ...app.$config.public,
                authCaptcha: {
                    provider,
                    siteKey: 'test-site-key',
                },
            },
        })
    }

    it('如果没有配置 secretKey，应返回 true', async () => {
        setMockConfig('')
        const result = await verifyCaptcha('test-token')
        expect(result).toBe(true)
    })

    it('如果 token 为空，应返回 false', async () => {
        setMockConfig('test-secret')
        const result = await verifyCaptcha('')
        expect(result).toBe(false)
    })

    it('未知 provider 应返回 true', async () => {
        setMockConfig('test-secret', 'unknown')
        const result = await verifyCaptcha('test-token')
        expect(result).toBe(true)
    })

    const providers = [
        { name: 'cloudflare-turnstile', url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify' },
        { name: 'google-recaptcha', url: 'https://www.google.com/recaptcha/api/siteverify' },
        { name: 'hcaptcha', url: 'https://hcaptcha.com/siteverify' },
        { name: 'captchafox', url: 'https://api.captchafox.com/siteverify' },
    ]

    providers.forEach((provider) => {
        describe('Provider: ${provider.name}', () => {
            it('验证成功应返回 true', async () => {
                setMockConfig('test-secret', provider.name)
                mockFetch.mockResolvedValueOnce({ success: true })

                const result = await verifyCaptcha('test-token', '127.0.0.1')
                expect(result).toBe(true)
                expect(mockFetch).toHaveBeenCalledWith(provider.url, expect.objectContaining({
                    method: 'POST',
                }))
            })

            it('验证失败应返回 false', async () => {
                setMockConfig('test-secret', provider.name)
                mockFetch.mockResolvedValueOnce({ success: false })

                const result = await verifyCaptcha('test-token')
                expect(result).toBe(false)
            })

            it('网络错误应返回 false', async () => {
                setMockConfig('test-secret', provider.name)
                mockFetch.mockRejectedValueOnce(new Error('Network error'))

                const result = await verifyCaptcha('test-token')
                expect(result).toBe(false)
            })
        })
    })
})
