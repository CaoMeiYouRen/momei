import { ref, onUnmounted, computed } from 'vue'
import type { ASRProvider, ASRMode, ASRCredentials, CompressionLevel } from '~/types/asr'

export interface ASRDirectOptions {
    provider: ASRProvider
    mode: ASRMode
    language?: string
    compressionLevel?: CompressionLevel
}

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
    let audioContext: AudioContext | null = null

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

        return response.data
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

        try {
            // 1. 获取临时凭证
            credentials = await fetchCredentials()

            // 2. 检查凭证有效期
            if (Date.now() > credentials.expiresAt) {
                throw new Error('Credentials expired')
            }

            // 3. 根据模式建立连接
            if (options.mode === 'stream' && options.provider === 'volcengine') {
                await connectVolcengineWebSocket(credentials)
            }

            isConnected.value = true
            isConnecting.value = false
        } catch (err: any) {
            error.value = err.message || 'connection_failed'
            isConnecting.value = false
            throw err
        }
    }

    /**
     * 建立火山引擎 WebSocket 直连 (流式模式)
     */
    const connectVolcengineWebSocket = async (creds: ASRCredentials): Promise<void> => new Promise((resolve, reject) => {
        // 构建 WebSocket URL (带签名参数)
        const url = new URL(creds.endpoint)
        if (creds.authHeaders) {
            Object.entries(creds.authHeaders).forEach(([key, value]) => {
                url.searchParams.set(key, value)
            })
        }

        ws = new WebSocket(url.toString())

        ws.onopen = () => {
            // 发送初始化请求
            const initPayload = {
                type: 'start',
                language: options.language || 'zh-CN',
                mimeType: 'audio/pcm',
                sampleRate: 16000,
            }
            ws?.send(JSON.stringify(initPayload))
            resolve()
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                if (msg.type === 'transcript' || msg.result) {
                    if (msg.isFinal) {
                        finalTranscript.value += msg.text || msg.result?.text || ''
                        interimTranscript.value = ''
                    } else {
                        interimTranscript.value = msg.text || msg.result?.text || ''
                    }
                } else if (msg.type === 'error' || msg.error) {
                    error.value = msg.message || msg.error || 'transcription_error'
                }
            } catch {
                // 忽略解析错误
            }
        }

        ws.onerror = () => {
            error.value = 'websocket_error'
            reject(new Error('WebSocket connection error'))
        }

        ws.onclose = () => {
            isConnected.value = false
        }
    })

    /**
     * 发送音频数据 (流式模式)
     */
    const sendAudio = (pcmData: Float32Array) => {
        if (ws?.readyState !== WebSocket.OPEN) {
            return
        }

        // Base64 编码 PCM 数据
        const base64 = encodePcmToBase64(pcmData)
        ws.send(JSON.stringify({
            type: 'audio',
            payload: base64,
        }))
    }

    /**
     * 批量转录 (直连 SiliconFlow)
     */
    const transcribeBatch = async (audioBlob: Blob): Promise<string> => {
        if (!credentials) {
            credentials = await fetchCredentials()
        }

        // 检查凭证有效期
        if (Date.now() > credentials.expiresAt) {
            credentials = await fetchCredentials()
        }

        isProcessing.value = true
        error.value = null

        try {
            const formData = new FormData()
            formData.append('file', audioBlob, 'recording.webm')
            formData.append('model', credentials.model || 'FunAudioLLM/SenseVoiceSmall')

            if (options.language) {
                const lang = options.language.split('-')[0]?.toLowerCase() || 'zh'
                formData.append('language', lang)
            }

            const response = await $fetch<{
                text: string
                duration?: number
            }>(`${credentials.endpoint}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${credentials.apiKey}`,
                },
                body: formData,
            })

            finalTranscript.value = response.text
            return response.text
        } catch (err: any) {
            error.value = err.data?.error?.message || 'transcription_failed'
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * 停止识别
     */
    const stop = () => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'stop' }))
            setTimeout(() => {
                ws?.close()
                ws = null
            }, 500)
        }

        isConnected.value = false
        isConnecting.value = false
    }

    /**
     * 断开连接
     */
    const disconnect = () => {
        stop()
        credentials = null
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
        if (audioContext) {
            void audioContext.close()
            audioContext = null
        }
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

/**
 * PCM Float32 转 Base64
 */
function encodePcmToBase64(float32Samples: Float32Array): string {
    const pcmBuffer = new ArrayBuffer(float32Samples.length * 2)
    const pcmView = new DataView(pcmBuffer)

    for (let i = 0; i < float32Samples.length; i++) {
        const sample = float32Samples[i] ?? 0
        const clamped = Math.max(-1, Math.min(1, sample))
        const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
        pcmView.setInt16(i * 2, int16, true)
    }

    const pcmBytes = new Uint8Array(pcmBuffer)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < pcmBytes.length; i += chunkSize) {
        binary += String.fromCharCode(...pcmBytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
}
