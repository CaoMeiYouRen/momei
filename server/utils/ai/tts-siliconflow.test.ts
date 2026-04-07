import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiliconFlowTTSProvider } from './tts-siliconflow'

const fetchMock = vi.fn()

describe('siliconflow tts provider', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('prefixes built-in voices with model id and estimates cost by utf8 bytes', async () => {
        const provider = new SiliconFlowTTSProvider({
            apiKey: 'demo-key',
            defaultModel: 'demo-model',
        })

        expect(provider.availableVoices[0]).toMatchObject({
            id: 'demo-model:alex',
            name: 'Alex (沉稳男声)',
        })
        await expect(provider.estimateTTSCost('中文A', 'demo-model:alex')).resolves.toBe(Buffer.from('中文A').length / 1000000 * 0.7)
    })

    it('returns built-in voices plus fetched custom voices when upstream returns a list', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue([
                { uri: 'speech:custom-1', customName: '自定义音色' },
                { uri: 'speech:custom-2' },
                { notVoice: true },
            ]),
        })

        const provider = new SiliconFlowTTSProvider({
            apiKey: 'demo-key',
            endpoint: 'https://api.siliconflow.cn/v1/',
            defaultModel: 'demo-model',
        })
        const voices = await provider.getVoices()

        expect(fetchMock).toHaveBeenCalledWith('https://api.siliconflow.cn/v1/audio/voice/list', {
            headers: {
                Authorization: 'Bearer demo-key',
            },
        })
        expect(voices).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'demo-model:alex' }),
            {
                id: 'speech:custom-1',
                name: '自定义音色',
                language: 'auto',
                gender: 'neutral',
            },
            {
                id: 'speech:custom-2',
                name: 'custom-2',
                language: 'auto',
                gender: 'neutral',
            },
        ]))
    })

    it('swallows custom voice fetch failures and keeps built-in voices', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        fetchMock.mockRejectedValueOnce(new Error('voice list failed'))

        const provider = new SiliconFlowTTSProvider({ apiKey: 'demo-key' })
        const voices = await provider.getVoices()

        expect(voices).toHaveLength(provider.availableVoices.length)
        expect(errorSpy).toHaveBeenCalledWith('Failed to fetch SiliconFlow custom voices:', expect.any(Error))
    })

    it('sends synthesis requests and returns upstream stream body', async () => {
        const stream = new ReadableStream<Uint8Array>()
        fetchMock.mockResolvedValueOnce({
            ok: true,
            body: stream,
        })

        const provider = new SiliconFlowTTSProvider({
            apiKey: 'demo-key',
            endpoint: 'https://api.siliconflow.cn/v1/',
            defaultModel: 'demo-model',
        })

        const result = await provider.generateSpeech('hello world', 'demo-model:alex', {
            outputFormat: 'wav',
            speed: 1.1,
        })

        expect(result).toBe(stream)
        expect(fetchMock).toHaveBeenCalledWith('https://api.siliconflow.cn/v1/audio/speech', expect.objectContaining({
            method: 'POST',
            headers: {
                Authorization: 'Bearer demo-key',
                'Content-Type': 'application/json',
            },
        }))

        const request = fetchMock.mock.calls[0]?.[1] as { body: string }
        expect(JSON.parse(request.body)).toEqual({
            model: 'demo-model',
            input: 'hello world',
            voice: 'demo-model:alex',
            response_format: 'wav',
            speed: 1.1,
            stream: false,
        })
    })

    it('wraps provider errors and missing stream bodies', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({
                    message: 'invalid voice',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                body: null,
            })

        const provider = new SiliconFlowTTSProvider({ apiKey: 'demo-key' })

        await expect(provider.generateSpeech('hello world', 'demo-model:alex', {})).rejects.toMatchObject({
            statusCode: 400,
            message: 'SiliconFlow TTS Error: invalid voice',
        })

        await expect(provider.generateSpeech('hello world', 'demo-model:alex', {})).rejects.toMatchObject({
            statusCode: 500,
            message: 'SiliconFlow TTS Error: No response body',
        })
    })

    it('wraps thrown synthesis failures with fallback metadata', async () => {
        fetchMock.mockRejectedValueOnce(new Error('socket hang up'))

        const provider = new SiliconFlowTTSProvider({ apiKey: 'demo-key' })

        await expect(provider.generateSpeech('hello world', 'demo-model:alex', {})).rejects.toMatchObject({
            statusCode: 500,
            message: 'socket hang up',
        })
    })
})
