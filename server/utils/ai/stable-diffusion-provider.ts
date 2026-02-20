import type { AIConfig, AIProvider, AIImageOptions, AIImageResponse } from '@/types/ai'

/**
 * Stable Diffusion WebUI API Provider 实现
 * 重点支持图像生成 (txt2img)
 */
export class StableDiffusionProvider implements AIProvider {
    name = 'stable-diffusion'
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
    }

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        // SD WebUI API 通常不需要 API Key，但如果用户设置了鉴权，可以在 headers 中处理
        const endpoint = this.config.endpoint || 'http://127.0.0.1:7860'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint

        const [width, height] = (options.size || '1024x1024').split('x').map((num) => parseInt(num))

        try {
            const response = await $fetch<any>(`${baseUrl}/sdapi/v1/txt2img`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 如果有 API Key，处理为 Basic Auth 或回退
                    ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
                },
                body: {
                    prompt: options.prompt,
                    // negative_prompt: options.negativePrompt, // AIImageOptions 目前没有这个字段，可以通过 prompt 注入或以后扩展
                    steps: 20,
                    width: width || 1024,
                    height: height || 1024,
                    batch_size: options.n || 1,
                    cfg_scale: 7,
                    sampler_name: 'Euler a',
                    // 如果指定了模型，可以在 override_settings 中切换
                    ...(options.model ? { override_settings: { sd_model_checkpoint: options.model } } : {}),
                },
            })

            if (!response.images || response.images.length === 0) {
                throw new Error('No images returned from Stable Diffusion WebUI')
            }

            return {
                images: response.images.map((base64: string) => ({
                    url: `data:image/png;base64,${base64}`,
                })),
                model: options.model || 'stable-diffusion',
                raw: response.info ? JSON.parse(response.info) : response,
            }
        } catch (error: any) {
            const status = error.statusCode || error.response?.status || 500
            const message = error.data?.error || error.message || 'Stable Diffusion API request failed'

            throw createError({
                statusCode: status,
                message: `Stable Diffusion Error: ${message}`,
            })
        }
    }

    async check?(): Promise<boolean> {
        const endpoint = this.config.endpoint || 'http://127.0.0.1:7860'
        const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        try {
            await $fetch(`${baseUrl}/sdapi/v1/options`)
            return true
        } catch {
            return false
        }
    }
}
