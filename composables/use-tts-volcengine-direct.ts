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

        // 读完整响应为 ArrayBuffer
        const arrayBuffer = await response.arrayBuffer()
        const fullData = new Uint8Array(arrayBuffer)

        progress.value = 50

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

    /** 火山二进制帧 + 序列化常量 */
    const VOLC_PROTOCOL_VERSION = 0b0001
    const VOLC_HEADER_SIZE = 4
    const VOLC_MSG_FULL_CLIENT = 0b0001
    const VOLC_MSG_FULL_SERVER = 0b1001
    const VOLC_MSG_ERROR = 0b1111
    const VOLC_SERIAL_JSON = 0b0001
    const VOLC_COMPRESS_NONE = 0b0000

    /**
     * 构建火山二进制帧头（浏览器端，不含 Node Buffer）
     */
    function buildBinaryFrameHeader(opts: {
        messageType: number
        messageTypeFlags: number
        serialization: number
        compression: number
        payloadSize: number
    }): Uint8Array {
        const header = new Uint8Array(VOLC_HEADER_SIZE)
        header[0] = (VOLC_PROTOCOL_VERSION << 4) | (VOLC_HEADER_SIZE >> 0)
        header[1] = (opts.messageType << 4) | opts.messageTypeFlags
        header[2] = (opts.serialization << 4) | opts.compression
        // payload size 暂不写入 header（由 WebSocket 帧自动分片）
        void opts.payloadSize
        return header
    }

    /**
     * 构建播客 start 帧（event=100，fullClientRequest）
     */
    function buildPodcastStartFrame(sessionId: string, text: string, speakerIds: string[]): ArrayBuffer {
        const encoder = new TextEncoder()
        const payload = {
            input_id: sessionId,
            input_text: text,
            action: 0,
            use_head_music: false,
            use_tail_music: false,
            audio_config: { format: 'mp3', sample_rate: 24000, speech_rate: 0 },
            speaker_info: { random_order: true, speakers: speakerIds.map((id) => ({ speaker_id: id })) },
            aigc_watermark: false,
        }
        const payloadJson = JSON.stringify(payload)
        const payloadBytes = encoder.encode(payloadJson)
        const sessionBytes = encoder.encode(sessionId)

        // event (4 bytes) + sessionId length (4 bytes) + sessionId + payload
        const eventBuf = new Uint8Array(4)
        new DataView(eventBuf.buffer).setInt32(0, 100, false)

        const sessionLenBuf = new Uint8Array(4)
        new DataView(sessionLenBuf.buffer).setUint32(0, sessionBytes.length, false)

        const header = buildBinaryFrameHeader({
            messageType: VOLC_MSG_FULL_CLIENT,
            messageTypeFlags: 0b0100,
            serialization: VOLC_SERIAL_JSON,
            compression: VOLC_COMPRESS_NONE,
            payloadSize: 4 + 4 + sessionBytes.length + payloadBytes.length,
        })

        const total = header.length + eventBuf.length + sessionLenBuf.length + sessionBytes.length + payloadBytes.length
        const frame = new Uint8Array(total)
        let offset = 0
        frame.set(header, offset)
        offset += header.length
        frame.set(eventBuf, offset)
        offset += eventBuf.length
        frame.set(sessionLenBuf, offset)
        offset += sessionLenBuf.length
        frame.set(sessionBytes, offset)
        offset += sessionBytes.length
        frame.set(payloadBytes, offset)
        return frame.buffer
    }

    /**
     * 解析火山二进制帧（浏览器端简化版）
     * 返回 { event, payload } 或 null
     */
    function parseVolcengineFrame(data: ArrayBuffer): { event: number, payload: ArrayBuffer } | null {
        if (data.byteLength < VOLC_HEADER_SIZE + 4) {
            return null
        }
        const view = new DataView(data)
        const messageType = (view.getUint8(1) >> 4) & 0x0F
        void (view.getUint8(2) & 0x0F) // compression byte, reserved for future gzip support

        if (messageType === VOLC_MSG_ERROR) {
            const payloadStart = VOLC_HEADER_SIZE + 4
            const payloadBytes = data.slice(payloadStart)
            const text = new TextDecoder().decode(payloadBytes)
            throw new Error(`Volcengine Podcast Error: ${text}`)
        }

        if (messageType !== VOLC_MSG_FULL_SERVER) {
            return null
        }

        const event = view.getInt32(VOLC_HEADER_SIZE, false)
        const payloadStart = VOLC_HEADER_SIZE + 4

        const payload = data.slice(payloadStart)
        // 注：gzip 解压暂未在原型中实现，生产环境需通过 DecompressionStream 异步解压

        return { event, payload }
    }

    /**
     * 火山播客 WebSocket 直连
     *
     * 流程: 连接 WS → 发 start 帧 → 接收 audio 帧 (event=361) → 收 finish 帧 → 关闭
     */
    async function callVolcenginePodcast(
        credentials: VolcengineTTSCredentials,
        params: TTSVolcengineDirectParams,
    ): Promise<Uint8Array> {
        const { text, voice } = params
        const speakerIds = voice.includes(',')
            ? voice.split(',').map((s) => s.trim())
            : ['zh_male_dayixiansheng_v2_saturn_bigtts', 'zh_female_mizaitongxue_v2_saturn_bigtts']

        // 构建 WebSocket URL（JWT via Query）
        const queryStr = new URLSearchParams(credentials.authQuery).toString()
        const wsUrl = `${credentials.endpoint}?${queryStr}`
        const sessionId = crypto.randomUUID()

        return new Promise<Uint8Array>((resolve, reject) => {
            const ws = new WebSocket(wsUrl)
            const audioChunks: Uint8Array[] = []
            let settled = false

            const cleanup = () => {
                settled = true
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close()
                }
            }

            ws.binaryType = 'arraybuffer'

            ws.onopen = () => {
                const frame = buildPodcastStartFrame(sessionId, text, speakerIds)
                ws.send(frame)
                progress.value = 15
            }

            ws.onmessage = (event) => {
                if (settled) {
                    return
                }
                try {
                    const parsed = parseVolcengineFrame(event.data as ArrayBuffer)
                    if (!parsed) {
                        return
                    }

                    // event=361: 音频数据
                    if (parsed.event === 361) {
                        if (parsed.payload.byteLength > 0) {
                            audioChunks.push(new Uint8Array(parsed.payload))
                            progress.value = Math.min(70, 15 + audioChunks.length * 2)
                        }
                        return
                    }

                    // event=100: 服务端确认（忽略）
                    // event=102: 任务完成
                    if (parsed.event === 102 && !settled) {
                        progress.value = 70
                        cleanup()
                        const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                        const merged = new Uint8Array(total)
                        let offset = 0
                        for (const c of audioChunks) {
                            merged.set(c, offset)
                            offset += c.length
                        }
                        resolve(merged)
                    }
                } catch (err) {
                    cleanup()
                    reject(err instanceof Error ? err : new Error(String(err)))
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
