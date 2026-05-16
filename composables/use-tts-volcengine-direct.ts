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
 *   5. PUT /api/posts/[id]/tts-metadata → 回写元数据
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
import {
    VOLCENGINE_COMPRESSION,
    buildPodcastFinishFrame,
    buildPodcastStartFrame,
    buildSpeechFinishConnectionFrame,
    buildSpeechFinishSessionFrame,
    buildSpeechStartConnectionFrame,
    buildSpeechStartSessionFrame,
    buildSpeechTaskRequestFrame,
    decodeVolcengineSerializedPayload,
    parseVolcengineErrorFrame,
    parseVolcengineEventFrame,
    toVolcengineArrayBuffer,
} from '@/utils/shared/volcengine-protocol'
import {
    normalizeVolcengineSpeaker,
    resolveVolcengineBodyModel,
    resolveVolcengineSpeechResourceId,
} from '@/utils/shared/volcengine-tts-profile'
import type {
    TTSVolcengineDirectParams,
    TTSVolcengineDirectResult,
    TTSDirectProviderUsage,
    TTSVolcengineGeneratedAudio,
    VolcengineTTSCredentials,
} from '@/types/tts-direct'

const DEFAULT_DIRECT_TTS_UPLOAD_PREFIX = 'audio/tts/'

// ---- 常量 ----

function normalizeVolcengineProviderUsage(rawUsage: unknown): TTSDirectProviderUsage | null {
    if (!rawUsage || typeof rawUsage !== 'object' || Array.isArray(rawUsage)) {
        return null
    }

    const usageRecord = rawUsage as Record<string, unknown>
    const totalTokens = Number(usageRecord.totalTokens ?? usageRecord.tokens_total ?? usageRecord.tokens)

    if (!Number.isFinite(totalTokens) || totalTokens <= 0) {
        return null
    }

    return {
        totalTokens,
    }
}

// ---- Composable ----

