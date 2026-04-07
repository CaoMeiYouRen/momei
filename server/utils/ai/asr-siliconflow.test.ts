import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiliconFlowASRProvider } from './asr-siliconflow'

const fetchMock = vi.fn()

describe('siliconflow asr provider', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        vi.stubGlobal('$fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('normalizes endpoint and sends normalized language and prompt', async () => {
        fetchMock.mockResolvedValueOnce({
            text: 'transcribed text',
            duration: 12,
        })

        const provider = new SiliconFlowASRProvider('demo-key', 'https://api.siliconflow.cn/v1/', 'demo-model')
        const result = await provider.transcribe({
            audioBuffer: Buffer.from('abc'),
            mimeType: 'audio/mpeg',
            fileName: 'clip.mp3',
            language: 'zh-CN',
            prompt: 'speaker: demo',
        })

        expect(fetchMock).toHaveBeenCalledWith('https://api.siliconflow.cn/v1/audio/transcriptions', expect.objectContaining({
            method: 'POST',
            headers: {
                Authorization: 'Bearer demo-key',
            },
        }))

        const request = fetchMock.mock.calls[0]?.[1] as { body: FormData }
        expect(request.body.get('model')).toBe('demo-model')
        expect(request.body.get('language')).toBe('zh')
        expect(request.body.get('prompt')).toBe('speaker: demo')
        expect(request.body.get('file')).toBeInstanceOf(Blob)

        expect(result).toEqual({
            text: 'transcribed text',
            language: 'zh',
            duration: 12,
            confidence: 1,
            usage: {
                audioSeconds: 12,
            },
        })
    })

    it('falls back to provider model and auto language when request does not specify them', async () => {
        fetchMock.mockResolvedValueOnce({
            text: 'auto language text',
        })

        const provider = new SiliconFlowASRProvider('demo-key', 'https://api.siliconflow.cn/v1', 'fallback-model')
        const result = await provider.transcribe({
            audioBuffer: Buffer.from('abc'),
            mimeType: 'audio/wav',
            fileName: 'clip.wav',
        })

        const request = fetchMock.mock.calls[0]?.[1] as { body: FormData }
        expect(request.body.get('model')).toBe('fallback-model')
        expect(request.body.get('language')).toBeNull()
        expect(result.language).toBe('auto')
        expect(result.duration).toBe(0)
    })

    it('wraps upstream failures with createError metadata', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        fetchMock.mockRejectedValueOnce({
            response: { status: 429 },
            data: {
                error: {
                    message: 'Too many requests',
                },
                detail: 'rate_limit',
            },
        })

        const provider = new SiliconFlowASRProvider('demo-key')

        await expect(provider.transcribe({
            audioBuffer: Buffer.from('abc'),
            mimeType: 'audio/mpeg',
            fileName: 'clip.mp3',
        })).rejects.toMatchObject({
            statusCode: 429,
            message: expect.stringContaining('SiliconFlow Error: Too many requests'),
        })

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ASR-SiliconFlow] Error Response:', expect.stringContaining('rate_limit'))
    })
})
