import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue', async () => {
    const actual = await vi.importActual<typeof import('vue')>('vue')

    return {
        ...actual,
        onUnmounted: vi.fn(),
    }
})

import { useASRDirect } from './use-asr-direct'
import type { ASRCredentials } from '@/types/asr'

const fetchMock = vi.fn()

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
        vi.stubGlobal('$fetch', fetchMock)
        vi.stubGlobal('WebSocket', MockWebSocket)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
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
