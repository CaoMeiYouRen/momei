/**
 * 火山引擎 TTS 前端直连 Composable（前端直出模式）
 *
 * 用途: 前端直接调用火山引擎 TTS API（HTTP 单向流式），绕过后端代理。
 *       利用浏览器无超时限制的优势，解决 Vercel 云函数 60s 硬超时问题。
 *
 * 流程:
 *   1. POST /api/ai/tts/credentials → 获取临时 JWT
 *   2. POST Volcengine TTS API (JWT via Query) → 流式接收音频
 *   3. 解析响应（JSON 元数据 + MP3 字节流）
 *   4. useUpload 直传 OSS
 *   5. PATCH /api/posts/[id]/tts-metadata → 回写元数据
 *
 * 鉴权方案: JWT Token（方案一）
 *   - 服务端用 AppId + Access Token 请求火山 STS 获取临时 JWT
 *   - HTTP speech 模式：Header `X-Api-Access-Key: Jwt; jwt_token`
 *   - WebSocket podcast 模式（将来）：URL Query `?api_access_key=Jwt%3B%20jwt_token`
 *
 * 支持模式:
 *   - speech: HTTP 单向流式 (POST .../api/v3/tts/unidirectional)
 *   - podcast: WebSocket 双向流式 (未来支持，复杂度更高)
 */
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useUpload, UploadType } from './use-upload'

// ---- 类型 ----

export interface TTSVolcengineDirectParams {
    /** TTS 模式 */
    mode: 'speech' | 'podcast'
    /** 合成文本 */
    text: string
    /** 音色 ID */
    voice: string
    /** 语速 (0.25 - 2.0) */
    speed?: number
    /** 音量 (0.5 - 2.0) */
    volume?: number
    /** 语言代码 */
    language?: string
    /** 关联文章 ID */
    postId?: string | null
}

export interface TTSVolcengineDirectResult {
    audioUrl: string
    duration: number
}

// ---- Volcengine Credentials 类型 ----

interface VolcengineTTSCredentials {
    provider: 'volcengine'
    mode: 'speech' | 'podcast'
    authType: 'query'
    issuedAt: number
    expiresInMs: number
    expiresAt: number
    endpoint: string
    connectId: string
    appId: string
    jwtToken: string
    authQuery: Record<string, string>
    resourceId: string
    appKey?: string
    temporaryUserId: string
}

// ---- 常量 ----

/**
 * 判断是否为 Saturn 系列（声音复刻）或 Uranus 系列（豆包 2.0）音色
 */
function isV2Speaker(speaker: string): boolean {
    return speaker.startsWith('saturn_') || speaker.endsWith('_uranus_bigtts')
}

/**
 * 根据音色自动推断 bodyModel
 */
function resolveBodyModel(speaker: string, explicitModel?: string): string {
    if (explicitModel && explicitModel !== 'unknown' && explicitModel !== 'seed-tts-2.0') {
        return explicitModel
    }
    if (isV2Speaker(speaker)) {
        return 'seed-tts-2.0-expressive'
    }
    return 'seed-tts-1.1'
}

/**
 * 将 0-2 范围的语速转换为火山 API 的 [-50, 100] 范围
 */
function convertSpeechRate(speed: number): number {
    if (speed >= 1) {
        return Math.min(100, Math.round((speed - 1) * 100))
    }
    return Math.max(-50, Math.round((speed - 1) * 100))
}

/**
 * 将 0-2 范围的音量转换为火山 API 的 [-50, 100] 范围
 */
function convertLoudnessRate(volume: number): number {
    if (volume >= 1) {
        return Math.min(100, Math.round((volume - 1) * 100))
    }
    return Math.max(-50, Math.round((volume - 1) * 100))
}

// ---- Composable ----

