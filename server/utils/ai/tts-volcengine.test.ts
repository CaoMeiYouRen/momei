import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_SERIALIZATION,
    buildVolcengineBinaryFrame,
    parseVolcengineEventPacket,
} from './volcengine-protocol'
import { VolcengineTTSProvider } from './tts-volcengine'

const { MockWebSocket, loggerMock } = vi.hoisted(() => {
    type EventHandler = (...args: any[]) => void

    class HoistedMockWebSocket {
        static instances: HoistedMockWebSocket[] = []
        static OPEN = 1
        static CLOSED = 3

        url: string
        options: Record<string, any>
        handlers = new Map<string, EventHandler[]>()
        readyState = 0
        send = vi.fn()
        close = vi.fn(() => {
            this.readyState = HoistedMockWebSocket.CLOSED
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
            if (event === 'open') {
                this.readyState = HoistedMockWebSocket.OPEN
            }

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

async function readAll(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []

    while (true) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }
        if (value) {
            chunks.push(value)
        }
    }

    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combined = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
    }

    return Buffer.from(combined)
}

function buildPodcastEventPacket(event: number, payload: unknown, sessionId = 'session-001') {
    const sessionBuffer = Buffer.from(sessionId, 'utf-8')
    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(event, 0)

    const sessionSizeBuffer = Buffer.alloc(4)
    sessionSizeBuffer.writeUInt32BE(sessionBuffer.length, 0)

    const payloadBuffer = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(JSON.stringify(payload), 'utf-8')

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullServerResponse,
        messageTypeFlags: 0b0100,
        serialization: Buffer.isBuffer(payload) ? VOLCENGINE_SERIALIZATION.none : VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [eventBuffer, sessionSizeBuffer, sessionBuffer],
        payload: payloadBuffer,
    })
}

function buildPodcastErrorPacket(code: number, message: string) {
    const messageBuffer = Buffer.from(message, 'utf-8')
    const raw = Buffer.alloc(12 + messageBuffer.length)
    raw.writeUInt8(0x11, 0)
    raw.writeUInt8(0xf0, 1)
    raw.writeUInt8(0x00, 2)
    raw.writeUInt8(0x00, 3)
    raw.writeUInt32BE(code, 4)
    raw.writeUInt32BE(messageBuffer.length, 8)
    messageBuffer.copy(raw, 12)
    return raw
}

function buildVolcengineConnectionResponsePacket(event: number, payload: unknown, connectionId = 'connection-001') {
    const connectionBuffer = Buffer.from(connectionId, 'utf-8')
    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(event, 0)

    const connectionSizeBuffer = Buffer.alloc(4)
    connectionSizeBuffer.writeUInt32BE(connectionBuffer.length, 0)

    const payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf-8')
    const payloadSizeBuffer = Buffer.alloc(4)
    payloadSizeBuffer.writeUInt32BE(payloadBuffer.length, 0)

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullServerResponse,
        messageTypeFlags: 0b0100,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [eventBuffer, connectionSizeBuffer, connectionBuffer, payloadSizeBuffer],
        payload: payloadBuffer,
    })
}

function buildVolcengineSessionResponsePacket(event: number, payload: unknown, sessionId = 'session-001') {
    const sessionBuffer = Buffer.from(sessionId, 'utf-8')
    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(event, 0)

    const sessionSizeBuffer = Buffer.alloc(4)
    sessionSizeBuffer.writeUInt32BE(sessionBuffer.length, 0)

    const payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf-8')

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullServerResponse,
        messageTypeFlags: 0b0100,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [eventBuffer, sessionSizeBuffer, sessionBuffer],
        payload: payloadBuffer,
    })
}

function buildVolcengineAudioResponsePacket(audio: Buffer, sessionId = 'session-001') {
    const sessionBuffer = Buffer.from(sessionId, 'utf-8')
    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(352, 0)

    const sessionSizeBuffer = Buffer.alloc(4)
    sessionSizeBuffer.writeUInt32BE(sessionBuffer.length, 0)

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.audioOnlyServerResponse,
        messageTypeFlags: 0b0100,
        serialization: VOLCENGINE_SERIALIZATION.none,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [eventBuffer, sessionSizeBuffer, sessionBuffer],
        payload: audio,
    })
}

