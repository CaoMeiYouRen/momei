import { computed, onUnmounted, ref } from 'vue'
import type { ASRCredentials, ASRMode, ASRProvider, CompressionLevel } from '~/types/asr'
import {
    hasASRCredentialsExpired,
    shouldRefreshASRCredentials,
} from '~/utils/shared/asr-credential-window'

export interface ASRDirectOptions {
    provider: ASRProvider
    mode: ASRMode
    language?: string
    compressionLevel?: CompressionLevel
}

interface VolcengineResponsePacket {
    type: 'response'
    data: unknown
    isFinal: boolean
}

interface VolcengineErrorPacket {
    type: 'error'
    code: number
    message: string
}

interface VolcengineUnknownPacket {
    type: 'unknown'
}

type VolcengineServerPacket = VolcengineResponsePacket | VolcengineErrorPacket | VolcengineUnknownPacket

const VOLCENGINE_MESSAGE_TYPE = {
    fullClientRequest: 0b0001,
    audioOnlyRequest: 0b0010,
    fullServerResponse: 0b1001,
    error: 0b1111,
} as const

const VOLCENGINE_SERIALIZATION = {
    none: 0b0000,
    json: 0b0001,
} as const

const VOLCENGINE_COMPRESSION = {
    none: 0b0000,
    gzip: 0b0001,
} as const

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * ASR 前端直连 Composable
 *
 * 支持前端直连 AI 厂商进行语音识别，绕过后端转发
 */
