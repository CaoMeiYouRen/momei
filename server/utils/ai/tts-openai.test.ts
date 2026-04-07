import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenAITTSProvider } from './tts-openai'

const fetchMock = vi.fn()

describe('openai tts provider', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('returns built-in voices and estimates cost by model tier', async () => {
        const standardProvider = new OpenAITTSProvider({ apiKey: 'demo-key' })
        const hdProvider = new OpenAITTSProvider({ apiKey: 'demo-key', defaultModel: 'tts-1-hd' })

        await expect(standardProvider.getVoices()).resolves.toHaveLength(6)
        await expect(standardProvider.estimateTTSCost('a'.repeat(1000), 'alloy')).resolves.toBe(0.015)
        await expect(hdProvider.estimateCost('a'.repeat(1000), 'alloy')).resolves.toBe(0.03)
    })

    it('normalizes endpoint and returns upstream response body on success', async () => {
        const stream = new ReadableStream<Uint8Array>()
        fetchMock.mockResolvedValueOnce({
            ok: true,
            body: stream,
        })

        const provider = new OpenAITTSProvider({
            apiKey: 'demo-key',
            endpoint: 'https://api.openai.com/v1/',
            defaultModel: 'tts-1-hd',
        })

        const result = await provider.generateSpeech('hello world', 'nova', {
            outputFormat: 'wav',
            speed: 1.25,
        })

        expect(result).toBe(stream)
        expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/audio/speech', expect.objectContaining({
            method: 'POST',
            headers: {
                Authorization: 'Bearer demo-key',
                'Content-Type': 'application/json',
            },
        }))

        const request = fetchMock.mock.calls[0]?.[1] as { body: string }
        expect(JSON.parse(request.body)).toEqual({
            model: 'tts-1-hd',
            input: 'hello world',
            voice: 'nova',
            response_format: 'wav',
            speed: 1.25,
        })
    })

    it('wraps upstream API errors with status metadata', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            json: vi.fn().mockResolvedValue({
                error: {
                    message: 'rate limited',
                },
            }),
        })

        const provider = new OpenAITTSProvider({ apiKey: 'demo-key' })

        await expect(provider.generateSpeech('hello world', 'alloy', {})).rejects.toMatchObject({
            statusCode: 429,
            message: 'OpenAI TTS Error: rate limited',
        })
    })

    it('throws a provider error when response body is missing', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            body: null,
        })

        const provider = new OpenAITTSProvider({ apiKey: 'demo-key' })

        await expect(provider.generateSpeech('hello world', 'alloy', {})).rejects.toMatchObject({
            statusCode: 500,
            message: 'OpenAI TTS Error: No response body',
        })
    })

    it('wraps thrown request failures with fallback metadata', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network down'))

        const provider = new OpenAITTSProvider({ apiKey: 'demo-key' })

        await expect(provider.generateSpeech('hello world', 'alloy', {})).rejects.toMatchObject({
            statusCode: 500,
            message: 'network down',
        })
    })
})