describe('volcengine tts provider', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns speech and podcast voices, cost estimate and credential health check', async () => {
        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
            defaultModel: 'seed-tts-custom',
        })

        expect(provider.model).toBe('seed-tts-custom')
        await expect(provider.getVoices()).resolves.toContainEqual(expect.objectContaining({
            id: 'zh_female_vv_uranus_bigtts',
        }))
        await expect(provider.getVoices({ mode: 'podcast' })).resolves.toEqual(expect.arrayContaining([
            expect.objectContaining({
                mode: 'podcast',
            }),
        ]))
        await expect(provider.estimateTTSCost('a'.repeat(2000), 'voice')).resolves.toBe(0.1)
        await expect(provider.check()).resolves.toBe(true)
        await expect(new VolcengineTTSProvider({ appId: '', accessKey: '' }).check()).resolves.toBe(false)
    })

    it('builds websocket request frames, parses stream packets and returns audio bytes', async () => {
        const audioA = Buffer.from('hello-')
        const audioB = Buffer.from('world')

        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const stream = await provider.generateSpeech('hello volcengine', 'saturn_zh_female_cancan_tob', {
            outputFormat: 'wav',
            speed: 1.25,
            volume: 0.6,
            pitch: 6.2,
            language: 'en',
            model: 'unknown',
            sampleRate: 16000,
        })

        const ws = MockWebSocket.instances[0]
        expect(ws?.url).toBe('wss://openspeech.bytedance.com/api/v3/tts/bidirection')
        expect(ws?.options.headers).toMatchObject({
            'X-Api-App-Id': 'app-id',
            'X-Api-App-Key': 'app-id',
            'X-Api-Access-Key': 'access-key',
            'X-Api-Resource-Id': 'seed-tts-2.0',
            'X-Api-Connect-Id': expect.any(String),
            'X-Api-Request-Id': expect.any(String),
        })

        ws?.emit('open')

        const startConnectionFrame = ws?.send.mock.calls[0]?.[0] as Buffer
        expect(startConnectionFrame.readInt32BE(4)).toBe(1)

        ws?.emit('message', buildVolcengineConnectionResponsePacket(50, {}))

        const startSessionFrame = ws?.send.mock.calls[1]?.[0] as Buffer
        const parsedStartSessionFrame = parseVolcengineEventPacket(startSessionFrame)
        expect(parsedStartSessionFrame?.event).toBe(100)
        expect(parsedStartSessionFrame?.payload).toMatchObject({
            user: { uid: expect.any(String) },
            namespace: 'BidirectionalTTS',
            req_params: {
                model: 'seed-tts-2.0-expressive',
                speaker: 'saturn_zh_female_cancan_tob',
                audio_params: {
                    format: 'wav',
                    sample_rate: 16000,
                    speech_rate: 25,
                    loudness_rate: -40,
                    enable_timestamp: true,
                },
                additions: JSON.stringify({
                    explicit_language: 'en',
                    disable_markdown_filter: true,
                    enable_timestamp: true,
                    post_process: {
                        pitch: 6,
                    },
                }),
            },
        })

        ws?.emit('message', buildVolcengineSessionResponsePacket(150, {}))

        const taskRequestFrame = ws?.send.mock.calls[2]?.[0] as Buffer
        const parsedTaskRequestFrame = parseVolcengineEventPacket(taskRequestFrame)
        expect(parsedTaskRequestFrame?.event).toBe(200)
        expect(parsedTaskRequestFrame?.payload).toMatchObject({
            namespace: 'BidirectionalTTS',
            req_params: {
                text: 'hello volcengine',
            },
        })

        const finishSessionFrame = ws?.send.mock.calls[3]?.[0] as Buffer
        expect(parseVolcengineEventPacket(finishSessionFrame)?.event).toBe(102)

        ws?.emit('message', buildVolcengineAudioResponsePacket(audioA, 'session-001'))
        ws?.emit('message', buildVolcengineAudioResponsePacket(audioB, 'session-001'))
        ws?.emit('message', buildVolcengineSessionResponsePacket(152, { status_code: 20000000, usage: { tokens_total: 12 } }))

        const audio = await readAll(stream)
        expect(audio.toString()).toBe('hello-world')

        expect(ws?.send.mock.calls[4]?.[0]).toBeInstanceOf(Buffer)
        expect(ws?.close).toHaveBeenCalledTimes(1)
    })

    it('wraps websocket failures and missing credentials', async () => {
        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const stream = await provider.generateSpeech('hello', 'zh_female_vv_uranus_bigtts', {})
        const reader = stream.getReader()
        const ws = MockWebSocket.instances[0]
        ws?.emit('open')
        ws?.emit('error', new Error('socket down'))

        await expect(reader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine TTS websocket error: socket down',
        })

        await expect(new VolcengineTTSProvider({ appId: '', accessKey: '' }).generateSpeech('hello', 'voice', {})).rejects.toMatchObject({
            statusCode: 500,
            message: 'Volcengine TTS Error: AppID or Access Token missing',
        })
    })

    it('rejects websocket connection failures and premature closes', async () => {
        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const connectionFailure = await provider.generateSpeech('hello', 'legacy_voice', {})
        const connectionReader = connectionFailure.getReader()
        const connectionWs = MockWebSocket.instances[0]
        connectionWs?.emit('open')
        connectionWs?.emit('message', buildVolcengineConnectionResponsePacket(51, { message: 'unauthorized' }))

        await expect(connectionReader.read()).rejects.toMatchObject({
            statusCode: 502,
        })

        const closeBeforeOpen = await provider.generateSpeech('hello', 'voice', {})
        const closeReader = closeBeforeOpen.getReader()
        const closeSocket = MockWebSocket.instances[1]
        closeSocket?.emit('close')

        await expect(closeReader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine TTS connection closed before start',
        })
    })

    it('streams podcast audio, sends finish frame on completion and supports buffer or object payloads', async () => {
        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const stream = await provider.generateSpeech('podcast content', [
            'speaker-a',
            'speaker-b',
        ], {
            mode: 'podcast',
            outputFormat: 'ogg',
            sampleRate: 48000,
        })

        const ws = MockWebSocket.instances[0]
        expect(ws?.url).toBe('wss://openspeech.bytedance.com/api/v3/sami/podcasttts')
        expect(ws?.options.headers).toMatchObject({
            'X-Api-App-Id': 'app-id',
            'X-Api-App-Key': 'aGjiRDfUWi',
            'X-Api-Access-Key': 'access-key',
            'X-Api-Resource-Id': 'volc.service_type.10050',
            'X-Api-Request-Id': expect.any(String),
        })

        ws?.emit('upgrade', { headers: { 'x-tt-logid': 'podcast-log-1' } })
        ws?.emit('open')

        const startFrame = ws?.send.mock.calls[0]?.[0] as Buffer
        const parsedStartFrame = parseVolcengineEventPacket(startFrame)
        expect(parsedStartFrame?.event).toBe(100)
        expect(parsedStartFrame?.payload).toMatchObject({
            input_id: expect.any(String),
            input_text: 'podcast content',
            speaker_info: {
                random_order: true,
                speakers: ['speaker-a', 'speaker-b'],
            },
            audio_config: {
                format: 'ogg_opus',
                sample_rate: 48000,
                speech_rate: 0,
            },
        })

        ws?.emit('message', buildPodcastEventPacket(361, Buffer.from('AUDIO-1')))
        ws?.emit('message', buildPodcastEventPacket(361, { audio: Buffer.from('AUDIO-2').toString('base64') }))
        ws?.emit('message', buildPodcastEventPacket(154, { usage: { tokens: 8 } }))
        ws?.emit('message', buildPodcastEventPacket(363, { meta_info: { audio_url: 'https://cdn.example.com/audio.mp3' } }))
        ws?.emit('message', buildPodcastEventPacket(152, { done: true }))

        const audio = await readAll(stream)
        expect(audio.toString()).toBe('AUDIO-1AUDIO-2')

        const finishFrame = ws?.send.mock.calls[1]?.[0] as Buffer
        expect(finishFrame.readInt32BE(4)).toBe(2)
        expect(ws?.close).toHaveBeenCalledTimes(1)
    })

    it('rejects podcast mode on provider packet errors, websocket errors and premature close', async () => {
        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const packetFailure = await provider.generateSpeech('podcast content', 'speaker-a,speaker-b', {
            mode: 'podcast',
        })
        const packetFailureReader = packetFailure.getReader()
        const packetSocket = MockWebSocket.instances[0]
        packetSocket?.emit('open')
        packetSocket?.emit('message', buildPodcastErrorPacket(403, 'forbidden'))
        await expect(packetFailureReader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine Podcast Error(403): forbidden',
        })

        const websocketFailure = await provider.generateSpeech('podcast content', 'speaker-a,speaker-b', {
            mode: 'podcast',
        })
        const websocketReader = websocketFailure.getReader()
        const websocketSocket = MockWebSocket.instances[1]
        websocketSocket?.emit('error', new Error('socket down'))
        await expect(websocketReader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine Podcast websocket error: socket down',
        })

        const closeBeforeOpen = await provider.generateSpeech('podcast content', 'speaker-a,speaker-b', {
            mode: 'podcast',
        })
        const closeReader = closeBeforeOpen.getReader()
        const closeSocket = MockWebSocket.instances[2]
        closeSocket?.emit('close')
        await expect(closeReader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'Volcengine Podcast connection closed before start',
        })
    })

    it('rejects podcast mode without credentials and with round errors', async () => {
        await expect(new VolcengineTTSProvider({ appId: '', accessKey: '' }).generateSpeech('podcast content', 'speaker-a', {
            mode: 'podcast',
        })).rejects.toMatchObject({
            statusCode: 500,
            message: 'Volcengine Podcast Error: AppID or Access Token missing',
        })

        const provider = new VolcengineTTSProvider({
            appId: 'app-id',
            accessKey: 'access-key',
        })

        const stream = await provider.generateSpeech('podcast content', 'speaker-a,speaker-b', {
            mode: 'podcast',
        })
        const reader = stream.getReader()
        const ws = MockWebSocket.instances[0]
        ws?.emit('open')
        ws?.emit('message', buildPodcastEventPacket(362, {
            is_error: true,
            error_msg: 'round failed',
        }))

        await expect(reader.read()).rejects.toMatchObject({
            statusCode: 502,
            message: 'round failed',
        })
    })
})