export function useASRDirect(options: ASRDirectOptions) {
    const isConnecting = ref(false)
    const isConnected = ref(false)
    const isProcessing = ref(false)
    const error = ref<string | null>(null)
    const interimTranscript = ref('')
    const finalTranscript = ref('')

    let ws: WebSocket | null = null
    let credentials: ASRCredentials | null = null
    let credentialsReceivedAt = 0
    let requestSequence = 1
    let manualDisconnect = false
    let reconnectPromise: Promise<void> | null = null
    let reconnectVersion = 0

    // 计算属性
    const isReady = computed(() => isConnected.value && !isProcessing.value)
    const fullTranscript = computed(() => finalTranscript.value + interimTranscript.value)

    /**
     * 获取临时凭证
     */
    const fetchCredentials = async (): Promise<ASRCredentials> => {
        const response = await $fetch<{
            code: number
            data: ASRCredentials
        }>('/api/ai/asr/credentials', {
            method: 'POST',
            body: {
                provider: options.provider,
                mode: options.mode,
            },
        })

        credentials = response.data
        credentialsReceivedAt = Date.now()

        return response.data
    }

    const ensureCredentials = async (behavior: {
        forceRefresh?: boolean
        preferFresh?: boolean
    } = {}): Promise<ASRCredentials> => {
        const currentCredentials = credentials
        const currentReceivedAt = credentialsReceivedAt

        if (!currentCredentials || behavior.forceRefresh) {
            return await fetchCredentials()
        }

        if (hasASRCredentialsExpired(currentCredentials, currentReceivedAt)) {
            return await fetchCredentials()
        }

        if (behavior.preferFresh && shouldRefreshASRCredentials(currentCredentials, currentReceivedAt)) {
            try {
                return await fetchCredentials()
            } catch {
                return currentCredentials
            }
        }

        return currentCredentials
    }

    const reconnectStreamConnection = async () => {
        if (options.mode !== 'stream' || options.provider !== 'volcengine' || manualDisconnect) {
            return
        }

        if (reconnectPromise) {
            await reconnectPromise
            return
        }

        reconnectPromise = (async () => {
            if (isConnecting.value) {
                return
            }

            const currentReconnectVersion = reconnectVersion
            isConnecting.value = true

            try {
                const nextCredentials = await ensureCredentials({ preferFresh: true })

                if (manualDisconnect || currentReconnectVersion !== reconnectVersion) {
                    return
                }

                await connectVolcengineWebSocket(nextCredentials)

                if (manualDisconnect || currentReconnectVersion !== reconnectVersion) {
                    if (ws) {
                        const activeSocket = ws
                        ws = null
                        activeSocket.close()
                    }
                    return
                }

                isConnected.value = true
                error.value = null
            } catch (err: unknown) {
                error.value = toError(err).message || 'connection_failed'
            } finally {
                isConnecting.value = false
                reconnectPromise = null
            }
        })()

        await reconnectPromise
    }

    /**
     * 连接到 AI 厂商 (直连模式)
     */
    const connect = async () => {
        if (isConnected.value || isConnecting.value) {
            return
        }

        isConnecting.value = true
        error.value = null
        manualDisconnect = false

        try {
            // 1. 获取临时凭证
            credentials = await ensureCredentials({ preferFresh: true })

            // 2. 根据模式建立连接
            if (options.mode === 'stream' && options.provider === 'volcengine') {
                await connectVolcengineWebSocket(credentials)
            }

            isConnected.value = true
            isConnecting.value = false
        } catch (err: unknown) {
            error.value = toError(err).message || 'connection_failed'
            isConnecting.value = false
            throw err
        }
    }

    /**
     * 建立火山引擎 WebSocket 直连 (流式模式)
     */
    const connectVolcengineWebSocket = async (creds: ASRCredentials): Promise<void> => new Promise((resolve, reject) => {
        if (!creds.authQuery) {
            reject(new Error('Missing Volcengine query auth parameters'))
            return
        }

        const socketUrl = buildFullUrl(creds.endpoint, creds.authQuery)
        const socket = new WebSocket(socketUrl)
        ws = socket
        socket.binaryType = 'arraybuffer'

        let settled = false

        const resolveOnce = () => {
            if (settled) {
                return
            }
            settled = true
            resolve()
        }

        const rejectOnce = (reason: Error) => {
            if (settled) {
                return
            }
            settled = true
            reject(reason)
        }

        socket.onopen = () => {
            if (ws !== socket) {
                socket.close()
                return
            }

            try {
                requestSequence = 1
                const frame = buildVolcengineStartFrame({
                    sequence: requestSequence,
                    temporaryUserId: creds.temporaryUserId || createTemporaryUserId(),
                })
                requestSequence += 1
                socket.send(frame)
                resolveOnce()
            } catch (err: unknown) {
                rejectOnce(toError(err))
            }
        }

        socket.onmessage = (event) => {
            if (ws !== socket) {
                return
            }

            void handleVolcengineMessage(event.data)
        }

        socket.onerror = () => {
            if (ws !== socket) {
                return
            }

            error.value = 'websocket_error'
            rejectOnce(new Error('WebSocket connection error'))
        }

        socket.onclose = () => {
            if (ws !== socket) {
                return
            }

            isConnected.value = false
            ws = null

            if (!settled) {
                rejectOnce(new Error('WebSocket closed before initialization'))
                return
            }

            if (!manualDisconnect) {
                void reconnectStreamConnection()
            }
        }
    })

    const handleVolcengineMessage = async (rawData: Blob | ArrayBuffer | string) => {
        try {
            const packet = await parseVolcengineServerPacket(rawData)

            if (packet.type === 'error') {
                error.value = packet.message || `transcription_error_${packet.code}`

                if (isCredentialFailure(packet.message)) {
                    void reconnectStreamConnection()
                }

                return
            }

            if (packet.type !== 'response') {
                return
            }

            const text = extractVolcengineTranscript(packet.data)
            if (!text) {
                return
            }

            if (packet.isFinal || hasDefiniteUtterance(packet.data)) {
                finalTranscript.value += text
                interimTranscript.value = ''
                return
            }

            interimTranscript.value = text
        } catch (err: unknown) {
            error.value = toError(err).message || 'response_parse_failed'
        }
    }

    /**
     * 发送音频数据 (流式模式)
     */
    const sendAudio = (pcmData: Float32Array) => {
        if (options.mode !== 'stream' || options.provider !== 'volcengine') {
            return
        }

        if (ws?.readyState !== WebSocket.OPEN) {
            void reconnectStreamConnection()
            return
        }

        try {
            const audioBytes = encodePcmToInt16Bytes(pcmData)
            const frame = buildVolcengineAudioFrame({
                sequence: requestSequence,
                audioBytes,
                isFinal: false,
            })
            requestSequence += 1
            ws.send(frame)
        } catch (err: unknown) {
            error.value = toError(err).message || 'audio_send_failed'
        }
    }

    /**
     * 批量转录 (直连 SiliconFlow)
     */
    const transcribeBatch = async (audioBlob: Blob): Promise<string> => {
        const requestTranscription = async (activeCredentials: ASRCredentials) => {
            const formData = new FormData()
            formData.append('file', audioBlob, 'recording.webm')
            formData.append('model', activeCredentials.model || 'FunAudioLLM/SenseVoiceSmall')

            if (options.language) {
                const lang = options.language.split('-')[0]?.toLowerCase() || 'zh'
                formData.append('language', lang)
            }

            return await $fetch<{
                text: string
                duration?: number
            }>(`${activeCredentials.endpoint}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${activeCredentials.apiKey}`,
                },
                body: formData,
            })
        }

        let activeCredentials = await ensureCredentials({ preferFresh: true })

        isProcessing.value = true
        error.value = null

        try {
            const response = await requestTranscription(activeCredentials)

            finalTranscript.value = response.text
            return response.text
        } catch (err: unknown) {
            if (shouldRetryCredentialRequest(err)) {
                try {
                    activeCredentials = await ensureCredentials({ forceRefresh: true })
                    const retryResponse = await requestTranscription(activeCredentials)
                    finalTranscript.value = retryResponse.text
                    return retryResponse.text
                } catch (retryErr: unknown) {
                    const fetchError = retryErr as { data?: { error?: { message?: string } } }
                    error.value = fetchError.data?.error?.message || 'transcription_failed'
                    throw retryErr
                }
            }

            const fetchError = err as { data?: { error?: { message?: string } } }
            error.value = fetchError.data?.error?.message || 'transcription_failed'
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * 停止识别
     */
    const stop = () => {
        manualDisconnect = true
        reconnectVersion += 1

        if (options.mode === 'stream' && options.provider === 'volcengine' && ws) {
            const activeSocket = ws

            if (activeSocket.readyState === WebSocket.OPEN) {
                try {
                    const frame = buildVolcengineAudioFrame({
                        sequence: requestSequence,
                        audioBytes: new Uint8Array(0),
                        isFinal: true,
                    })
                    requestSequence += 1
                    activeSocket.send(frame)
                } catch (err: unknown) {
                    error.value = toError(err).message || 'stream_stop_failed'
                }

                setTimeout(() => {
                    if (ws === activeSocket) {
                        ws = null
                    }
                    activeSocket.close()
                }, 800)
            } else {
                if (ws === activeSocket) {
                    ws = null
                }
                activeSocket.close()
            }
        }

        isConnected.value = false
        isConnecting.value = false
    }

    /**
     * 断开连接
     */
    const disconnect = () => {
        manualDisconnect = true
        stop()
        credentials = null
        credentialsReceivedAt = 0
    }

    /**
     * 重置状态
     */
    const reset = () => {
        interimTranscript.value = ''
        finalTranscript.value = ''
        error.value = null
    }

    // 清理资源
    onUnmounted(() => {
        disconnect()
    })

    return {
        // 状态
        isConnecting,
        isConnected,
        isProcessing,
        isReady,
        error,
        interimTranscript,
        finalTranscript,
        fullTranscript,

        // 方法
        connect,
        disconnect,
        stop,
        sendAudio,
        transcribeBatch,
        reset,
    }
}

