import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetch, mockToastAdd, mockUploadFile } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
    mockToastAdd: vi.fn(),
    mockUploadFile: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

// ---- WebSocket Mock ----

type MockWSBehavior = 'default' | 'error' | 'close-no-audio'

class MockWebSocket {
    static OPEN = 1
    static CONNECTING = 0
    static CLOSING = 2
    static CLOSED = 3
    static instances: MockWebSocket[] = []
    static behavior: MockWSBehavior = 'default'

    url: string
    readyState = 0
    binaryType = 'arraybuffer'
    onopen: ((ev?: unknown) => void) | null = null
    onmessage: ((ev: { data: ArrayBuffer }) => void) | null = null
    onerror: ((ev?: unknown) => void) | null = null
    onclose: ((ev?: unknown) => void) | null = null

    constructor(url: string) {
        this.url = url
        MockWebSocket.instances.push(this)

        if (MockWebSocket.behavior === 'error') {
            // 模拟连接错误：直接触发 onerror
            setTimeout(() => {
                this.onerror?.(new Event('error'))
            }, 0)
        } else if (MockWebSocket.behavior === 'close-no-audio') {
            // 模拟连接成功后立即关闭（无音频数据）
            setTimeout(() => {
                this.readyState = MockWebSocket.OPEN
                this.onopen?.()
                this.readyState = MockWebSocket.CLOSED
                this.onclose?.()
            }, 0)
        } else {
            // 默认行为：异步触发 onopen
            setTimeout(() => {
                this.readyState = MockWebSocket.OPEN
                this.onopen?.()
            }, 0)
        }
    }

    send(_data: ArrayBuffer) {
        // 无操作
    }

    close() {
        this.readyState = MockWebSocket.CLOSED
    }
}

vi.stubGlobal('WebSocket', MockWebSocket)
vi.stubGlobal('crypto', {
    randomUUID: () => 'uuid-1',
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
        }),
    }
})

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: mockToastAdd,
        }),
    }
})

vi.mock('./use-upload', () => ({
    UploadType: {
        AUDIO: 'audio',
    },
    useUpload: () => ({
        uploadFile: mockUploadFile,
    }),
}))

import { useTTSVolcengineDirect } from './use-tts-volcengine-direct'

/**
 * 构建符合 parseVolcengineEventFrame 格式的事件帧
 *
 * 帧格式: header(4B) + event(4B) + sessionIdSize(4B) + sessionId(variable) + payloadSize(4B) + payload(variable)
 */
function buildEventFrame(event: number, payload: Uint8Array, sessionId: string, serialization: number, compression: number): ArrayBuffer {
    const sessionIdBytes = new TextEncoder().encode(sessionId)
    const totalSize = 16 + sessionIdBytes.length + payload.length
    const frame = new Uint8Array(totalSize)
    const view = new DataView(frame.buffer)

    view.setUint8(0, 0x11) // version=1, headerSize=1
    view.setUint8(1, (serialization << 4) | compression) // messageType=event(0), stored in upper nibble of serialization field... actually: messageType is at bits 4-7 of byte 1
    // Hmm wait, messageType = 0b0001 (fullClientRequest event) is at bits 4-7 of byte 1.
    // parseVolcengineEventFrame reads: messageType = (view.getUint8(1) >> 4) & 0x0f
    // So the upper nibble is messageType, lower nibble is messageTypeFlags
    view.setUint8(1, (0b0001 << 4) | 0b0100) // messageType=fullClientRequest(1), flags=0b0100
    view.setUint8(2, (serialization << 4) | compression)
    view.setUint8(3, 0) // reserved
    view.setInt32(4, event, false)
    view.setUint32(8, sessionIdBytes.length, false) // sessionIdSize
    frame.set(sessionIdBytes, 12)
    view.setUint32(12 + sessionIdBytes.length, payload.length, false) // payloadSize
    frame.set(payload, 16 + sessionIdBytes.length)

    return frame.buffer
}

