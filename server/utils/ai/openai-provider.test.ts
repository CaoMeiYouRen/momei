import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the global $fetch for testing OpenAI API calls
const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

// Mock the url utility
vi.mock('@/utils/shared/url', () => ({
    stripTrailingSlash: (s: string) => s.replace(/\/+$/, ''),
}))

import { OpenAIProvider } from './openai-provider'

describe('OpenAIProvider', () => {
    let provider: OpenAIProvider

    beforeEach(() => {
        vi.clearAllMocks()
        provider = new OpenAIProvider({
            enabled: true,
            provider: 'openai',
            apiKey: 'test-key',
            model: 'gpt-4o',
            maxTokens: 1024,
            temperature: 0.7,
        })
    })

    describe('constructor', () => {
        it('should set default name to "openai"', () => {
            expect(provider.name).toBe('openai')
        })

        it('should override name when provider config is set', () => {
            const custom = new OpenAIProvider({
                enabled: true,
                apiKey: 'test-key',
                model: 'deepseek-chat',
                provider: 'deepseek',
            })
            expect(custom.name).toBe('deepseek')
        })
    })

    // normalizeOpenAIError is a module-level function tested indirectly
    // through error handling paths in chat() and generateImage()

    describe('chat', () => {
        it('should handle API error response', async () => {
            mockFetch.mockRejectedValueOnce({
                statusCode: 401,
                data: { error: { message: 'Incorrect API key provided' } },
                message: 'Unauthorized',
            })

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow(/OpenAI Error/)
        })

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

            await expect(
                provider.chat({ messages: [{ role: 'user', content: 'Hi' }] }),
            ).rejects.toThrow(/Network timeout/)
        })

        it('should handle empty response choices', async () => {
            mockFetch.mockResolvedValueOnce({
                choices: [],
                model: 'gpt-4o',
                usage: undefined,
            })

            const response = await provider.chat({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            expect(response.content).toBe('')
            expect(response.model).toBe('gpt-4o')
            expect(response.usage).toBeUndefined()
        })

        it('should handle partial usage info', async () => {
            mockFetch.mockResolvedValueOnce({
                choices: [{ message: { content: 'Hello' } }],
                model: 'gpt-4o',
                usage: { prompt_tokens: 5 },
            })

            const response = await provider.chat({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            expect(response.usage).toEqual({
                promptTokens: 5,
                completionTokens: 0,
                totalTokens: 0,
            })
        })
    })

    describe('generateImage', () => {
        it('should handle API error in image generation', async () => {
            mockFetch.mockRejectedValueOnce({
                statusCode: 400,
                data: { error: { message: 'Prompt too long' } },
            })

            await expect(
                provider.generateImage({ prompt: 'A cat' }),
            ).rejects.toThrow(/OpenAI Image Error/)
        })

        it('should use custom endpoint when configured', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://custom.com/img.png' }],
            })

            const customProvider = new OpenAIProvider({
                enabled: true,
                provider: 'openai',
                apiKey: 'custom-key',
                endpoint: 'https://custom-api.example.com',
                model: 'dall-e-3',
            })

            await customProvider.generateImage({ prompt: 'Test' })

            expect(mockFetch).toHaveBeenCalledWith(
                'https://custom-api.example.com/images/generations',
                expect.any(Object),
            )
        })

        it('should handle semantic size 1:1 1K default', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://example.com/img.png' }],
            })

            await provider.generateImage({
                prompt: 'Test',
                aspectRatio: '1:1',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            expect(callBody?.size).toBe('1024x1024')
        })

        it('should handle semantic size 16:9 with DALL-E 3', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://example.com/img.png' }],
            })

            const dalleProvider = new OpenAIProvider({
                enabled: true,
                apiKey: 'test-key',
                model: 'dall-e-3',
                provider: 'openai',
            })

            await dalleProvider.generateImage({
                prompt: 'Test',
                aspectRatio: '16:9',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            expect(callBody?.size).toBe('1792x1024')
        })

        it('should handle semantic size 9:16 with DALL-E 3', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://example.com/img.png' }],
            })

            await provider.generateImage({
                prompt: 'Test',
                aspectRatio: '9:16',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            expect(callBody?.size).toBe('1024x1792')
        })

        it('should handle doubao/volcengine provider with 2K semantic size', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://example.com/img.png' }],
            })

            const thirdParty = new OpenAIProvider({
                enabled: true,
                apiKey: 'test-key',
                provider: 'doubao',
                model: 'doubao-1.5-pro',
            })

            await thirdParty.generateImage({
                prompt: 'Test',
                aspectRatio: '16:9',
                size: '2K',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            // 2K scale = 2, base = 1024 * 2 = 2048, 16:9 => 2048*1.77 = 3625 x 2048
            expect(callBody?.size).toMatch(/^\d+x\d+$/)
        })

        it('should handle 512px semantic size for third party', async () => {
            mockFetch.mockResolvedValueOnce({
                data: [{ url: 'https://example.com/img.png' }],
            })

            const thirdParty = new OpenAIProvider({
                enabled: true,
                apiKey: 'test-key',
                provider: 'stable-diffusion',
                model: 'sd-xl',
            })

            await thirdParty.generateImage({
                prompt: 'Test',
                aspectRatio: '1:1',
                size: '512px',
            })

            const callBody = mockFetch.mock.calls[0]?.[1]?.body
            // 512px scale = 0.5, base = 512, 1:1 => 512x512
            expect(callBody?.size).toBe('512x512')
        })
    })

    describe('check', () => {
        it('should return false when API call fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

            const result = await provider.check()
            expect(result).toBe(false)
        })
    })

    describe('chatStream (basic)', () => {
        const originalFetch = globalThis.fetch

        afterEach(() => {
            globalThis.fetch = originalFetch
        })

        it('should handle non-ok response status', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: vi.fn().mockResolvedValue('{"error":{"message":"Invalid API key"}}'),
            })

            const generator = provider.chatStream!({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            await expect(generator.next()).rejects.toThrow(/OpenAI Error/)
        })

        it('should handle empty response body', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: null,
            })

            const generator = provider.chatStream!({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            await expect(generator.next()).rejects.toThrow(/Empty streaming response body/)
        })

        it('should yield chunks from SSE stream', async () => {
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(
                        'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}],"model":"gpt-4o"}\n\n'
                        + 'data: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop"}],"model":"gpt-4o","usage":{"prompt_tokens":5,"completion_tokens":3,"total_tokens":8}}\n\n'
                        + 'data: [DONE]\n\n',
                    ))
                    controller.close()
                },
            })

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            })

            const generator = provider.chatStream!({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            const chunks: any[] = []
            for await (const chunk of generator) {
                chunks.push(chunk)
            }

            expect(chunks).toHaveLength(2)
            expect(chunks[0]?.delta).toBe('Hello')
            expect(chunks[0]?.content).toBe('Hello')
            expect(chunks[1]?.delta).toBe(' world')
            expect(chunks[1]?.content).toBe('Hello world')
            expect(chunks[1]?.usage?.totalTokens).toBe(8)
        })

        it('should handle stream ending with leftover buffer', async () => {
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(
                        'data: {"choices":[{"delta":{"content":"Hi"},"finish_reason":null}],"model":"gpt-4o"}\n\n',
                    ))
                    controller.enqueue(encoder.encode(
                        'data: {"choices":[{"delta":{"content":"!"},"finish_reason":"stop"}],"model":"gpt-4o"}\n',
                    ))
                    controller.close()
                },
            })

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            })

            const generator = provider.chatStream!({
                messages: [{ role: 'user', content: 'Hi' }],
            })

            const chunks: any[] = []
            for await (const chunk of generator) {
                chunks.push(chunk)
            }

            expect(chunks).toHaveLength(2)
            expect(chunks[0]?.delta).toBe('Hi')
            expect(chunks[1]?.delta).toBe('!')
        })
    })
})