// eslint-disable-next-line max-lines-per-function
export function useTTSVolcengineDirect() {
    const { t } = useI18n()
    const toast = useToast()

    const progress = ref(0) // 0-100
    const error = ref<string | null>(null)
    const isGenerating = ref(false)

    const { uploadFile } = useUpload({
        type: UploadType.AUDIO,
        showErrorToast: false,
    })

    /**
     * 从服务端获取 Volcengine 临时凭证
     */
    async function fetchCredentials(mode: 'speech' | 'podcast'): Promise<VolcengineTTSCredentials> {
        const response = await $fetch<{ code: number, data: VolcengineTTSCredentials }>(
            '/api/ai/tts/credentials',
            {
                method: 'POST',
                body: { provider: 'volcengine', mode },
            },
        )
        return response.data
    }

    /**
     * 构建 TTS 请求体（与 server/utils/ai/tts-volcengine.ts 对齐）
     */
    function buildSpeechRequestBody(params: TTSVolcengineDirectParams, credentials: VolcengineTTSCredentials) {
        const { text, voice, speed, volume, language } = params
        const speaker = voice || 'zh_female_shuangkuaisisi_moon_bigtts'
        const bodyModel = resolveBodyModel(speaker)

        const additions: Record<string, unknown> = {
            explicit_language: language || 'zh',
            disable_markdown_filter: true,
            enable_timestamp: true,
        }

        return {
            user: { uid: credentials.temporaryUserId },
            req_params: {
                text,
                model: bodyModel,
                speaker,
                audio_params: {
                    format: 'mp3',
                    sample_rate: 24000,
                    speech_rate: convertSpeechRate(speed ?? 1.0),
                    loudness_rate: convertLoudnessRate(volume ?? 1.0),
                    enable_timestamp: true,
                },
                additions: JSON.stringify(additions),
            },
        }
    }

    /**
     * 调用火山 TTS API 并接收音频数据
     *
     * V3 接口鉴权：header 添加 "X-Api-Access-Key: Jwt; jwt_token"
     * Query 方式（?api_jwt=...）留作 WebSocket 播客模式备用。
     *
     * 火山 V3 unidirectional 端点响应格式:
     *   - 可能以 JSON 元数据开头（如 {"reqid":"...","code":3000,...}），
     *     之后紧跟 MP3 字节流
     *   - 简单策略：读完整响应为 ArrayBuffer，然后扫描找到 JSON 结束位置
     */
    async function callVolcengineTTS(
        credentials: VolcengineTTSCredentials,
        params: TTSVolcengineDirectParams,
    ): Promise<Uint8Array> {
        const body = buildSpeechRequestBody(params, credentials)

        const response = await fetch(credentials.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-App-Id': credentials.appId,
                'X-Api-Access-Key': `Jwt; ${credentials.jwtToken}`,
                'X-Api-Resource-Id': credentials.resourceId,
                'X-Api-Request-Id': crypto.randomUUID(),
                Connection: 'keep-alive',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`Volcengine TTS API error (${response.status}): ${errorText}`)
        }

        progress.value = 30

        // 流式读取响应，按字节量更新进度
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Response body is not readable')
        }

        const chunks: Uint8Array[] = []
        let receivedBytes = 0
        /** 估算总字节：按 16KB/s × 字符数/2(s) */
        const estimatedTotal = Math.max(50 * 1024, body.req_params.text.length * 8)

        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            chunks.push(value)
            receivedBytes += value.length
            // 30% → 65%，按已收字节比例映射
            const ratio = Math.min(1, receivedBytes / estimatedTotal)
            progress.value = 30 + Math.round(ratio * 35)
        }

        if (chunks.length === 0) {
            throw new Error('No audio data received from Volcengine TTS API')
        }

        // 合并 chunks
        const totalSize = chunks.reduce((s, c) => s + c.length, 0)
        const fullData = new Uint8Array(totalSize)
        let offset = 0
        for (const c of chunks) {
            fullData.set(c, offset)
            offset += c.length
        }

        progress.value = 65

        // 火山 V3 API 可能在响应体开头返回 JSON 元数据。
        // 扫描第一个 '{' 到对应的 '}' 之间的 JSON 对象，音频从其后开始。
        const audioStart = findJsonBoundary(fullData)

        if (audioStart > 0) {
            // JSON 元数据存在，提取后续音频字节
            const audioData = fullData.slice(audioStart)
            progress.value = 70
            return audioData
        }

        // 没有 JSON 前缀，整个响应体就是音频
        progress.value = 70
        return fullData
    }

    /**
     * 在字节数组中查找首段 JSON 对象的结束位置。
     * 如果在开头检测到 '{'，则扫描到匹配的 '}' 之后的位置。
     * 返回音频数据的起始偏移量（即 JSON 结束后的位置）。
     */
    function findJsonBoundary(data: Uint8Array): number {
        // 检查响应是否以 '{' 开头
        if (data.length < 2 || data[0] !== 0x7B /* '{' */) {
            return 0 // 没有 JSON 前缀
        }

        const text = new TextDecoder().decode(data.subarray(0, Math.min(4096, data.length)))

        let depth = 0
        let inString = false
        let escaped = false

        for (let i = 0; i < text.length; i++) {
            const ch = text[i]

            if (inString) {
                if (escaped) {
                    escaped = false
                    continue
                }
                if (ch === '\\') {
                    escaped = true
                    continue
                }
                if (ch === '"') {
                    inString = false
                }
                continue
            }

            if (ch === '"') {
                inString = true
                continue
            }
            if (ch === '{') {
                depth++
                continue
            }
            if (ch === '}') {
                depth--
                if (depth === 0) {
                    // JSON 对象结束，音频从下一个字节开始
                    // i 是字符索引，需要计算字节偏移
                    const encoder = new TextEncoder()
                    const jsonPrefix = text.substring(0, i + 1)
                    return encoder.encode(jsonPrefix).length
                }
            }
        }

        return 0 // 未找到完整 JSON
    }

    // ---- Podcast WebSocket 协议（浏览器端简化版） ----

    /** 火山二进制帧常量（与 server/utils/ai/volcengine-protocol.ts 对齐） */
    const VOLC_PROTOCOL_VERSION = 0b0001
    const VOLC_HEADER_SIZE_UNITS = 0b0001

    // 消息类型
    const VOLC_MSG_FULL_CLIENT = 0b0001 // fullClientRequest
    const VOLC_MSG_ERROR = 0b1111 // error

    // 序列化 & 压缩
    const VOLC_SERIAL_JSON = 0b0001
    const VOLC_COMPRESS_NONE = 0b0000

    // ---- 二进制帧构建 ----

    /**
     * 构建播客 StartSession 帧（event=100，对齐 buildVolcengineEventClientRequestFrame）
     *
     * 帧格式（与 server/utils/ai/volcengine-protocol.ts 完全对齐）：
     *   header(4B) + event(4B int32BE) + sessionIdLen(4B uint32BE) + sessionId
     *   + payloadLen(4B uint32BE) + payload
     */
    function buildPodcastStartFrame(sessionId: string, text: string, speakerIds: string[]): Uint8Array {
        const encoder = new TextEncoder()
        const payloadObj = {
            input_id: sessionId,
            input_text: text,
            action: 0,
            use_head_music: false,
            use_tail_music: false,
            audio_config: { format: 'mp3', sample_rate: 24000, speech_rate: 0 },
            speaker_info: { random_order: true, speakers: speakerIds },
            aigc_watermark: false,
        }
        const payloadJson = JSON.stringify(payloadObj)
        const payloadBytes = encoder.encode(payloadJson)
        const sessionBytes = encoder.encode(sessionId)

        // 计算各段长度
        const headerLen = 4
        const eventLen = 4
        const sessionIdSizeLen = 4
        const payloadSizeLen = 4
        const prefixLen = eventLen + sessionIdSizeLen + sessionBytes.length + payloadSizeLen
        const total = headerLen + prefixLen + payloadBytes.length

        const frame = new Uint8Array(total)
        const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)

        // 1. Header (4 bytes)
        view.setUint8(0, (VOLC_PROTOCOL_VERSION << 4) | VOLC_HEADER_SIZE_UNITS)
        view.setUint8(1, (VOLC_MSG_FULL_CLIENT << 4) | 0b0100)
        view.setUint8(2, (VOLC_SERIAL_JSON << 4) | VOLC_COMPRESS_NONE)
        view.setUint8(3, 0)

        // 2. Event = 100 (int32 BE at offset 4)
        view.setInt32(headerLen, 100, false)

        // 3. SessionId length (uint32 BE at offset 8)
        view.setUint32(headerLen + eventLen, sessionBytes.length, false)

        // 4. SessionId bytes (at offset 12)
        frame.set(sessionBytes, headerLen + eventLen + sessionIdSizeLen)

        // 5. Payload length (uint32 BE after sessionId)
        const payloadSizeOffset = headerLen + eventLen + sessionIdSizeLen + sessionBytes.length
        view.setUint32(payloadSizeOffset, payloadBytes.length, false)

        // 6. Payload bytes
        frame.set(payloadBytes, payloadSizeOffset + payloadSizeLen)

        return frame
    }

    /**
     * 构建 FinishConnection 帧（event=2，不含 sessionId）
     *
     * 对齐 buildVolcengineConnectionClientRequestFrame:
     *   header(4B) + event=2(4B) + payloadSize(4B) + payload({})
     */
    function buildPodcastFinishFrame(): Uint8Array {
        const encoder = new TextEncoder()
        const payloadBytes = encoder.encode('{}')

        const headerLen = 4
        const eventLen = 4
        const payloadSizeLen = 4
        const total = headerLen + eventLen + payloadSizeLen + payloadBytes.length

        const frame = new Uint8Array(total)
        const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength)

        view.setUint8(0, (VOLC_PROTOCOL_VERSION << 4) | VOLC_HEADER_SIZE_UNITS)
        view.setUint8(1, (VOLC_MSG_FULL_CLIENT << 4) | 0b0100)
        view.setUint8(2, (VOLC_SERIAL_JSON << 4) | VOLC_COMPRESS_NONE)
        view.setUint8(3, 0)
        view.setInt32(headerLen, 2, false)
        view.setUint32(headerLen + eventLen, payloadBytes.length, false)
        frame.set(payloadBytes, headerLen + eventLen + payloadSizeLen)

        return frame
    }

    // ---- 二进制帧解析（对齐 parseVolcengineEventPacket + parseVolcengineErrorPacket） ----

    interface VolcengineParsedFrame {
        event: number
        sessionId: string
        /** 原始 payload 字节（JSON 文本或音频） */
        rawPayload: Uint8Array
        /** 如果 serialization=JSON，payloadDecoded 为解析后的对象 */
        payloadDecoded: unknown
        messageType: number
        messageTypeFlags: number
        serialization: number
        compression: number
    }

    function parseVolcengineFrame(data: ArrayBuffer): VolcengineParsedFrame | null {
        const bytes = new Uint8Array(data)
        if (bytes.length < 16) {
            return null
        }

        const messageType = (bytes[1]! >> 4) & 0x0F
        const messageTypeFlags = bytes[1]! & 0x0F
        const serialization = (bytes[2]! >> 4) & 0x0F
        const compression = bytes[2]! & 0x0F

        // 仅处理 fullServerResponse (0b1001) 和 audioOnlyServerResponse (0b1011)
        if (messageType !== 0b1001 && messageType !== 0b1011) {
            return null
        }

        let cursor = 4
        if (bytes.length < cursor + 4) {
            return null
        }
        const view = new DataView(data)
        const event = view.getInt32(cursor, false)
        cursor += 4

        if (bytes.length < cursor + 4) {
            return null
        }
        const sessionIdSize = view.getUint32(cursor, false)
        cursor += 4

        if (sessionIdSize === 0 || bytes.length < cursor + sessionIdSize + 4) {
            return null
        }
        const sessionId = new TextDecoder().decode(bytes.subarray(cursor, cursor + sessionIdSize))
        cursor += sessionIdSize

        const payloadSize = view.getUint32(cursor, false)
        cursor += 4

        if (bytes.length < cursor + payloadSize) {
            return null
        }
        const rawPayload = bytes.subarray(cursor, cursor + payloadSize)

        // 解析 payload（简化版，不支持 gzip 解压）
        let payloadDecoded: unknown = rawPayload
        if (serialization === VOLC_SERIAL_JSON && rawPayload.length > 0) {
            try {
                payloadDecoded = JSON.parse(new TextDecoder().decode(rawPayload))
            } catch {
                payloadDecoded = rawPayload
            }
        }

        return { event, sessionId, rawPayload, payloadDecoded, messageType, messageTypeFlags, serialization, compression }
    }

    /** 解析错误帧 */
    function parseVolcengineErrorFrame(data: ArrayBuffer): { code: number, message: string } | null {
        const bytes = new Uint8Array(data)
        if (bytes.length < 8) {
            return null
        }
        const messageType = (bytes[1]! >> 4) & 0x0F
        if (messageType !== VOLC_MSG_ERROR) {
            return null
        }
        const view = new DataView(data)
        const code = view.getInt32(4, false)
        const payload = bytes.subarray(8)
        const message = new TextDecoder().decode(payload)
        return { code, message }
    }

    /**
     * 火山播客 WebSocket 直连（对齐 server/utils/ai/tts-volcengine.ts generatePodcastSpeech）
     */
    async function callVolcenginePodcast(
        credentials: VolcengineTTSCredentials,
        params: TTSVolcengineDirectParams,
    ): Promise<Uint8Array> {
        const { text, voice } = params
        const speakerIds = voice.includes(',')
            ? voice.split(',').map((s) => s.trim())
            : ['zh_male_dayixiansheng_v2_saturn_bigtts', 'zh_female_mizaitongxue_v2_saturn_bigtts']

        // JWT via URL Query（浏览器 WebSocket 不支持自定义 header）
        const queryStr = new URLSearchParams(credentials.authQuery).toString()
        const wsUrl = `${credentials.endpoint}?${queryStr}`
        const sessionId = crypto.randomUUID()

        return new Promise<Uint8Array>((resolve, reject) => {
            const ws = new WebSocket(wsUrl)
            ws.binaryType = 'arraybuffer'

            const audioChunks: Uint8Array[] = []
            let settled = false
            let totalBytes = 0
            /** 估算最大音频字节：按 16KB/s × 字符数/2(s) 粗略估算，下限 100KB */
            const estimatedMaxBytes = Math.max(100 * 1024, text.length * 8)

            const updatePodcastProgress = () => {
                // 15% 起步，按已收字节比例映射到 [15, 70]
                const ratio = Math.min(1, totalBytes / estimatedMaxBytes)
                progress.value = 15 + Math.round(ratio * 55)
            }

            const cleanup = () => {
                settled = true
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close()
                }
            }

            ws.onopen = () => {
                const startFrame = buildPodcastStartFrame(sessionId, text, speakerIds)
                ws.send(startFrame.buffer as ArrayBuffer)
                progress.value = 15
                console.log('[TTS Podcast] WS connected, session:', sessionId)
            }

            ws.onmessage = (ev) => {
                if (settled) {
                    return
                }
                const data = ev.data as ArrayBuffer

                // 先检查错误帧
                const errorPkt = parseVolcengineErrorFrame(data)
                if (errorPkt) {
                    console.error('[TTS Podcast] Error frame:', errorPkt)
                    cleanup()
                    reject(new Error(`Volcengine Podcast Error(${errorPkt.code}): ${errorPkt.message}`))
                    return
                }

                const pkt = parseVolcengineFrame(data)
                if (!pkt) {
                    console.warn('[TTS Podcast] Unparsed frame, len:', data.byteLength)
                    return
                }

                console.log('[TTS Podcast] Event:', pkt.event, 'payloadLen:', pkt.rawPayload.length)

                // event=361: 音频数据（对齐服务端处理逻辑）
                if (pkt.event === 361) {
                    const payload = pkt.rawPayload
                    if (payload && payload.length > 0) {
                        audioChunks.push(payload)
                        totalBytes += payload.length
                        updatePodcastProgress()
                        return
                    }

                    // 如果 rawPayload 为空但 payloadDecoded 是对象，尝试取 data/audio 字段（base64）
                    if (pkt.payloadDecoded && typeof pkt.payloadDecoded === 'object') {
                        const obj = pkt.payloadDecoded as Record<string, unknown>
                        let b64: string | undefined
                        if (typeof obj.data === 'string') {
                            b64 = obj.data
                        } else if (typeof obj.audio === 'string') {
                            b64 = obj.audio
                        }
                        if (b64) {
                            try {
                                const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
                                if (binary.length > 0) {
                                    audioChunks.push(binary)
                                    totalBytes += binary.length
                                    updatePodcastProgress()
                                }
                            } catch { /* ignore */ }
                        }
                    }
                    return
                }

                // event=362: 轮次结束，检查错误
                if (pkt.event === 362 && pkt.payloadDecoded && typeof pkt.payloadDecoded === 'object') {
                    const obj = pkt.payloadDecoded as Record<string, unknown>
                    if (obj.is_error === true) {
                        cleanup()
                        reject(new Error(typeof obj.error_msg === 'string' ? obj.error_msg : 'Volcengine Podcast round error'))
                    }
                    return
                }

                // event=363: 播客结束（可能带 audio_url）— 主动触发结束
                // event=154: 用量信息
                if (pkt.event === 363 || pkt.event === 154) {
                    if (pkt.event === 363 && !settled) {
                        // 发 FinishConnection 通知服务端结束
                        try {
                            if (ws.readyState === WebSocket.OPEN) {
                                const finishFrame = buildPodcastFinishFrame()
                                ws.send(finishFrame.buffer as ArrayBuffer)
                            }
                        } catch { /* ignore */ }
                        // 设置超时兜底：5 秒后若仍未 resolve，用已有音频关闭
                        setTimeout(() => {
                            if (!settled) {
                                console.log('[TTS Podcast] Timeout after PodcastEnd, resolving with', audioChunks.length, 'chunks')
                                cleanup()
                                progress.value = 70
                                const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                                const merged = new Uint8Array(total)
                                let offset = 0
                                for (const c of audioChunks) {
                                    merged.set(c, offset)
                                    offset += c.length
                                }
                                resolve(merged)
                            }
                        }, 5000)
                    }
                    return
                }

                // event=152: 会话结束 → 发 FinishConnection → 关闭
                if (pkt.event === 152) {
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            const finishFrame = buildPodcastFinishFrame()
                            ws.send(finishFrame.buffer as ArrayBuffer)
                        }
                    } catch { /* ignore */ }
                    cleanup()
                    progress.value = 70
                    console.log('[TTS Podcast] Resolving with', audioChunks.length, 'audio chunks,', totalBytes, 'bytes')
                    const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                    const merged = new Uint8Array(total)
                    let offset = 0
                    for (const c of audioChunks) {
                        merged.set(c, offset)
                        offset += c.length
                    }
                    resolve(merged)
                }
            }

            ws.onerror = () => {
                if (!settled) {
                    cleanup()
                    reject(new Error('Volcengine Podcast WebSocket connection error'))
                }
            }

            ws.onclose = () => {
                if (!settled) {
                    console.log('[TTS Podcast] WS closed, chunks:', audioChunks.length, 'bytes:', totalBytes)
                    cleanup()
                    if (audioChunks.length > 0) {
                        const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                        const merged = new Uint8Array(total)
                        let offset = 0
                        for (const c of audioChunks) {
                            merged.set(c, offset)
                            offset += c.length
                        }
                        resolve(merged)
                    } else {
                        reject(new Error('Volcengine Podcast WebSocket closed without audio'))
                    }
                }
            }
        })
    }

    /**
     * 执行端到端 TTS 直出流程
     */
    async function generateAndUpload(params: TTSVolcengineDirectParams): Promise<TTSVolcengineDirectResult> {
        isGenerating.value = true
        progress.value = 0
        error.value = null

        try {
            // 1. 获取凭证
            progress.value = 5
            const credentials = await fetchCredentials(params.mode)

            // 2. 检查凭证是否即将过期
            if (Date.now() + 30000 > credentials.expiresAt) {
                throw new Error('TTS credentials expired or about to expire')
            }

            // 3. 调用火山 TTS API
            progress.value = 10
            const audioBytes = params.mode === 'podcast'
                ? await callVolcenginePodcast(credentials, params)
                : await callVolcengineTTS(credentials, params)

            if (audioBytes.length === 0) {
                throw new Error('No audio data received from Volcengine TTS API')
            }

            // 4. 上传 OSS
            progress.value = 75
            const audioBlob = new Blob([audioBytes] as BlobPart[], { type: 'audio/mpeg' })
            const fileName = `tts-volc-${Date.now()}.mp3`
            const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' })

            const audioUrl = await uploadFile(audioFile)
            progress.value = 95

            // 5. 回写元数据
            const duration = Math.round(audioBytes.length / 16000) // 128kbps MP3 估算
            if (params.postId) {
                try {
                    await $fetch(`/api/posts/${params.postId}/tts-metadata`, {
                        method: 'PATCH',
                        body: {
                            audioUrl,
                            provider: 'volcengine',
                            voice: params.voice,
                            mode: params.mode,
                            duration,
                        },
                    })
                } catch (metaError: any) {
                    console.warn('[useTTSVolcengineDirect] Metadata write-back failed (non-blocking):', metaError)
                }
            }

            progress.value = 100
            isGenerating.value = false

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('admin.post.tts.completed'),
                life: 3000,
            })

            return { audioUrl, duration }
        } catch (err: any) {
            const message = err.data?.statusMessage || err.message || t('common.error')
            error.value = message
            isGenerating.value = false

            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: message,
                life: 5000,
            })

            throw err
        }
    }

    return {
        progress,
        error,
        isGenerating,
        generateAndUpload,
    }
}