function buildConnectionFrame(event: number, payload: Uint8Array, connectionId: string, serialization: number, compression: number): ArrayBuffer {
    const connectionIdBytes = new TextEncoder().encode(connectionId)
    const totalSize = 16 + connectionIdBytes.length + payload.length
    const frame = new Uint8Array(totalSize)
    const view = new DataView(frame.buffer)

    view.setUint8(0, 0x11)
    view.setUint8(1, (0b0001 << 4) | 0b0100)
    view.setUint8(2, (serialization << 4) | compression)
    view.setUint8(3, 0)
    view.setInt32(4, event, false)
    view.setUint32(8, connectionIdBytes.length, false)
    frame.set(connectionIdBytes, 12)
    view.setUint32(12 + connectionIdBytes.length, payload.length, false)
    frame.set(payload, 16 + connectionIdBytes.length)

    return frame.buffer
}

/**
 * 向 MockWebSocket 注入双向流式协议响应帧
 */
function simulateSpeechWebSocketFrames(audioBytes: number[], usage?: { totalTokens: number }) {
    const sessionId = 'uuid-1'
    const connectionId = 'conn-1'
    let connectionStarted = false
    let sessionStarted = false

    MockWebSocket.prototype.send = function (data: ArrayBuffer) {
        const buffer = new Uint8Array(data)
        if (buffer.length < 8) {
            return
        }

        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        const messageType = (view.getUint8(1) >> 4) & 0x0f
        const event = view.getInt32(4)

        // StartConnection(1) → 服务端发送 ConnectionStarted(50)
        if (messageType === 0b0001 && event === 1 && !connectionStarted) {
            connectionStarted = true

            setTimeout(() => {
                const connectionStartedPacket = buildConnectionFrame(50, new Uint8Array(0), connectionId, 0b0010, 0b0000)
                this.onmessage?.({ data: connectionStartedPacket })

                // 如果客户端没有按协议发送 StartSession(100)，连接会被服务端关闭
                setTimeout(() => {
                    if (!sessionStarted) {
                        this.onclose?.()
                    }
                }, 0)
            }, 0)
            return
        }

        // StartSession(100) → 服务端发送 SessionStarted(150)
        if (messageType === 0b0001 && event === 100 && connectionStarted && !sessionStarted) {
            sessionStarted = true

            setTimeout(() => {
                const sessionStartedPacket = buildEventFrame(150, new Uint8Array(0), sessionId, 0b0010, 0b0000)
                this.onmessage?.({ data: sessionStartedPacket })

                // Audio 帧 (event=352)
                if (audioBytes.length > 0) {
                    const audioPkt = buildEventFrame(352, new Uint8Array(audioBytes), sessionId, 0b0010, 0b0000)
                    this.onmessage?.({ data: audioPkt })
                }

                // Usage 帧 (event=154)
                if (usage) {
                    const usageJson = new TextEncoder().encode(JSON.stringify({ usage: { tokens_total: usage.totalTokens } }))
                    const usagePkt = buildEventFrame(154, usageJson, sessionId, 0b0001, 0b0000)
                    this.onmessage?.({ data: usagePkt })
                }

                // SessionFinished 帧 (event=152)
                const finishPkt = buildEventFrame(152, new Uint8Array(0), sessionId, 0b0010, 0b0000)
                this.onmessage?.({ data: finishPkt })
            }, 0)
        }
    }
}

function createCredentialResponse() {
    return {
        data: {
            provider: 'volcengine',
            mode: 'speech',
            authType: 'query',
            issuedAt: 0,
            expiresInMs: 60000,
            expiresAt: Date.now() + 60000,
            endpoint: 'wss://tts.example.com',
            connectId: 'connect-1',
            appId: 'app-1',
            jwtToken: 'jwt',
            authQuery: {
                api_resource_id: 'volc.service_type.10029',
                api_access_key: 'Jwt; jwt',
            },
            resourceId: 'volc.service_type.10029',
            temporaryUserId: 'temp-user',
        },
    }
}

