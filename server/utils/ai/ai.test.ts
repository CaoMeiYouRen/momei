import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// Define the mock before importing the code that uses it
mockNuxtImport('useRuntimeConfig', () => () => ({
    ai: {
        enabled: true,
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2048,
    },
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

    it('should return OpenAIProvider by default', () => {
        const provider = getAIProvider()
        expect(provider.name).toBe('openai')
    })

    it('should call OpenAI API correctly', async () => {
        mockFetch.mockResolvedValueOnce({
            choices: [{ message: { content: 'Hello' } }],
            model: 'gpt-4o',
            usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        })

        const provider = getAIProvider()
        const response = await provider.chat({
            messages: [{ role: 'user', content: 'Hi' }],
        })

        expect(response.content).toBe('Hello')
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/chat/completions'), expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Hi' }],
            }),
        }))
    })

    it('should verify connection with check()', async () => {
        mockFetch.mockResolvedValueOnce({})
        const provider = getAIProvider()
        const result = await provider.check()
        expect(result).toBe(true)
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/chat/completions'), expect.objectContaining({
            body: expect.objectContaining({
                max_tokens: 1,
            }),
        }))
    })

    it('should handle custom endpoints for OpenAI (DeepSeek)', async () => {
        mockFetch.mockResolvedValueOnce({
            choices: [{ message: { content: 'DeepSeek response' } }],
            model: 'deepseek-chat',
        })

        const provider = getAIProvider({
            provider: 'openai',
            apiKey: 'ds-key',
            model: 'deepseek-chat',
            endpoint: 'https://api.deepseek.com',
        })
        await provider.chat({ messages: [] })

        expect(mockFetch).toHaveBeenCalledWith('https://api.deepseek.com/chat/completions', expect.any(Object))
    })

    it('should support Anthropic provider', async () => {
        mockFetch.mockResolvedValueOnce({
            content: [{ type: 'text', text: 'Claude says hi' }],
            model: 'claude-3-5-sonnet',
            usage: { input_tokens: 10, output_tokens: 20 },
        })

        const provider = getAIProvider({
            provider: 'anthropic',
            apiKey: 'claude-key',
            model: 'claude-3-5-sonnet',
        })
        const response = await provider.chat({
            messages: [
                { role: 'system', content: 'You are an assistant' },
                { role: 'user', content: 'Hi' },
            ],
        })

        expect(response.content).toBe('Claude says hi')
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/messages'), expect.objectContaining({
            headers: expect.objectContaining({
                'x-api-key': 'claude-key',
            }),
            body: expect.objectContaining({
                system: 'You are an assistant',
                messages: [{ role: 'user', content: 'Hi' }],
            }),
        }))
    })
})
