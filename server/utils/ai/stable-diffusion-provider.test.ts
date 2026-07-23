import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

vi.mock('@/utils/shared/url', () => ({
    stripTrailingSlash: (s: string) => s.replace(/\/+$/, ''),
}))

import { StableDiffusionProvider } from './stable-diffusion-provider'

describe('StableDiffusionProvider', () => {
    let provider: StableDiffusionProvider

    beforeEach(() => {
        vi.clearAllMocks()
        provider = new StableDiffusionProvider({
            enabled: true,
            provider: 'stable-diffusion',
            apiKey: 'test-key',
            model: 'sd-xl',
        })
    })

    describe('constructor', () => {
        it('should set name to stable-diffusion', () => {
            expect(provider.name).toBe('stable-diffusion')
        })
    })

    describe('generateImage', () => {
        it('should successfully generate image', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['iVBORw0KGgo='],
                info: JSON.stringify({ prompt: 'A cat' }),
            })

            const response = await provider.generateImage({ prompt: 'A cat' })

            expect(response.images[0]?.url).toBe('data:image/png;base64,iVBORw0KGgo=')
            expect(response.model).toBe('stable-diffusion')
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/sdapi/v1/txt2img'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.objectContaining({
                        prompt: 'A cat',
                        steps: 20,
                    }),
                }),
            )
        })

        it('should use custom endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            const customProvider = new StableDiffusionProvider({
                enabled: true,
                provider: 'stable-diffusion',
                apiKey: 'test-key',
                model: 'sd-xl',
                endpoint: 'https://custom-sd.example.com',
            })

            await customProvider.generateImage({ prompt: 'Test' })

            expect(mockFetch).toHaveBeenCalledWith(
                'https://custom-sd.example.com/sdapi/v1/txt2img',
                expect.any(Object),
            )
        })

        it('should parse explicit size (e.g. 512x768)', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            await provider.generateImage({ prompt: 'A cat', size: '512x768' })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            expect(callBody?.width).toBe(512)
            expect(callBody?.height).toBe(768)
        })

        it('should handle semantic size with aspect ratio', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            await provider.generateImage({ prompt: 'A cat', size: '2K', aspectRatio: '16:9' })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            // 2K scale=2, base=2048, 16:9 => 2048*1.77=3625 x 2048
            expect(callBody?.width).toBeGreaterThan(2000)
            expect(callBody?.height).toBe(2048)
        })

        it('should handle 4K semantic size', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            await provider.generateImage({ prompt: 'A cat', size: '4K', aspectRatio: '1:1' })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            // 4K scale=4, base=4096, 1:1 => 4096x4096
            expect(callBody?.width).toBe(4096)
            expect(callBody?.height).toBe(4096)
        })

        it('should pass model in override_settings', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            await provider.generateImage({
                prompt: 'A cat',
                model: 'realistic-vision-v51',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            expect(callBody?.override_settings?.sd_model_checkpoint).toBe('realistic-vision-v51')
        })

        it('should handle empty images array', async () => {
            mockFetch.mockResolvedValueOnce({
                images: [],
                info: '{}',
            })

            await expect(
                provider.generateImage({ prompt: 'A cat' }),
            ).rejects.toThrow(/No images returned/)
        })

        it('should handle API error', async () => {
            mockFetch.mockRejectedValueOnce({
                statusCode: 500,
                data: { error: 'Out of memory' },
                message: 'Internal server error',
            })

            await expect(
                provider.generateImage({ prompt: 'A cat' }),
            ).rejects.toThrow(/Stable Diffusion Error/)
        })

        it('should pass Authorization header when apiKey is set', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            await provider.generateImage({ prompt: 'Test' })

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-key',
                    }),
                }),
            )
        })

        it('should work without apiKey', async () => {
            mockFetch.mockResolvedValueOnce({
                images: ['abc'],
                info: '{}',
            })

            const noKeyProvider = new StableDiffusionProvider({
                enabled: true,
                provider: 'stable-diffusion',
                apiKey: '',
                model: 'sd-xl',
            })

            await noKeyProvider.generateImage({ prompt: 'Test' })

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: expect.any(String),
                    }),
                }),
            )
        })
    })

    describe('check', () => {
        it('should return true when options endpoint is reachable', async () => {
            mockFetch.mockResolvedValueOnce({})

            const result = await provider.check!()
            expect(result).toBe(true)
        })

        it('should return false when options endpoint fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

            const result = await provider.check!()
            expect(result).toBe(false)
        })
    })
})