describe('useTTSVolcengineDirect', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
        mockUploadFile.mockReset()
        MockWebSocket.instances = []
        MockWebSocket.behavior = 'default'
        // 恢复 MockWebSocket.prototype.send
        MockWebSocket.prototype.send = vi.fn()
    })

    it('overrides speech resource id by speaker version in direct websocket URL', async () => {
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce(createCredentialResponse())
            .mockResolvedValueOnce({ success: true, audioUrl: 'https://cdn.example.com/audio.mp3' })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        await direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
            postId: 'post-1',
        })

        const ws = MockWebSocket.instances.at(-1)
        expect(ws?.url).toContain('api_resource_id=seed-tts-1.0')
        expect(ws?.url).toContain('api_access_key=Jwt%3B+jwt')
    })

    it('maps uranus/saturn speakers to seed-tts-2.0 resource id', async () => {
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce(createCredentialResponse())
            .mockResolvedValueOnce({ success: true, audioUrl: 'https://cdn.example.com/audio.mp3' })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        await direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_vv_uranus_bigtts',
            postId: 'post-1',
        })

        const ws = MockWebSocket.instances.at(-1)
        expect(ws?.url).toContain('api_resource_id=seed-tts-2.0')
    })

    it('maps ICL speakers to seed-icl-1.0 resource id', async () => {
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce(createCredentialResponse())
            .mockResolvedValueOnce({ success: true, audioUrl: 'https://cdn.example.com/audio.mp3' })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        await direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'ICL_zh_female_yry_tob',
            postId: 'post-1',
        })

        const ws = MockWebSocket.instances.at(-1)
        expect(ws?.url).toContain('api_resource_id=seed-icl-1.0')
    })

    it('falls back to seed-tts-1.0 when speaker is blank', async () => {
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce(createCredentialResponse())
            .mockResolvedValueOnce({ success: true, audioUrl: 'https://cdn.example.com/audio.mp3' })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        await direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: '   ',
            postId: 'post-1',
        })

        const ws = MockWebSocket.instances.at(-1)
        expect(ws?.url).toContain('api_resource_id=seed-tts-1.0')
    })

    it('uses nested statusMessage when credential fetching fails', async () => {
        mockFetch.mockRejectedValueOnce({
            data: {
                statusMessage: 'credential_failed',
            },
        })

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'hello world',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        })).rejects.toEqual(expect.objectContaining({
            data: {
                statusMessage: 'credential_failed',
            },
        }))

        expect(direct.error.value).toBe('credential_failed')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'credential_failed',
        }))
    })

    it('settles the direct task via WebSocket speech with normalized provider usage after upload succeeds', async () => {
        // 注入 WebSocket 模拟帧
        simulateSpeechWebSocketFrames([1, 2, 3, 4], { totalTokens: 12 })

        mockFetch
            .mockResolvedValueOnce({
                data: {
                    provider: 'volcengine',
                    mode: 'speech',
                    authType: 'query',
                    issuedAt: 0,
                    expiresInMs: 60000,
                    expiresAt: Date.now() + 60000,
                    endpoint: 'wss://tts.example.com',
                    connectId: 'connect-1',
                    appId: 'app-1',
                    jwtToken: 'jwt',
                    authQuery: { api_access_key: 'Jwt; jwt' },
                    resourceId: 'resource-1',
                    temporaryUserId: 'temp-user',
                },
            })
            .mockResolvedValueOnce({ success: true, audioUrl: 'https://cdn.example.com/audio.mp3' })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        const result = await direct.generateAndUpload({
            taskId: 'task-1',
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
            postId: 'post-1',
        })

        expect(result.audioUrl).toBe('https://cdn.example.com/audio.mp3')
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/posts/post-1/tts-metadata', expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
                taskId: 'task-1',
                status: 'completed',
                providerUsage: { totalTokens: 12 },
            }),
        }))
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.admin.posts.tts.completed',
        }))
    })

    it('does not downgrade the direct task when completed write-back fails after upload', async () => {
        // 无 usage —— WebSocket 模拟不发送 usage 帧
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce({
                data: {
                    provider: 'volcengine',
                    mode: 'speech',
                    authType: 'query',
                    issuedAt: 0,
                    expiresInMs: 60000,
                    expiresAt: Date.now() + 60000,
                    endpoint: 'wss://tts.example.com',
                    connectId: 'connect-1',
                    appId: 'app-1',
                    jwtToken: 'jwt',
                    authQuery: { api_access_key: 'Jwt; jwt' },
                    resourceId: 'resource-1',
                    temporaryUserId: 'temp-user',
                },
            })
            .mockRejectedValueOnce(new Error('metadata failed'))
            .mockResolvedValueOnce({ success: true, audioUrl: null })

        mockUploadFile.mockResolvedValueOnce('https://cdn.example.com/audio.mp3')

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            taskId: 'task-2',
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
            postId: 'post-1',
        })).rejects.toMatchObject({
            message: 'metadata failed',
        })

        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/posts/post-1/tts-metadata', expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
                taskId: 'task-2',
                status: 'completed',
            }),
        }))
        expect(mockFetch).not.toHaveBeenCalledWith('/api/posts/post-1/tts-metadata', expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
                taskId: 'task-2',
                status: 'failed',
            }),
        }))
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'metadata failed',
        }))
    })

    it('rejects when TTS credentials are expired or about to expire', async () => {
        mockFetch.mockResolvedValueOnce({
            data: {
                provider: 'volcengine',
                mode: 'speech',
                authType: 'query',
                issuedAt: 0,
                expiresInMs: 60000,
                expiresAt: Date.now() - 1000, // 已过期
                endpoint: 'wss://tts.example.com',
                connectId: 'connect-1',
                appId: 'app-1',
                jwtToken: 'jwt',
                authQuery: {
                    api_resource_id: 'volc.service_type.10029',
                    api_access_key: 'Jwt; jwt',
                },
                resourceId: 'volc.service_type.10029',
                temporaryUserId: 'temp-user',
            },
        })

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'hello world',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        })).rejects.toThrow('TTS credentials expired or about to expire')

        expect(direct.error.value).toBe('TTS credentials expired or about to expire')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'TTS credentials expired or about to expire',
        }))
    })

    it('rejects when WebSocket connection fails', async () => {
        MockWebSocket.behavior = 'error'
        mockFetch.mockResolvedValueOnce(createCredentialResponse())

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'hello world',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        })).rejects.toThrow('Volcengine TTS WebSocket connection error')

        expect(direct.error.value).toBe('Volcengine TTS WebSocket connection error')
    })

    it('rejects when WebSocket closes without receiving audio', async () => {
        MockWebSocket.behavior = 'close-no-audio'
        mockFetch.mockResolvedValueOnce(createCredentialResponse())

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'hello world',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        })).rejects.toThrow('Volcengine TTS WebSocket closed without audio')

        expect(direct.error.value).toBe('Volcengine TTS WebSocket closed without audio')
    })

    it('rejects when audio upload fails', async () => {
        // 模拟 WebSocket 成功返回音频数据
        simulateSpeechWebSocketFrames([1, 2, 3, 4])

        mockFetch
            .mockResolvedValueOnce(createCredentialResponse())
            .mockResolvedValueOnce({ success: true, audioUrl: null })

        // 模拟上传失败
        mockUploadFile.mockRejectedValueOnce(new Error('Upload failed'))

        const direct = useTTSVolcengineDirect()

        await expect(direct.generateAndUpload({
            mode: 'speech',
            text: 'This is a valid sample text.',
            voice: 'zh_female_shuangkuaisisi_moon_bigtts',
            postId: 'post-1',
        })).rejects.toThrow('Upload failed')

        expect(direct.error.value).toBe('Upload failed')
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'Upload failed',
        }))
    })
})
