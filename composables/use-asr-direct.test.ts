import zlib from 'node:zlib'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue', async () => {
    const actual = await vi.importActual<typeof import('vue')>('vue')

    return {
        ...actual,
        onUnmounted: vi.fn(),
    }
})

const { fetchMock } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

import { useASRDirect } from './use-asr-direct'
import type { ASRCredentials } from '@/types/asr'

class MockWebSocket {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSING = 2
    static readonly CLOSED = 3
    static instances: MockWebSocket[] = []

    readonly url: string
    binaryType = 'blob'
    readyState = MockWebSocket.CONNECTING
    sent: unknown[] = []
    onopen: (() => void) | null = null
    onmessage: ((event: { data: Blob | ArrayBuffer | string }) => void) | null = null
    onerror: (() => void) | null = null
    onclose: (() => void) | null = null

    constructor(url: string) {
        this.url = url
        MockWebSocket.instances.push(this)
    }

    send(payload: unknown) {
        this.sent.push(payload)
    }

    open() {
        if (this.readyState === MockWebSocket.CLOSED) {
            return
        }

        this.readyState = MockWebSocket.OPEN
        this.onopen?.()
    }

    close() {
        if (this.readyState === MockWebSocket.CLOSED) {
            return
        }

        this.readyState = MockWebSocket.CLOSED
        this.onclose?.()
    }

    emitClose() {
        this.close()
    }
}

function createStreamCredentials(connectId: string): ASRCredentials {
    const now = Date.now()

    return {
        provider: 'volcengine',
        mode: 'stream',
        authType: 'query',
        issuedAt: now,
        expiresInMs: 600_000,
        expiresAt: now + 600_000,
        endpoint: 'wss://example.com/asr',
        connectId,
        appId: 'app-id',
        jwtToken: 'jwt-token',
        authQuery: {
            api_resource_id: 'cluster',
            api_app_key: 'app-id',
            api_access_key: 'Jwt; jwt-token',
        },
        resourceId: 'cluster',
        temporaryUserId: `user-${connectId}`,
    }
}

function createBatchCredentials(connectId: string, apiKey: string): ASRCredentials {
    const now = Date.now()

    return {
        provider: 'siliconflow',
        mode: 'batch',
        authType: 'bearer',
        issuedAt: now,
        expiresInMs: 600_000,
        expiresAt: now + 600_000,
        endpoint: 'https://api.siliconflow.example/v1',
        connectId,
        apiKey,
        model: 'FunAudioLLM/SenseVoiceSmall',
    }
}

