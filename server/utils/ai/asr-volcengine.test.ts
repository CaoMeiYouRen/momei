import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    DEFAULT_VOLCENGINE_NOSTREAM_ENDPOINT,
    DEFAULT_VOLCENGINE_RESOURCE_ID,
    VolcengineASRProvider,
    buildVolcengineAudioRequestFrame,
    buildVolcengineFullClientRequestFrame,
    extractVolcengineTranscript,
    parseVolcengineServerPacket,
    resolveVolcengineAudioConfig,
} from './asr-volcengine'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_SERIALIZATION,
    buildVolcengineBinaryFrame,
} from './volcengine-protocol'

const { MockWebSocket, loggerMock } = vi.hoisted(() => {
    type EventHandler = (...args: any[]) => void

    class HoistedMockWebSocket {
        static instances: HoistedMockWebSocket[] = []

        url: string
        options: Record<string, any>
        handlers = new Map<string, EventHandler[]>()
        send = vi.fn()
        close = vi.fn(() => {
            this.emit('close')
        })

        constructor(url: string, options: Record<string, any> = {}) {
            this.url = url
            this.options = options
            HoistedMockWebSocket.instances.push(this)
        }

        on(event: string, handler: EventHandler) {
            const current = this.handlers.get(event) || []
            current.push(handler)
            this.handlers.set(event, current)
            return this
        }

        emit(event: string, ...args: any[]) {
            for (const handler of this.handlers.get(event) || []) {
                handler(...args)
            }
        }
    }

    return {
        MockWebSocket: HoistedMockWebSocket,
        loggerMock: {
            info: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
    }
})

vi.mock('ws', () => ({
    default: MockWebSocket,
}))

vi.mock('../logger', () => ({
    default: loggerMock,
}))

function buildServerResponsePacket(payload: Record<string, any>, options?: { sequence?: number, isFinal?: boolean }) {
    const sequenceBuffer = Buffer.alloc(4)
    sequenceBuffer.writeInt32BE(options?.sequence || 1, 0)

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullServerResponse,
        messageTypeFlags: options?.isFinal ? 0b0010 : 0b0001,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.gzip,
        prefixBuffers: [sequenceBuffer],
        payload: Buffer.from(JSON.stringify(payload), 'utf-8'),
    })
}

function buildErrorPacket(code: number, message: string) {
    const messageBuffer = Buffer.from(message, 'utf-8')
    const raw = Buffer.alloc(12 + messageBuffer.length)
    raw.writeUInt8(0x11, 0)
    raw.writeUInt8(0xf0, 1)
    raw.writeUInt8(0x10, 2)
    raw.writeUInt8(0x00, 3)
    raw.writeUInt32BE(code, 4)
    raw.writeUInt32BE(messageBuffer.length, 8)
    messageBuffer.copy(raw, 12)
    return raw
}

