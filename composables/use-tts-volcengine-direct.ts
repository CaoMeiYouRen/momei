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
import { useUpload, UploadType } from './use-upload'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

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

/** 语音模式 */
const SPEECH_BODY_MODEL = 'seed-tts-2.0-expressive'

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

    const progress = ref(0)           // 0-100
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
        const response = await $fetch<{ code: number; data: VolcengineTTSCredentials }>(
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
            const audioBytes = await callVolcengineTTS(credentials, params)

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