async function flushPromises() {
    await Promise.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useASRDirect', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
        fetchMock.mockReset()
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('ignores stale socket close events after a reconnect succeeds', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('first'),
        })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()

        const firstSocket = MockWebSocket.instances[0]
        expect(firstSocket).toBeDefined()

        firstSocket!.open()
        await connectPromise

        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('second'),
        })

        firstSocket!.emitClose()
        await flushPromises()

        const secondSocket = MockWebSocket.instances[1]
        expect(secondSocket).toBeDefined()

        secondSocket!.open()
        await flushPromises()

        firstSocket!.onclose?.()
        await flushPromises()

        expect(MockWebSocket.instances).toHaveLength(2)
        expect(asr.isConnected.value).toBe(true)
    })

    it('does not resurrect the stream when stop is called during an in-flight reconnect', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('first'),
        })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        const firstSocket = MockWebSocket.instances[0]

        firstSocket!.open()
        await connectPromise

        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('second'),
        })

        firstSocket!.emitClose()
        await flushPromises()

        const secondSocket = MockWebSocket.instances[1]
        expect(secondSocket).toBeDefined()

        asr.stop()
        secondSocket!.open()
        await flushPromises()

        expect(asr.isConnected.value).toBe(false)
        expect(secondSocket!.readyState).toBe(MockWebSocket.CLOSED)
    })

    it('retries batch transcription once after a 401 credential failure', async () => {
        fetchMock
            .mockResolvedValueOnce({
                code: 200,
                data: createBatchCredentials('first', 'key-1'),
            })
            .mockRejectedValueOnce({
                status: 401,
                data: {
                    error: {
                        message: 'token expired',
                    },
                },
            })
            .mockResolvedValueOnce({
                code: 200,
                data: createBatchCredentials('second', 'key-2'),
            })
            .mockResolvedValueOnce({
                text: 'retry-success',
            })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch' })
        const result = await asr.transcribeBatch(new Blob(['audio']))

        expect(result).toBe('retry-success')
        expect(fetchMock).toHaveBeenCalledTimes(4)
    })

    it('does not retry batch transcription on non-auth 403 responses', async () => {
        fetchMock
            .mockResolvedValueOnce({
                code: 200,
                data: createBatchCredentials('first', 'key-1'),
            })
            .mockRejectedValueOnce({
                status: 403,
                data: {
                    error: {
                        message: 'quota exceeded',
                    },
                },
            })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch' })

        await expect(asr.transcribeBatch(new Blob(['audio']))).rejects.toMatchObject({
            status: 403,
        })
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('uses default batch model and normalized language on successful transcription', async () => {
        fetchMock
            .mockResolvedValueOnce({
                code: 200,
                data: {
                    ...createBatchCredentials('first', 'key-1'),
                    model: undefined,
                },
            })
            .mockResolvedValueOnce({
                text: 'batch-success',
            })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch', language: 'zh-CN' })
        const result = await asr.transcribeBatch(new Blob(['audio']))

        expect(result).toBe('batch-success')
        expect(asr.finalTranscript.value).toBe('batch-success')

        const [, requestOptions] = fetchMock.mock.calls[1] as [string, { body: FormData, headers: Record<string, string> }]
        expect(requestOptions.headers.Authorization).toBe('Bearer key-1')
        expect(requestOptions.body.get('model')).toBe('FunAudioLLM/SenseVoiceSmall')
        expect(requestOptions.body.get('language')).toBe('zh')
    })

    it('updates interim and final transcripts from volcengine server packets', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('stream-transcript'),
        })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()

        const socket = MockWebSocket.instances[0]
        socket!.open()
        await connectPromise

        socket!.onmessage?.({
            data: createVolcengineResponsePacket({
                result: { text: 'partial' },
            }).buffer,
        })
        await flushPromises()

        expect(asr.interimTranscript.value).toBe('partial')
        expect(asr.finalTranscript.value).toBe('')

        socket!.onmessage?.({
            data: createVolcengineResponsePacket({
                result: [{ text: 'done-' }, { text: 'final' }],
            }, { isFinal: true }).buffer,
        })
        await flushPromises()

        expect(asr.interimTranscript.value).toBe('')
        expect(asr.finalTranscript.value).toBe('done-final')
    })

    it('reconnects when server reports an expiring credential error', async () => {
        fetchMock
            .mockResolvedValueOnce({
                code: 200,
                data: createStreamCredentials('first'),
            })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()

        const firstSocket = MockWebSocket.instances[0]
        firstSocket!.open()
        await connectPromise

        firstSocket!.onmessage?.({
            data: createVolcengineErrorPacket(401, 'token expired').buffer,
        })
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(MockWebSocket.instances).toHaveLength(2)
        expect(asr.error.value).toBe('token expired')
    })

    it('sends a final frame and closes the socket when stop is called', async () => {
        fetchMock.mockResolvedValueOnce({
            code: 200,
            data: createStreamCredentials('stop-sequence'),
        })

        try {
            const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
            const connectPromise = asr.connect()
            await flushPromises()

            const socket = MockWebSocket.instances[0]
            socket!.open()
            await connectPromise

            vi.useFakeTimers()
            asr.stop()

            expect(socket!.sent).toHaveLength(2)
            expect(asr.isConnected.value).toBe(false)

            vi.advanceTimersByTime(800)
            expect(socket!.readyState).toBe(MockWebSocket.CLOSED)
        } finally {
            vi.useRealTimers()
        }
    })
})

function createVolcengineResponsePacket(payload: unknown, options?: { isFinal?: boolean }) {
    const encoded = new TextEncoder().encode(JSON.stringify(payload))
    const packet = new Uint8Array(12 + encoded.length)
    const view = new DataView(packet.buffer)
    packet[0] = 0x11
    packet[1] = (0b1001 << 4) | (options?.isFinal ? 0b0010 : 0b0001)
    packet[2] = 0b0001 << 4
    packet[3] = 0
    view.setUint32(8, encoded.length, false)
    packet.set(encoded, 12)
    return packet
}