function buildFullUrl(url: string, query: Record<string, string>): string {
    const fullUrl = new URL(url)

    Object.entries(query).forEach(([key, value]) => {
        fullUrl.searchParams.set(key, value)
    })

    return fullUrl.toString()
}

function createTemporaryUserId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    return `asr-${Date.now()}`
}

function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value
    }

    return new Error(typeof value === 'string' ? value : 'unknown_error')
}

function isCredentialFailure(message: string | undefined) {
    if (!message) {
        return false
    }

    return /expire|credential|token|auth/i.test(message)
}

function shouldRetryCredentialRequest(error: unknown) {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as {
        status?: number
        statusCode?: number
        response?: { status?: number }
        data?: { error?: { message?: string }, message?: string }
    }

    const status = maybeError.status
        ?? maybeError.statusCode
        ?? maybeError.response?.status

    if (status === 401) {
        return true
    }

    return isCredentialFailure(maybeError.data?.error?.message || maybeError.data?.message)
}

function buildVolcengineStartFrame(options: {
    sequence: number
    temporaryUserId: string
}): Uint8Array {
    const audio = {
        format: 'pcm',
        codec: 'raw',
        rate: 16000,
        bits: 16,
        channel: 1,
    }

    const request = {
        model_name: 'bigmodel',
        enable_itn: true,
        enable_punc: true,
        show_utterances: true,
        result_type: 'single',
    }

    const payload = textEncoder.encode(JSON.stringify({
        user: {
            uid: options.temporaryUserId,
        },
        audio,
        request,
    }))

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: 0b0001,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [createSignedInt32Buffer(options.sequence)],
        payload,
    })
}

function buildVolcengineAudioFrame(options: {
    sequence: number
    audioBytes: Uint8Array
    isFinal: boolean
}): Uint8Array {
    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.audioOnlyRequest,
        messageTypeFlags: options.isFinal ? 0b0011 : 0b0001,
        serialization: VOLCENGINE_SERIALIZATION.none,
        compression: VOLCENGINE_COMPRESSION.none,
        prefixBuffers: [createSignedInt32Buffer(options.isFinal ? -Math.abs(options.sequence) : options.sequence)],
        payload: options.audioBytes,
    })
}

