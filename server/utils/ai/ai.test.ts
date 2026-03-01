import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the environment variables module
vi.mock('@/utils/shared/env', async (importOriginal) => ({
    ...await importOriginal<any>(),
    AI_ENABLED: true,
    AI_PROVIDER: 'openai',
    AI_API_KEY: 'test-key',
    AI_MODEL: 'gpt-4o',
    AI_API_ENDPOINT: undefined,
    // Ensure DEMO_MODE is defined for modules that import it
    DEMO_MODE: false,
    AI_MAX_TOKENS: 2048,
    AI_TEMPERATURE: 0.7,
}))

// Mock the settings service
vi.mock('~/server/services/setting', () => ({
    getSettings: vi.fn().mockResolvedValue({
        ai_enabled: 'true',
        ai_api_key: 'test-key',
        ai_provider: 'openai',
        ai_model: 'gpt-4o',
    }),
}))

// Now import the code
import { getAIProvider } from './index'

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('AI Infrastructure', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return OpenAIProvider by default', async () => {
        const provider = await getAIProvider()
        expect(provider.name).toBe('openai')
    })

    it('should call OpenAI API correctly', async () => {
        mockFetch.mockResolvedValueOnce({
            choices: [{ message: { content: 'Hello' } }],
            model: 'gpt-4o',
            usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        })

        const provider = await getAIProvider()
        const response = await provider.chat!({
            messages: [{ role: 'user', content: 'Hi' }],
        })

        expect(response.content).toBe('Hello')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/chat/completions'),
            expect.objectContaining({
                method: 'POST',
                body: expect.objectContaining({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            }),
        )
    })

    it('should verify connection with check()', async () => {
        mockFetch.mockResolvedValueOnce({})
        const provider = await getAIProvider()
        const result = await provider.check!()
        expect(result).toBe(true)
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/chat/completions'),
            expect.objectContaining({
                body: expect.objectContaining({
                    max_tokens: 1,
                }),
            }),
        )
    })

    it('should handle custom endpoints for OpenAI (DeepSeek)', async () => {
        mockFetch.mockResolvedValueOnce({
            choices: [{ message: { content: 'DeepSeek response' } }],
            model: 'deepseek-chat',
        })

        const provider = await getAIProvider({
            provider: 'openai',
            apiKey: 'ds-key',
            model: 'deepseek-chat',
            endpoint: 'https://api.deepseek.com',
        })
        await provider.chat!({ messages: [] })

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.deepseek.com/chat/completions',
            expect.any(Object),
        )
    })

    it('should support Anthropic provider', async () => {
        mockFetch.mockResolvedValueOnce({
            content: [{ type: 'text', text: 'Claude says hi' }],
            model: 'claude-3-5-sonnet',
            usage: { input_tokens: 10, output_tokens: 20 },
        })

        const provider = await getAIProvider({
            provider: 'anthropic',
            apiKey: 'claude-key',
            model: 'claude-3-5-sonnet',
        })
        const response = await provider.chat!({
            messages: [
                { role: 'system', content: 'You are an assistant' },
                { role: 'user', content: 'Hi' },
            ],
        })

        expect(response.content).toBe('Claude says hi')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/messages'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'x-api-key': 'claude-key',
                }),
                body: expect.objectContaining({
                    system: 'You are an assistant',
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            }),
        )
    })

    it('should support Gemini provider', async () => {
        mockFetch.mockResolvedValueOnce({
            candidates: [{ content: { parts: [{ text: 'Gemini says hi' }] } }],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
        })

        const provider = await getAIProvider({
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'gemini-1.5-flash',
        })
        const response = await provider.chat!({
            messages: [{ role: 'user', content: 'Hi' }],
        })

        expect(response.content).toBe('Gemini says hi')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/v1beta/models/gemini-1.5-flash:generateContent?key=gemini-key'),
            expect.any(Object),
        )
    })

    it('should map system message to Gemini systemInstruction', async () => {
        mockFetch.mockResolvedValueOnce({
            candidates: [{ content: { parts: [{ text: 'Gemini says hi' }] } }],
        })

        const provider = await getAIProvider({
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'gemini-3-pro-preview',
        })
        await provider.chat!({
            messages: [
                { role: 'system', content: '你是一只小猪' },
                { role: 'user', content: '你是谁?' },
            ],
        })

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/v1beta/models/gemini-3-pro-preview:generateContent?key=gemini-key'),
            expect.objectContaining({
                body: expect.objectContaining({
                    systemInstruction: expect.objectContaining({
                        parts: [{ text: '你是一只小猪' }],
                    }),
                    contents: [{ role: 'user', parts: [{ text: '你是谁?' }] }],
                }),
            }),
        )
    })

    it('should support Gemini image generation', async () => {
        mockFetch.mockResolvedValueOnce({
            generatedImages: [{ bytesBase64Encoded: 'iVBORw...' }],
        })

        const provider = await getAIProvider({
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'imagen-3.0-generate-001',
        })
        const response = await provider.generateImage!({
            prompt: 'A beautiful sunset',
            aspectRatio: '16:9',
        })

        expect(response.images[0]!.url).toContain('data:image/png;base64,iVBORw')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/v1beta/models/imagen-3.0-generate-001:generateImage?key=gemini-key'),
            expect.objectContaining({
                method: 'POST',
                body: expect.objectContaining({
                    imageGenerationParams: expect.objectContaining({
                        aspectRatio: '16:9',
                    }),
                }),
            }),
        )
    })

    it('should support Gemini preview image model via generateContent', async () => {
        mockFetch.mockResolvedValueOnce({
            candidates: [{
                content: {
                    parts: [{
                        inlineData: {
                            mimeType: 'image/png',
                            data: 'iVBORw-preview...',
                        },
                    }],
                },
            }],
        })

        const provider = await getAIProvider({
            provider: 'gemini',
            apiKey: 'gemini-key',
            model: 'gemini-3-pro-image-preview',
        })
        const response = await provider.generateImage!({
            prompt: 'A beautiful sunset',
            aspectRatio: '16:9',
        })

        expect(response.images[0]!.url).toContain('data:image/png;base64,iVBORw-preview')
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/v1beta/models/gemini-3-pro-image-preview:generateContent?key=gemini-key'),
            expect.objectContaining({
                method: 'POST',
                body: expect.objectContaining({
                    contents: expect.arrayContaining([
                        expect.objectContaining({ role: 'user' }),
                    ]),
                    generationConfig: expect.objectContaining({
                        responseModalities: ['TEXT', 'IMAGE'],
                    }),
                }),
            }),
        )
    })

    it('should support Stable Diffusion image generation', async () => {
        mockFetch.mockResolvedValueOnce({
            images: ['iVBORw...'],
            info: JSON.stringify({ prompt: 'A sunset' }),
        })

        const provider = await getAIProvider({
            provider: 'stable-diffusion',
            endpoint: 'http://localhost:7860',
        })
        const response = await provider.generateImage!({
            prompt: 'A beautiful sunset',
            size: '512x512',
        })

        expect(response.images[0]!.url).toContain('data:image/png;base64,iVBORw')
        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:7860/sdapi/v1/txt2img',
            expect.objectContaining({
                method: 'POST',
                body: expect.objectContaining({
                    width: 512,
                }),
            }),
        )
    })
})