function createVolcengineErrorPacket(code: number, message: string) {
    const encoded = new TextEncoder().encode(message)
    const packet = new Uint8Array(12 + encoded.length)
    const view = new DataView(packet.buffer)
    packet[0] = 0x11
    packet[1] = 0b1111 << 4
    packet[2] = 0
    packet[3] = 0
    view.setUint32(4, code, false)
    view.setUint32(8, encoded.length, false)
    packet.set(encoded, 12)
    return packet
}

describe('useASRDirect - 边界与错误路径', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
        fetchMock.mockReset()
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('does not append a language field when options.language is absent', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createBatchCredentials('batch-1', 'key-1') })
            .mockResolvedValueOnce({ text: 'hello' })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch' })
        await asr.transcribeBatch(new Blob(['audio']))

        const request = fetchMock.mock.calls[1] as [string, { body: FormData }]
        expect(request[1].body.get('language')).toBeNull()
        expect(request[1].body.get('model')).toBe('FunAudioLLM/SenseVoiceSmall')
    })

    it('normalizes the language tag to its primary subtag', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createBatchCredentials('batch-2', 'key-2') })
            .mockResolvedValueOnce({ text: 'hello' })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch', language: 'en-US' })
        await asr.transcribeBatch(new Blob(['audio']))

        const request = fetchMock.mock.calls[1] as [string, { body: FormData }]
        expect(request[1].body.get('language')).toBe('en')
    })

    it('surfaces the provider message and rethrows on non-auth batch failures', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createBatchCredentials('batch-3', 'key-3') })
            .mockRejectedValueOnce({ status: 500, data: { error: { message: 'upstream unavailable' } } })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch' })

        await expect(asr.transcribeBatch(new Blob(['audio']))).rejects.toBeTruthy()
        expect(asr.error.value).toBe('upstream unavailable')
        expect(asr.isProcessing.value).toBe(false)
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('falls back to transcription_failed when the error payload has no message', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createBatchCredentials('batch-4', 'key-4') })
            .mockRejectedValueOnce({ status: 502 })

        const asr = useASRDirect({ provider: 'siliconflow', mode: 'batch' })

        await expect(asr.transcribeBatch(new Blob(['audio']))).rejects.toBeTruthy()
        expect(asr.error.value).toBe('transcription_failed')
    })

    it('rejects connect when stream credentials carry no query auth', async () => {
        const credentials = createStreamCredentials('no-auth')
        delete (credentials as Partial<ASRCredentials>).authQuery
        fetchMock.mockResolvedValueOnce({ code: 200, data: credentials })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })

        await expect(asr.connect()).rejects.toThrow('Missing Volcengine query auth parameters')
        expect(asr.isConnecting.value).toBe(false)
        expect(asr.error.value).toContain('Missing Volcengine query auth parameters')
    })

    it('requests fresh credentials again after a disconnect', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createStreamCredentials('first') })
            .mockResolvedValueOnce({ code: 200, data: createStreamCredentials('second') })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })

        const firstConnect = asr.connect()
        await flushPromises()
        MockWebSocket.instances[0]!.open()
        await firstConnect

        asr.disconnect()
        expect(asr.isConnected.value).toBe(false)

        const secondConnect = asr.connect()
        await flushPromises()
        MockWebSocket.instances[1]!.open()
        await secondConnect

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(asr.isConnected.value).toBe(true)
    })

    it('reconnects when audio is sent while the socket is not open', async () => {
        fetchMock
            .mockResolvedValueOnce({ code: 200, data: createStreamCredentials('first') })
            .mockResolvedValueOnce({ code: 200, data: createStreamCredentials('second') })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        MockWebSocket.instances[0]!.open()
        await connectPromise

        const socket = MockWebSocket.instances[0]!
        socket.readyState = MockWebSocket.CLOSED
        asr.sendAudio(new Float32Array([0.1, 0.2]))
        await flushPromises()

        expect(MockWebSocket.instances).toHaveLength(2)
    })

    it('ignores unknown server packets and unparsable payloads', async () => {
        fetchMock.mockResolvedValueOnce({ code: 200, data: createStreamCredentials('unknown') })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        const socket = MockWebSocket.instances[0]!
        socket.open()
        await connectPromise

        socket.onmessage?.({ data: 'plain-text-frame' })
        socket.onmessage?.({ data: new Uint8Array([1, 2]).buffer })
        socket.onmessage?.({ data: createTruncatedResponsePacket() })
        await flushPromises()

        expect(asr.finalTranscript.value).toBe('')
        expect(asr.interimTranscript.value).toBe('')
        expect(asr.error.value).toBeNull()
    })

    it('reports unknown server errors for short error frames', async () => {
        fetchMock.mockResolvedValueOnce({ code: 200, data: createStreamCredentials('short-error') })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        const socket = MockWebSocket.instances[0]!
        socket.open()
        await connectPromise

        socket.onmessage?.({ data: createShortErrorPacket() })
        await flushPromises()

        expect(asr.error.value).toBe('Unknown server error')
    })

    it('resets transcripts and error state', async () => {
        fetchMock.mockResolvedValueOnce({ code: 200, data: createStreamCredentials('reset') })

        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        const socket = MockWebSocket.instances[0]!
        socket.open()
        await connectPromise

        socket.onmessage?.({
            data: createVolcengineResponsePacket({ result: [{ text: 'partial' }] }).buffer,
        })
        await flushPromises()
        expect(asr.interimTranscript.value).toBe('partial')

        asr.reset()

        expect(asr.interimTranscript.value).toBe('')
        expect(asr.finalTranscript.value).toBe('')
        expect(asr.error.value).toBeNull()
    })
})