describe('volcengine asr provider', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('normalizes audio mime types to volcengine format and codec', () => {
        expect(resolveVolcengineAudioConfig('audio/pcm')).toEqual({ format: 'pcm', codec: 'raw' })
        expect(resolveVolcengineAudioConfig('audio/ogg')).toEqual({ format: 'ogg', codec: 'opus' })
        expect(resolveVolcengineAudioConfig('audio/webm')).toEqual({ format: 'webm', codec: 'opus' })
        expect(resolveVolcengineAudioConfig('audio/wav')).toEqual({ format: 'wav', codec: 'raw' })
        expect(resolveVolcengineAudioConfig('audio/mpeg')).toEqual({ format: 'ogg', codec: 'opus' })
    })

    it('builds request frames with expected sequence metadata', () => {
        const requestFrame = buildVolcengineFullClientRequestFrame({ request: { model_name: 'bigmodel' } }, 7)
        expect((requestFrame.readUInt8(1) >> 4) & 0x0f).toBe(VOLCENGINE_MESSAGE_TYPE.fullClientRequest)
        expect(requestFrame.readInt32BE(4)).toBe(7)

        const audioFrame = buildVolcengineAudioRequestFrame(Buffer.from('abc'), 3, true)
        expect((audioFrame.readUInt8(1) >> 4) & 0x0f).toBe(VOLCENGINE_MESSAGE_TYPE.audioOnlyRequest)
        expect(audioFrame.readInt32BE(4)).toBe(-3)
    })

    it('parses server packets and transcript payloads from multiple shapes', () => {
        const responsePacket = parseVolcengineServerPacket(buildServerResponsePacket({
            result: {
                text: 'primary text',
            },
        }, { isFinal: true }))

        expect(responsePacket).toMatchObject({
            type: 'response',
            isFinal: true,
            data: {
                result: {
                    text: 'primary text',
                },
            },
        })
        expect(extractVolcengineTranscript({ result: { text: 'primary text' } })).toBe('primary text')
        expect(extractVolcengineTranscript({ result: [{ text: 'foo' }, { text: 'bar' }] })).toBe('foobar')
        expect(extractVolcengineTranscript({ text: 'fallback text' })).toBe('fallback text')
        expect(extractVolcengineTranscript(null)).toBe('')

        const errorPacket = parseVolcengineServerPacket(buildErrorPacket(401, 'invalid token'))
        expect(errorPacket).toEqual({
            type: 'error',
            code: 401,
            message: 'invalid token',
            messageTypeFlags: 0,
        })
    })

    it('uses configured endpoint and model fallback in getters and health check', async () => {
        const provider = new VolcengineASRProvider({
            appId: 'app-id',
            token: 'token',
            cluster: 'cluster-model',
        })

        expect(provider.model).toBe('cluster-model')
        await expect(provider.check()).resolves.toBe(true)
        await expect(new VolcengineASRProvider({ appId: '', token: '' }).check()).resolves.toBe(false)
        expect(new VolcengineASRProvider({ appId: 'app-id', token: 'token' }).model).toBe(DEFAULT_VOLCENGINE_RESOURCE_ID)
    })

    it('rejects transcribe when credentials are missing', async () => {
        const provider = new VolcengineASRProvider({ appId: '', token: '' })

        await expect(provider.transcribe({
            audioBuffer: Buffer.from('abc'),
            mimeType: 'audio/webm',
            fileName: 'clip.webm',
        })).rejects.toMatchObject({
            statusCode: 500,
            message: 'Volcengine ASR Error: AppID 或 AccessKey 未配置',
        })
    })

    it('sends request frames and resolves on final response packet', async () => {
        const provider = new VolcengineASRProvider({
            appId: 'app-id',
            token: 'token',
            resourceId: 'resource-id',
        })

        const pending = provider.transcribe({
            audioBuffer: Buffer.from('voice'),
            mimeType: 'audio/webm',
            fileName: 'clip.webm',
            language: 'zh-CN',
        })

        const ws = MockWebSocket.instances[0]
        expect(ws?.url).toBe(DEFAULT_VOLCENGINE_NOSTREAM_ENDPOINT)
        expect(ws?.options.headers['X-Api-App-Id']).toBe('app-id')
        expect(ws?.options.headers['X-Api-Access-Key']).toBe('token')
        expect(ws?.options.headers['X-Api-Resource-Id']).toBe('resource-id')

        ws?.emit('open')
        expect(ws?.send).toHaveBeenCalledTimes(2)

        const requestFrame = ws?.send.mock.calls[0]?.[0] as Buffer
        expect(requestFrame.readInt32BE(4)).toBe(1)
        const audioFrame = ws?.send.mock.calls[1]?.[0] as Buffer
        expect(audioFrame.readInt32BE(4)).toBe(-2)

        ws?.emit('message', buildServerResponsePacket({
            result: {
                utterances: [{ definite: true }],
                text: '识别完成',
            },
            audio_info: {
                duration: 3200,
            },
        }))

        await expect(pending).resolves.toEqual({
            text: '识别完成',
            language: 'zh-CN',
            duration: 3200,
            confidence: 1,
            usage: {
                audioSeconds: 3.2,
            },
        })
        expect(ws?.close).toHaveBeenCalledTimes(1)
    })

    it('resolves with accumulated transcript when socket closes after partial result', async () => {
        const provider = new VolcengineASRProvider({
            appId: 'app-id',
            token: 'token',
            endpoint: 'wss://custom.example.com/asr',
        })

        const pending = provider.transcribe({
            audioBuffer: Buffer.from('voice'),
            mimeType: 'audio/wav',
            fileName: 'clip.wav',
        })

        const ws = MockWebSocket.instances[0]
        expect(ws?.url).toBe('wss://custom.example.com/asr')

        ws?.emit('open')
        ws?.emit('message', buildServerResponsePacket({
            result: [{ text: 'partial text' }],
        }))
        ws?.emit('close')

        await expect(pending).resolves.toEqual({
            text: 'partial text',
            language: 'auto',
            duration: 0,
            confidence: 1,
            usage: {
                audioSeconds: 0,
            },
        })
    })

    it('rejects on provider error packets and websocket transport errors', async () => {
        const provider = new VolcengineASRProvider({
            appId: 'app-id',
            token: 'token',
        })

        const packetFailure = provider.transcribe({
            audioBuffer: Buffer.from('voice'),
            mimeType: 'audio/webm',
            fileName: 'clip.webm',
        })

        const packetSocket = MockWebSocket.instances[0]
        packetSocket?.emit('open')
        packetSocket?.emit('message', buildErrorPacket(403, 'forbidden'))

        await expect(packetFailure).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine ASR Error(403): forbidden',
        })

        const transportFailure = provider.transcribe({
            audioBuffer: Buffer.from('voice'),
            mimeType: 'audio/webm',
            fileName: 'clip.webm',
        })

        const transportSocket = MockWebSocket.instances[1]
        transportSocket?.emit('error', new Error('socket down'))

        await expect(transportFailure).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine ASR websocket error: socket down',
        })
    })
})