// eslint-disable-next-line max-lines-per-function
export function useTTSVolcengineDirect() {
    const { t } = useI18n()
    const toast = useToast()

    const progress = ref(0) // 0-100
    const error = ref<string | null>(null)
    const isGenerating = ref(false)
    const uploadPrefix = ref(DEFAULT_DIRECT_TTS_UPLOAD_PREFIX)

    const { uploadFile } = useUpload({
        type: UploadType.AUDIO,
        prefix: uploadPrefix,
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

    function resolveUploadTargetPrefix(postId?: string | null) {
        const normalizedPostId = postId?.trim()
        if (!normalizedPostId) {
            return DEFAULT_DIRECT_TTS_UPLOAD_PREFIX
        }

        return `posts/${normalizedPostId}/audio/tts/`
    }

    /**
     * 火山 TTS 双向流式 WebSocket (speech 模式)
     *
     * 对齐 server/utils/ai/tts-volcengine-websocket.ts 的 generateVolcengineWebSocketSpeech。
     * JWT 鉴权通过 URL Query 参数传递（浏览器 WebSocket 不支持自定义 Header）。
     *
     * 协议流程:
     *   ws.onopen → StartConnection(1)
     *   ← ConnectionStarted(50) → StartSession(100)
     *   ← SessionStarted(150) → TaskRequest(200) + FinishSession(102)
     *   ← Audio(352) → 收集音频数据
     *   ← SessionFinished(152/153) → FinishConnection(2) → resolve
     */
    async function callVolcengineTTS(
        credentials: VolcengineTTSCredentials,
        params: TTSVolcengineDirectParams,
    ): Promise<TTSVolcengineGeneratedAudio> {
        const { text } = params
        const speaker = normalizeVolcengineSpeaker(params.voice)

        // JWT via URL Query（浏览器 WebSocket 不支持自定义 header）
        const authQuery = {
            ...credentials.authQuery,
            // 仅对合成资源做版本对齐，不改变 JWT 鉴权方式本身。
            api_resource_id: resolveVolcengineSpeechResourceId(speaker),
        }
        const queryStr = new URLSearchParams(authQuery).toString()
        const wsUrl = `${credentials.endpoint}?${queryStr}`
        const sessionId = crypto.randomUUID()

        return new Promise<TTSVolcengineGeneratedAudio>((resolve, reject) => {
            const ws = new WebSocket(wsUrl)
            ws.binaryType = 'arraybuffer'

            const audioChunks: Uint8Array[] = []
            let providerUsage: TTSDirectProviderUsage | null = null
            let settled = false
            let connectionStarted = false
            let sessionStarted = false

            const cleanup = () => {
                settled = true
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close()
                }
            }

            const sendFrame = (frame: Uint8Array) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(toVolcengineArrayBuffer(frame))
                }
            }

            ws.onopen = () => {
                sendFrame(buildSpeechStartConnectionFrame())
                progress.value = 10
            }

            ws.onmessage = (ev) => {
                if (settled) {
                    return
                }
                const data = new Uint8Array(ev.data as ArrayBuffer)

                // 先检查错误帧
                const errorPkt = parseVolcengineErrorFrame(data)
                if (errorPkt) {
                    cleanup()
                    reject(new Error(`Volcengine TTS Error(${errorPkt.code}): ${errorPkt.message}`))
                    return
                }

                const pkt = parseVolcengineEventFrame(data)
                if (!pkt) {
                    return // 非事件帧（如 Connection 帧）由下层处理
                }

                // event=150: SessionStarted → 发送 TaskRequest + FinishSession
                if (pkt.event === 150) {
                    if (!sessionStarted) {
                        sessionStarted = true
                        sendFrame(buildSpeechTaskRequestFrame(sessionId, text))
                        sendFrame(buildSpeechFinishSessionFrame(sessionId))
                        progress.value = 20
                    }
                    return
                }

                // event=50: ConnectionStarted → 发送 StartSession
                if (pkt.event === 50) {
                    if (!connectionStarted) {
                        connectionStarted = true
                        sendFrame(buildSpeechStartSessionFrame({
                            sessionId,
                            userId: credentials.temporaryUserId,
                            speaker,
                            model: resolveVolcengineBodyModel(speaker),
                            speed: params.speed,
                            volume: params.volume,
                            language: params.language,
                        }))
                        progress.value = 15
                    }
                    return
                }

                // event=350/351: 进度通知
                if (pkt.event === 350 || pkt.event === 351) {
                    return
                }

                // event=352: 音频数据
                if (pkt.event === 352) {
                    const rawPayload = pkt.rawPayload
                    if (rawPayload && rawPayload.length > 0) {
                        audioChunks.push(rawPayload)
                        progress.value = Math.min(70, 20 + Math.round((audioChunks.length / 20) * 50))
                        return
                    }

                    // rawPayload 为空时尝试解析 base64 编码的 payload
                    const decoded = pkt.compression === VOLCENGINE_COMPRESSION.none
                        ? decodeVolcengineSerializedPayload(rawPayload, pkt.serialization)
                        : rawPayload
                    if (decoded && typeof decoded === 'object') {
                        const obj = decoded as Record<string, unknown>
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
                                    progress.value = Math.min(70, 20 + Math.round((audioChunks.length / 20) * 50))
                                }
                            } catch {
                                // ignore invalid base64 payload fragments from provider fallback frames
                            }
                        }
                    }
                    return
                }

                // event=154: 用量信息
                if (pkt.event === 154 && pkt.rawPayload) {
                    const decoded = pkt.compression === VOLCENGINE_COMPRESSION.none
                        ? decodeVolcengineSerializedPayload(pkt.rawPayload, pkt.serialization)
                        : null
                    if (decoded && typeof decoded === 'object') {
                        providerUsage = normalizeVolcengineProviderUsage((decoded as Record<string, unknown>).usage ?? decoded)
                    }
                    return
                }

                // event=152/153: SessionFinished → 发送 FinishConnection → resolve
                if (pkt.event === 152 || pkt.event === 153) {
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(toVolcengineArrayBuffer(buildSpeechFinishConnectionFrame()))
                        }
                    } catch {
                        // ignore close-race when the socket is already shutting down
                    }
                    cleanup()
                    progress.value = 70

                    const total = audioChunks.reduce((s, c) => s + c.length, 0)
                    const merged = new Uint8Array(total)
                    let offset = 0
                    for (const c of audioChunks) {
                        merged.set(c, offset)
                        offset += c.length
                    }
                    resolve({
                        audioBytes: merged,
                        providerUsage,
                    })
                }
            }

            ws.onerror = () => {
                if (!settled) {
                    cleanup()
                    reject(new Error('Volcengine TTS WebSocket connection error'))
                }
            }

            ws.onclose = () => {
                if (!settled) {
                    cleanup()
                    if (audioChunks.length > 0) {
                        const total = audioChunks.reduce((s, c) => s + c.length, 0)
                        const merged = new Uint8Array(total)
                        let offset = 0
                        for (const c of audioChunks) {
                            merged.set(c, offset)
                            offset += c.length
                        }
                        resolve({
                            audioBytes: merged,
                            providerUsage,
                        })
                    } else {
                        reject(new Error('Volcengine TTS WebSocket closed without audio'))
                    }
                }
            }
        })
    }

    /**
     * 火山播客 WebSocket 直连（对齐 server/utils/ai/tts-volcengine.ts generatePodcastSpeech）
     */
    async function callVolcenginePodcast(
        credentials: VolcengineTTSCredentials,
        params: TTSVolcengineDirectParams,
    ): Promise<TTSVolcengineGeneratedAudio> {
        const { text, voice } = params
        const speakerIds = voice.includes(',')
            ? voice.split(',').map((s) => s.trim())
            : ['zh_male_dayixiansheng_v2_saturn_bigtts', 'zh_female_mizaitongxue_v2_saturn_bigtts']

        // JWT via URL Query（浏览器 WebSocket 不支持自定义 header）
        const queryStr = new URLSearchParams(credentials.authQuery).toString()
        const wsUrl = `${credentials.endpoint}?${queryStr}`
        const sessionId = crypto.randomUUID()

        return new Promise<TTSVolcengineGeneratedAudio>((resolve, reject) => {
            const ws = new WebSocket(wsUrl)
            ws.binaryType = 'arraybuffer'

            const audioChunks: Uint8Array[] = []
            let providerUsage: TTSDirectProviderUsage | null = null
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
                ws.send(toVolcengineArrayBuffer(startFrame))
                progress.value = 15
                console.info('[TTS Podcast] WS connected, session:', sessionId)
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

                const pkt = parseVolcengineEventFrame(data)
                if (!pkt) {
                    console.warn('[TTS Podcast] Unparsed frame, len:', data.byteLength)
                    return
                }

                const payloadDecoded = pkt.compression === VOLCENGINE_COMPRESSION.none
                    ? decodeVolcengineSerializedPayload(pkt.rawPayload, pkt.serialization)
                    : pkt.rawPayload

                console.info('[TTS Podcast] Event:', pkt.event, 'payloadLen:', pkt.rawPayload.length)

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
                    if (payloadDecoded && typeof payloadDecoded === 'object') {
                        const obj = payloadDecoded as Record<string, unknown>
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
                            } catch {
                                // ignore invalid base64 payload fragments from provider fallback frames
                            }
                        }
                    }
                    return
                }

                // event=362: 轮次结束，检查错误
                if (pkt.event === 362 && payloadDecoded && typeof payloadDecoded === 'object') {
                    const obj = payloadDecoded as Record<string, unknown>
                    if (obj.is_error === true) {
                        cleanup()
                        reject(new Error(typeof obj.error_msg === 'string' ? obj.error_msg : 'Volcengine Podcast round error'))
                    }
                    return
                }

                // event=154: 用量信息
                if (pkt.event === 154) {
                    if (payloadDecoded && typeof payloadDecoded === 'object') {
                        const usagePayload = payloadDecoded as Record<string, unknown>
                        providerUsage = normalizeVolcengineProviderUsage(usagePayload.usage ?? usagePayload)
                    }
                    return
                }

                // event=363: 播客结束（可能带 audio_url）— 主动触发结束
                if (pkt.event === 363 && !settled) {
                    // 发 FinishConnection 通知服务端结束
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            const finishFrame = buildPodcastFinishFrame()
                            ws.send(toVolcengineArrayBuffer(finishFrame))
                        }
                    } catch {
                        // ignore finish-frame send race during teardown
                    }
                    // 设置超时兜底：5 秒后若仍未 resolve，用已有音频关闭
                    setTimeout(() => {
                        if (!settled) {
                            console.info('[TTS Podcast] Timeout after PodcastEnd, resolving with', audioChunks.length, 'chunks')
                            cleanup()
                            progress.value = 70
                            const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                            const merged = new Uint8Array(total)
                            let offset = 0
                            for (const c of audioChunks) {
                                merged.set(c, offset)
                                offset += c.length
                            }
                            resolve({
                                audioBytes: merged,
                                providerUsage,
                            })
                        }
                    }, 5000)
                    return
                }

                // event=152: 会话结束 → 发 FinishConnection → 关闭
                if (pkt.event === 152) {
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            const finishFrame = buildPodcastFinishFrame()
                            ws.send(toVolcengineArrayBuffer(finishFrame))
                        }
                    } catch {
                        // ignore finish-frame send race during teardown
                    }
                    cleanup()
                    progress.value = 70
                    console.info('[TTS Podcast] Resolving with', audioChunks.length, 'audio chunks,', totalBytes, 'bytes')
                    const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                    const merged = new Uint8Array(total)
                    let offset = 0
                    for (const c of audioChunks) {
                        merged.set(c, offset)
                        offset += c.length
                    }
                    resolve({
                        audioBytes: merged,
                        providerUsage,
                    })
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
                    console.info('[TTS Podcast] WS closed, chunks:', audioChunks.length, 'bytes:', totalBytes)
                    cleanup()
                    if (audioChunks.length > 0) {
                        const total = audioChunks.reduce((s, c) => s + c.byteLength, 0)
                        const merged = new Uint8Array(total)
                        let offset = 0
                        for (const c of audioChunks) {
                            merged.set(c, offset)
                            offset += c.length
                        }
                        resolve({
                            audioBytes: merged,
                            providerUsage,
                        })
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
        const resolveDirectTtsErrorMessage = (caughtError: unknown) => {
            if (caughtError instanceof Error && caughtError.message) {
                return caughtError.message
            }

            if (typeof caughtError === 'object' && caughtError !== null) {
                const directTtsError = caughtError as {
                    data?: {
                        statusMessage?: unknown
                    }
                    message?: unknown
                }

                if (typeof directTtsError.data?.statusMessage === 'string' && directTtsError.data.statusMessage) {
                    return directTtsError.data.statusMessage
                }

                if (typeof directTtsError.message === 'string' && directTtsError.message) {
                    return directTtsError.message
                }
            }

            return t('common.error')
        }

        let hasUploadedAudio = false

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
            const generationResult = params.mode === 'podcast'
                ? await callVolcenginePodcast(credentials, params)
                : await callVolcengineTTS(credentials, params)

            const audioBytes = generationResult.audioBytes

            if (audioBytes.length === 0) {
                throw new Error('No audio data received from Volcengine TTS API')
            }

            // 4. 上传 OSS
            progress.value = 75
            uploadPrefix.value = resolveUploadTargetPrefix(params.postId)
            const audioBlob = new Blob([audioBytes] as BlobPart[], { type: 'audio/mpeg' })
            const fileName = `tts-volc-${Date.now()}.mp3`
            const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' })

            const audioUrl = await uploadFile(audioFile)
            hasUploadedAudio = true
            progress.value = 95

            // 5. 回写元数据
            const duration = Math.round(audioBytes.length / 16000) // 128kbps MP3 估算
            const model = resolveVolcengineBodyModel(params.voice)
            if (params.postId) {
                await $fetch(`/api/posts/${params.postId}/tts-metadata`, {
                    method: 'PUT',
                    body: {
                        ...(params.taskId
                            ? {
                                taskId: params.taskId,
                                status: 'completed',
                            }
                            : {
                                textLength: params.text.length,
                                text: params.text,
                            }),
                        audioUrl,
                        provider: 'volcengine',
                        voice: params.voice,
                        mode: params.mode,
                        duration,
                        audioSize: audioBytes.length,
                        mimeType: audioFile.type,
                        language: params.language,
                        speed: params.speed,
                        model,
                        providerUsage: generationResult.providerUsage ?? undefined,
                    },
                })
            }

            progress.value = 100
            isGenerating.value = false

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.posts.tts.completed'),
                life: 3000,
            })

            return { audioUrl, duration }
        } catch (caughtError: unknown) {
            const message = resolveDirectTtsErrorMessage(caughtError)
            error.value = message
            isGenerating.value = false

            if (params.postId && params.taskId && !hasUploadedAudio) {
                try {
                    await $fetch(`/api/posts/${params.postId}/tts-metadata`, {
                        method: 'PUT',
                        body: {
                            taskId: params.taskId,
                            status: 'failed',
                            provider: 'volcengine',
                            voice: params.voice,
                            mode: params.mode,
                            language: params.language,
                            speed: params.speed,
                            model: resolveVolcengineBodyModel(params.voice),
                            error: message,
                        },
                    })
                } catch (taskSettleError: unknown) {
                    console.warn('[useTTSVolcengineDirect] Direct task failure settlement failed:', taskSettleError)
                }
            } else if (params.postId && params.taskId && hasUploadedAudio) {
                console.warn('[useTTSVolcengineDirect] Skipping failed settlement after audio upload to avoid downgrading a direct task that may already be completed.')
            }

            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: message,
                life: 5000,
            })

            throw caughtError
        } finally {
            uploadPrefix.value = DEFAULT_DIRECT_TTS_UPLOAD_PREFIX
        }
    }

    return {
        progress,
        error,
        isGenerating,
        generateAndUpload,
    }
}