function buildVolcengineBinaryFrame(options: {
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
    prefixBuffers?: Uint8Array[]
    payload: Uint8Array
}): Uint8Array {
    const header = new Uint8Array(4)
    header[0] = (0b0001 << 4) | 0b0001
    header[1] = (options.messageType << 4) | options.messageTypeFlags
    header[2] = (options.serialization << 4) | options.compression
    header[3] = 0

    return concatBytes(
        header,
        ...(options.prefixBuffers || []),
        createUnsignedInt32Buffer(options.payload.length),
        options.payload,
    )
}

function createSignedInt32Buffer(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setInt32(0, value, false)
    return new Uint8Array(buffer)
}

function createUnsignedInt32Buffer(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setUint32(0, value, false)
    return new Uint8Array(buffer)
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0

    chunks.forEach((chunk) => {
        merged.set(chunk, offset)
        offset += chunk.length
    })

    return merged
}

function encodePcmToInt16Bytes(float32Samples: Float32Array): Uint8Array {
    const pcmBuffer = new ArrayBuffer(float32Samples.length * 2)
    const pcmView = new DataView(pcmBuffer)

    for (let i = 0; i < float32Samples.length; i++) {
        const sample = float32Samples[i] ?? 0
        const clamped = Math.max(-1, Math.min(1, sample))
        const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
        pcmView.setInt16(i * 2, int16, true)
    }

    return new Uint8Array(pcmBuffer)
}

async function parseVolcengineServerPacket(rawData: Blob | ArrayBuffer | string): Promise<VolcengineServerPacket> {
    if (typeof rawData === 'string') {
        return { type: 'unknown' }
    }

    const data = rawData instanceof Blob
        ? new Uint8Array(await rawData.arrayBuffer())
        : new Uint8Array(rawData)

    if (data.length < 4) {
        return { type: 'unknown' }
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const messageType = (view.getUint8(1) >> 4) & 0x0f
    const messageTypeFlags = view.getUint8(1) & 0x0f
    const serialization = (view.getUint8(2) >> 4) & 0x0f
    const compression = view.getUint8(2) & 0x0f

    if (messageType === VOLCENGINE_MESSAGE_TYPE.error) {
        if (data.length < 12) {
            return {
                type: 'error',
                code: 0,
                message: 'Unknown server error',
            }
        }

        const code = view.getUint32(4, false)
        const size = view.getUint32(8, false)
        const message = textDecoder.decode(data.subarray(12, 12 + size))

        return {
            type: 'error',
            code,
            message,
        }
    }

    if (messageType !== VOLCENGINE_MESSAGE_TYPE.fullServerResponse || data.length < 12) {
        return { type: 'unknown' }
    }

    const payloadSize = view.getUint32(8, false)
    const payloadStart = 12
    const payloadEnd = payloadStart + payloadSize

    if (data.length < payloadEnd) {
        return { type: 'unknown' }
    }

    const payload = await decodeVolcenginePayload(data.subarray(payloadStart, payloadEnd), compression)

    return {
        type: 'response',
        data: decodeVolcengineSerializedPayload(payload, serialization),
        isFinal: messageTypeFlags === 0b0010 || messageTypeFlags === 0b0011,
    }
}

async function decodeVolcenginePayload(payload: Uint8Array, compression: number): Promise<Uint8Array> {
    if (compression !== VOLCENGINE_COMPRESSION.gzip || payload.length === 0) {
        return payload
    }

    if (typeof DecompressionStream === 'undefined') {
        throw new Error('gzip_response_not_supported')
    }

    const payloadBuffer = payload.slice().buffer
    const stream = new Blob([payloadBuffer]).stream().pipeThrough(new DecompressionStream('gzip'))
    const buffer = await new Response(stream).arrayBuffer()
    return new Uint8Array(buffer)
}

function decodeVolcengineSerializedPayload(payload: Uint8Array, serialization: number): unknown {
    if (serialization === VOLCENGINE_SERIALIZATION.none) {
        return textDecoder.decode(payload)
    }

    const text = textDecoder.decode(payload)
    if (serialization === VOLCENGINE_SERIALIZATION.json) {
        try {
            return JSON.parse(text) as unknown
        } catch {
            return text
        }
    }

    return text
}

function extractVolcengineTranscript(payload: unknown): string {
    if (!isRecord(payload)) {
        return ''
    }

    const result = payload.result
    if (isRecord(result) && typeof result.text === 'string') {
        return result.text
    }

    if (Array.isArray(result)) {
        return result
            .map((item) => (isRecord(item) && typeof item.text === 'string' ? item.text : ''))
            .join('')
    }

    return typeof payload.text === 'string' ? payload.text : ''
}

function hasDefiniteUtterance(payload: unknown): boolean {
    if (!isRecord(payload) || !isRecord(payload.result)) {
        return false
    }

    const utterances = payload.result.utterances
    return Array.isArray(utterances)
        && utterances.some((item) => isRecord(item) && item.definite === true)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}