function createTruncatedResponsePacket() {
    const packet = new Uint8Array(12)
    const view = new DataView(packet.buffer)
    packet[0] = 0x11
    packet[1] = 0b1001 << 4
    packet[2] = 0
    view.setUint32(8, 64, false) // payloadSize 超出实际长度
    return packet.buffer
}

function createShortErrorPacket() {
    const packet = new Uint8Array(8)
    packet[0] = 0x11
    packet[1] = 0b1111 << 4
    return packet.buffer
}

describe('useASRDirect - 压缩与序列化载荷', () => {
    beforeEach(() => {
        MockWebSocket.instances = []
        fetchMock.mockReset()
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    async function connectSocket(connectId: string) {
        fetchMock.mockResolvedValueOnce({ code: 200, data: createStreamCredentials(connectId) })
        const asr = useASRDirect({ provider: 'volcengine', mode: 'stream' })
        const connectPromise = asr.connect()
        await flushPromises()
        const socket = MockWebSocket.instances.at(-1)!
        socket.open()
        await connectPromise
        return { asr, socket }
    }

    it('inflates gzip response packets received as blobs', async () => {
        const { asr, socket } = await connectSocket('gzip')

        const payload = zlib.gzipSync(new TextEncoder().encode(JSON.stringify({ result: [{ text: '压缩结果' }] })))
        const packet = createResponsePacketWithPayload(new Uint8Array(payload), { compression: 0b0001, serialization: 0b0001 })
        socket.onmessage?.({ data: new Blob([packet]) })
        await flushPromises()

        await vi.waitFor(() => {
            expect(asr.interimTranscript.value).toBe('压缩结果')
        })
        expect(asr.error.value).toBeNull()
    })

    it('falls back to raw text when a json payload cannot be parsed', async () => {
        const { asr, socket } = await connectSocket('bad-json')

        const raw = new TextEncoder().encode('not-json')
        socket.onmessage?.({ data: createResponsePacketWithPayload(raw, { serialization: 0b0001 }).buffer })
        await flushPromises()

        expect(asr.finalTranscript.value).toBe('')
        expect(asr.interimTranscript.value).toBe('')
        expect(asr.error.value).toBeNull()
    })

    it('reports a generic transcription error when the error packet has no message', async () => {
        const { asr, socket } = await connectSocket('silent-error')

        socket.onmessage?.({ data: createVolcengineErrorPacket(45000003, '').buffer })
        await flushPromises()

        expect(asr.error.value).toBe('transcription_error_45000003')
    })
})

function createResponsePacketWithPayload(payload: Uint8Array, options: { compression?: number, serialization?: number } = {}) {
    const packet = new Uint8Array(12 + payload.length)
    const view = new DataView(packet.buffer)
    packet[0] = 0x11
    packet[1] = 0b1001 << 4
    packet[2] = ((options.serialization ?? 0) << 4) | (options.compression ?? 0)
    packet[3] = 0
    view.setUint32(8, payload.length, false)
    packet.set(payload, 12)
    return packet
}
