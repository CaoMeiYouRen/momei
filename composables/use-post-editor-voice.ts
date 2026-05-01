import { ref, onUnmounted, computed, watch, type Ref } from 'vue'
import { useASRDirect } from './use-asr-direct'

export type VoiceTranscriptionMode = 'web-speech' | 'cloud-batch' | 'cloud-stream'

export interface UsePostEditorVoiceOptions {
    /** 是否启用直连模式 (默认 false，优先使用后端桥接) */
    directMode?: boolean
}

interface LegacyAudioProcessEvent {
    inputBuffer: {
        getChannelData: (channel: number) => Float32Array
    }
}

interface LegacyScriptProcessorNode {
    connect: (destinationNode: AudioNode) => void
    disconnect: () => void
    onaudioprocess: ((event: LegacyAudioProcessEvent) => void) | null
}

interface LegacyScriptProcessorFactory {
    createScriptProcessor?: (bufferSize: number, numberOfInputChannels: number, numberOfOutputChannels: number) => LegacyScriptProcessorNode
}

interface CloudVoiceConfigResponse {
    enabled: boolean
    siliconflow: boolean
    volcengine: boolean
}

interface SpeechRecognitionAlternativeLike {
    transcript: string
}

interface SpeechRecognitionResultLike {
    '0': SpeechRecognitionAlternativeLike
    isFinal: boolean
}
interface SpeechRecognitionEventLike { results: ArrayLike<SpeechRecognitionResultLike> | Iterable<SpeechRecognitionResultLike> }
interface SpeechRecognitionErrorEventLike { error: string }

interface SpeechRecognitionLike {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
    onend: (() => void) | null
    start: () => void
    stop: () => void
}

interface WindowWithSpeechRecognition extends Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
}
interface ErrorWithDataMessage {
    name?: string
    data?: {
        message?: string
    }
    message?: string
}

const defaultCloudVoiceConfig: CloudVoiceConfigResponse = {
    enabled: false,
    siliconflow: false,
    volcengine: false,
}

function normalizeCloudVoiceConfig(config: Partial<CloudVoiceConfigResponse> | null | undefined): CloudVoiceConfigResponse {
    return {
        enabled: Boolean(config?.enabled),
        siliconflow: Boolean(config?.siliconflow),
        volcengine: Boolean(config?.volcengine),
    }
}

function getSpeechRecognitionConstructor(targetWindow: Window): (new () => SpeechRecognitionLike) | null {
    const speechWindow = targetWindow as WindowWithSpeechRecognition
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (typeof error !== 'object' || !error) {
        return fallbackMessage
    }

    const typedError = error as ErrorWithDataMessage
    return typedError.data?.message ?? typedError.message ?? fallbackMessage
}

function getErrorName(error: unknown): string | null {
    if (typeof error !== 'object' || !error) {
        return null
    }

    const typedError = error as Pick<ErrorWithDataMessage, 'name'>
    return typeof typedError.name === 'string' ? typedError.name : null
}

function getLegacyScriptProcessor(ctx: AudioContext): LegacyScriptProcessorNode | null {
    const legacyFactory = ctx as unknown as LegacyScriptProcessorFactory
    if (!legacyFactory.createScriptProcessor) {
        return null
    }

    return legacyFactory.createScriptProcessor(4096, 1, 1)
}

async function setupVoiceAudioPipeline(context: {
    audioContext: AudioContext | null
    sourceNode: MediaStreamAudioSourceNode | null
    muteGainNode: GainNode | null
    asrDirectStream: ReturnType<typeof useASRDirect> | null
    getWs: () => WebSocket | null
    getStreamStarted: () => boolean
    setWorkletNode: (value: AudioWorkletNode | null) => void
    setProcessorNode: (value: LegacyScriptProcessorNode | null) => void
    getLegacyScriptProcessor: (ctx: AudioContext) => LegacyScriptProcessorNode | null
    encodePcmToBase64: (float32Samples: Float32Array) => string
}) {
    if (!context.audioContext || !context.sourceNode || !context.muteGainNode) {
        return
    }

    const canUseAudioWorklet = Boolean(
        context.audioContext.audioWorklet
        && typeof AudioWorkletNode !== 'undefined',
    )

    if (canUseAudioWorklet) {
        await context.audioContext.audioWorklet.addModule('/worklets/pcm-capture-processor.js')
        const workletNode = new AudioWorkletNode(context.audioContext, 'pcm-capture-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
        })

        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            const data = event.data
            if (context.asrDirectStream?.isConnected.value) {
                context.asrDirectStream.sendAudio(data)
            } else if (context.getWs()?.readyState === WebSocket.OPEN && context.getStreamStarted()) {
                const payload = context.encodePcmToBase64(data)
                context.getWs()?.send(JSON.stringify({ type: 'audio', payload }))
            }
        }

        context.setWorkletNode(workletNode)
        context.sourceNode.connect(workletNode)
        workletNode.connect(context.muteGainNode)
        context.muteGainNode.connect(context.audioContext.destination)
        return
    }

    const legacyNode = context.getLegacyScriptProcessor(context.audioContext)
    if (!legacyNode) {
        throw new Error('audio_processor_not_supported')
    }

    legacyNode.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        if (context.asrDirectStream?.isConnected.value) {
            context.asrDirectStream.sendAudio(input)
        } else if (context.getWs()?.readyState === WebSocket.OPEN && context.getStreamStarted()) {
            const payload = context.encodePcmToBase64(input)
            context.getWs()?.send(JSON.stringify({ type: 'audio', payload }))
        }
    }

    context.setProcessorNode(legacyNode)
    context.sourceNode.connect(legacyNode as unknown as AudioNode)
    legacyNode.connect(context.muteGainNode)
    context.muteGainNode.connect(context.audioContext.destination)
}

async function startProxyVoiceStream(context: {
    mode: Ref<VoiceTranscriptionMode>
    isListening: Ref<boolean>
    onFinalTranscript: (value: string) => void
    onInterimTranscript: (value: string) => void
    clearStartRetry: () => void
    sendStartMessage: () => void
    abortCloudStreamSession: (messageKey: string) => void
    clearCloudAudioPipeline: () => Promise<void>
    stopMediaInput: () => void
    setupAudioPipeline: () => Promise<void>
    setWs: (value: WebSocket | null) => void
    getWs: () => WebSocket | null
    setStreamStarted: (value: boolean) => void
    getStreamStarted: () => boolean
    setStartRetryTimer: (value: ReturnType<typeof setInterval> | null) => void
    getStartRetryTimer: () => ReturnType<typeof setInterval> | null
    setStartRetryCount: (value: number) => void
    getStartRetryCount: () => number
}) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const nextWs = new WebSocket(`${protocol}//${host}/api/ai/asr/stream`)
    context.setWs(nextWs)

    nextWs.onopen = () => {
        context.setStreamStarted(false)
        context.clearStartRetry()
        context.sendStartMessage()
        context.setStartRetryTimer(setInterval(() => {
            if (context.getStreamStarted() || context.getWs()?.readyState !== WebSocket.OPEN) {
                context.clearStartRetry()
                return
            }

            const nextCount = context.getStartRetryCount() + 1
            context.setStartRetryCount(nextCount)
            if (nextCount > 20) {
                context.abortCloudStreamSession('cloud_stream_start_timeout')
                return
            }

            context.sendStartMessage()
        }, 300))
    }

    nextWs.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'transcript') {
            if (msg.isFinal) {
                context.onFinalTranscript(msg.text)
                context.onInterimTranscript('')
            } else {
                context.onInterimTranscript(msg.text)
            }
        } else if (msg.type === 'started') {
            context.setStreamStarted(true)
            context.clearStartRetry()
            context.isListening.value = true
        } else if (msg.type === 'error') {
            context.abortCloudStreamSession(msg.message || 'cloud_transcription_failed')
        }
    }

    nextWs.onerror = () => {
        context.abortCloudStreamSession('cloud_transcription_failed')
    }

    nextWs.onclose = () => {
        context.setStreamStarted(false)
        context.clearStartRetry()
        if (context.mode.value === 'cloud-stream') {
            context.isListening.value = false
        }

        void context.clearCloudAudioPipeline()
        context.stopMediaInput()
        context.setWs(null)
    }

    await context.setupAudioPipeline()
}

async function transcribeVoiceBatch(context: {
    asrDirectBatch: ReturnType<typeof useASRDirect> | null
    currentLang: string
    isLoadingModel: Ref<boolean>
    error: Ref<string>
    committedTranscript: Ref<string>
    currentSessionFinal: Ref<string>
}, blob: Blob) {
    context.isLoadingModel.value = true
    try {
        let text = ''
        let shouldUseProxy = !context.asrDirectBatch

        if (context.asrDirectBatch) {
            try {
                text = await context.asrDirectBatch.transcribeBatch(blob)
            } catch (err) {
                console.warn('Direct batch transcription failed, fallback to proxy mode', err)
                shouldUseProxy = true
                text = ''
            }
        }

        if (shouldUseProxy) {
            const formData = new FormData()
            formData.append('audioFile', blob, 'recording.webm')
            formData.append('language', context.currentLang)

            const result = await $fetch<{ text: string }>('/api/ai/asr/transcribe', {
                method: 'POST',
                body: formData,
            })
            text = result.text
        }

        context.currentSessionFinal.value = text
        context.committedTranscript.value += text
        context.currentSessionFinal.value = ''
    } catch (error: unknown) {
        console.error('Cloud batch transcription failed', error)
        context.error.value = getErrorMessage(error, 'cloud_transcription_failed')
    } finally {
        context.isLoadingModel.value = false
    }
}

export function usePostEditorVoice(options: UsePostEditorVoiceOptions = {}) {
    const { directMode = false } = options

    const isListening = ref(false)
    const isSupported = ref(false)
    const hasSpeechRecognitionSupport = ref(false)
    const hasRecordingSupport = ref(false)
    const interimTranscript = ref('')
    const committedTranscript = ref('') // 之前识别完成的内容
    const currentSessionFinal = ref('') // 当前正在进行的会话中已确认的内容
    const error = ref('')

    // 模式切换
    const mode = ref<VoiceTranscriptionMode>('web-speech')

    // 云端功能状态
    const cloudConfig = ref<CloudVoiceConfigResponse>({ ...defaultCloudVoiceConfig })

    // 直连 ASR 实例 (用于云端模式直连)
    const asrDirectBatch = directMode
        ? useASRDirect({
            provider: 'siliconflow',
            mode: 'batch',
        })
        : null

    const asrDirectStream = directMode
        ? useASRDirect({
            provider: 'volcengine',
            mode: 'stream',
        })
        : null

    const isModelReady = computed(() =>
        true, // Web Speech and Cloud modes don't need local model loading
    )

    // 初始化时从 localStorage 读取模式，并检查云端配置
    if (import.meta.client) {
        hasRecordingSupport.value = Boolean(
            navigator.mediaDevices
            && typeof navigator.mediaDevices.getUserMedia === 'function'
            && typeof MediaRecorder !== 'undefined',
        )

        const savedMode = localStorage.getItem('momei_voice_mode') as VoiceTranscriptionMode
        const validModes: VoiceTranscriptionMode[] = ['web-speech', 'cloud-batch', 'cloud-stream']
        if (savedMode && validModes.includes(savedMode)) {
            mode.value = savedMode
        }

        // 异步检查配置
        void $fetch<Partial<CloudVoiceConfigResponse>>('/api/ai/asr/config').then((res) => {
            const nextCloudConfig = normalizeCloudVoiceConfig(res)
            cloudConfig.value = nextCloudConfig
            // 如果云端 ASR 被禁用，或者当前选择的是没配置的云端模式，自动切回 web-speech
            if (!nextCloudConfig.enabled) {
                mode.value = 'web-speech'
            } else if (mode.value === 'cloud-batch' && !nextCloudConfig.siliconflow) {
                mode.value = 'web-speech'
            } else if (mode.value === 'cloud-stream' && !nextCloudConfig.volcengine) {
                mode.value = 'web-speech'
            }
        }).catch((err) => {
            console.warn('[Voice Composable] Failed to fetch voice config:', err)
        })
    }

    watch(mode, (newMode) => {
        if (import.meta.client) {
            localStorage.setItem('momei_voice_mode', newMode)
        }
    })

    const isLoadingModel = ref(false)
    const modelProgress = ref(0)

    // 对外暴露的最终文本：已提交的 + 当前会话已确认的
    const finalTranscript = computed(() => committedTranscript.value + currentSessionFinal.value)

    let recognition: SpeechRecognitionLike | null = null
    let mediaStream: MediaStream | null = null
    let currentLang = 'zh-CN'

    let mediaRecorder: MediaRecorder | null = null
    let audioChunks: Blob[] = []
    let ws: WebSocket | null = null
    let streamStarted = false
    let startRetryTimer: ReturnType<typeof setInterval> | null = null
    let startRetryCount = 0
    let audioContext: AudioContext | null = null
    let sourceNode: MediaStreamAudioSourceNode | null = null
    let workletNode: AudioWorkletNode | null = null
    let processorNode: LegacyScriptProcessorNode | null = null
    let muteGainNode: GainNode | null = null

    const stopMediaInput = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop())
            mediaStream = null
        }
    }

    const clearStartRetry = () => {
        if (startRetryTimer) {
            clearInterval(startRetryTimer)
            startRetryTimer = null
        }
        startRetryCount = 0
    }

    const sendStartMessage = () => {
        if (ws?.readyState !== WebSocket.OPEN) {
            return
        }

        ws.send(JSON.stringify({
            type: 'start',
            language: currentLang,
            mimeType: 'audio/pcm',
            sampleRate: audioContext?.sampleRate || 16000,
        }))
    }

    const clearCloudAudioPipeline = async () => {
        if (workletNode) {
            workletNode.port.onmessage = null
        }

        if (processorNode) {
            processorNode.onaudioprocess = null
        }

        sourceNode?.disconnect()
        workletNode?.disconnect()
        processorNode?.disconnect()
        muteGainNode?.disconnect()

        sourceNode = null
        workletNode = null
        processorNode = null
        muteGainNode = null

        const currentAudioContext = audioContext
        audioContext = null
        if (currentAudioContext) {
            try {
                if (currentAudioContext.state !== 'closed') {
                    await currentAudioContext.close()
                }
            } catch {
                // ignore repeated close race
            }
        }
    }

    const abortCloudStreamSession = (messageKey: string) => {
        error.value = messageKey
        isListening.value = false
        streamStarted = false
        clearStartRetry()

        void clearCloudAudioPipeline()

        if (ws) {
            try {
                ws.close()
            } catch {
                // ignore
            }
            ws = null
        }

        stopMediaInput()
    }

    const encodePcmToBase64 = (float32Samples: Float32Array) => {
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

    // 初始化 Web Speech API
    if (import.meta.client) {
        const SpeechRecognition = getSpeechRecognitionConstructor(window)
        if (SpeechRecognition) {
            hasSpeechRecognitionSupport.value = true
            isSupported.value = true
            const recognitionInstance = new SpeechRecognition()
            recognition = recognitionInstance
            recognitionInstance.continuous = true
            recognitionInstance.interimResults = true

            recognitionInstance.onresult = (event: SpeechRecognitionEventLike) => {
                if (mode.value !== 'web-speech') {
                    return
                }
                let interim = ''
                let sessionFinal = ''
                for (const result of Array.from(event.results)) {
                    if (result.isFinal) {
                        sessionFinal += result[0].transcript
                    } else {
                        interim += result[0].transcript
                    }
                }
                currentSessionFinal.value = sessionFinal
                interimTranscript.value = interim
            }

            recognitionInstance.onerror = (event: SpeechRecognitionErrorEventLike) => {
                if (mode.value !== 'web-speech') {
                    return
                }
                console.error('Speech recognition error', event.error)
                error.value = event.error
                if (event.error === 'not-allowed') {
                    error.value = 'permission_denied'
                }
                isListening.value = false
            }

            recognitionInstance.onend = () => {
                if (mode.value !== 'web-speech') {
                    return
                }
                committedTranscript.value += currentSessionFinal.value
                currentSessionFinal.value = ''
                interimTranscript.value = ''
                isListening.value = false
            }
        }

        if (!isSupported.value && hasRecordingSupport.value) {
            isSupported.value = true
        }
    }

    if (asrDirectStream) {
        watch(() => asrDirectStream.interimTranscript.value, (value) => {
            if (mode.value === 'cloud-stream') {
                interimTranscript.value = value
            }
        })

        watch(() => asrDirectStream.finalTranscript.value, (value) => {
            if (mode.value === 'cloud-stream' && value) {
                currentSessionFinal.value += value
                asrDirectStream.reset()
            }
        })

        watch(() => asrDirectStream.error.value, (value) => {
            if (mode.value === 'cloud-stream' && value) {
                error.value = value
                isListening.value = false
            }
        })
    }

    // 处理音频录制
    const startRecording = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

            if (mode.value === 'cloud-batch') {
                audioChunks = []
                mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' })
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data)
                    }
                }
                mediaRecorder.start()
                isListening.value = true
                return
            }

            if (mode.value === 'cloud-stream') {
                audioContext = new AudioContext({ sampleRate: 16000 })
                if (audioContext.state === 'suspended') {
                    await audioContext.resume()
                }
                sourceNode = audioContext.createMediaStreamSource(mediaStream)
                muteGainNode = audioContext.createGain()
                muteGainNode.gain.value = 0

                // 优先使用直连模式
                if (asrDirectStream) {
                    try {
                        await asrDirectStream.connect()
                        streamStarted = true
                        isListening.value = true

                        // 设置音频处理管道
                        await setupAudioPipeline()
                    } catch (cause: unknown) {
                        console.error('Direct stream connection failed, falling back to proxy', cause)
                        // 回退到代理模式
                        await startProxyStream()
                    }
                } else {
                    await startProxyStream()
                }
            }
        } catch (cause: unknown) {
            console.error('Failed to start recording', cause)
            error.value = getErrorName(cause) === 'NotAllowedError' ? 'permission_denied' : 'failed_to_start'
        }
    }

    const startProxyStream = async () => {
        await startProxyVoiceStream({
            mode,
            isListening,
            onFinalTranscript: (value) => { currentSessionFinal.value += value },
            onInterimTranscript: (value) => { interimTranscript.value = value },
            clearStartRetry,
            sendStartMessage,
            abortCloudStreamSession,
            clearCloudAudioPipeline,
            stopMediaInput,
            setupAudioPipeline,
            setWs: (value) => { ws = value },
            getWs: () => ws,
            setStreamStarted: (value) => { streamStarted = value },
            getStreamStarted: () => streamStarted,
            setStartRetryTimer: (value) => { startRetryTimer = value },
            getStartRetryTimer: () => startRetryTimer,
            setStartRetryCount: (value) => { startRetryCount = value },
            getStartRetryCount: () => startRetryCount,
        })
    }

    const setupAudioPipeline = async () => {
        await setupVoiceAudioPipeline({
            audioContext,
            sourceNode,
            muteGainNode,
            asrDirectStream,
            getWs: () => ws,
            getStreamStarted: () => streamStarted,
            setWorkletNode: (value) => { workletNode = value },
            setProcessorNode: (value) => { processorNode = value },
            getLegacyScriptProcessor,
            encodePcmToBase64,
        })
    }

    const stopRecording = async () => {
        if (mode.value === 'cloud-batch' && mediaRecorder) {
            mediaRecorder.stop()
            isListening.value = false
            // Wait for last chunks
            await new Promise((resolve) => setTimeout(resolve, 100))
            const blob = new Blob(audioChunks, { type: 'audio/webm' })
            await transcribeVoiceBatch({
                asrDirectBatch,
                currentLang,
                isLoadingModel,
                error,
                committedTranscript,
                currentSessionFinal,
            }, blob)
        } else if (mode.value === 'cloud-stream') {
            // 停止直连模式
            if (asrDirectStream?.isConnected.value) {
                asrDirectStream.stop()
            }

            // 停止代理模式
            if (ws?.readyState === WebSocket.OPEN && streamStarted) {
                ws.send(JSON.stringify({ type: 'stop' }))
            }
            streamStarted = false
            clearStartRetry()

            await clearCloudAudioPipeline()
            stopMediaInput()

            // Wait for final response before closing or just close after a short delay
            setTimeout(() => {
                ws?.close()
                ws = null
            }, 500)
            isListening.value = false
        }

        stopMediaInput()
    }

    const startListening = (lang: string = 'zh-CN') => {
        if (isListening.value) {
            return
        }
        error.value = ''
        interimTranscript.value = ''
        currentSessionFinal.value = ''

        let recognitionLang = lang
        if (!lang || lang === 'zh') {
            recognitionLang = 'zh-CN'
        } else if (lang.startsWith('zh-')) {
            recognitionLang = lang
        } else if (lang === 'en') {
            recognitionLang = 'en-US'
        }
        currentLang = recognitionLang

        if (mode.value === 'web-speech') {
            if (!recognition) {
                if (hasRecordingSupport.value && cloudConfig.value.enabled) {
                    mode.value = cloudConfig.value.volcengine ? 'cloud-stream' : 'cloud-batch'
                    void startRecording()
                    return
                }
                error.value = 'not_supported'
                return
            }
            recognition.lang = recognitionLang
            try {
                recognition.start()
                isListening.value = true
            } catch (e) {
                console.error('Failed to start Web Speech recognition', e)
                error.value = 'failed_to_start'
            }
        } else {
            void startRecording()
        }
    }

    const stopListening = () => {
        if (mode.value === 'web-speech') {
            recognition?.stop()
            isListening.value = false
        } else {
            void stopRecording()
        }
    }

    const reset = () => {
        interimTranscript.value = ''
        currentSessionFinal.value = ''
        committedTranscript.value = ''
        error.value = ''
    }

    onUnmounted(() => {
        clearStartRetry()
        if (recognition && isListening.value) {
            recognition.stop()
        }
        if (ws) {
            ws.close()
        }
        void stopRecording()
    })

    return {
        isListening,
        isSupported,
        interimTranscript,
        finalTranscript,
        error,
        mode,
        isLoadingModel,
        modelProgress,
        isModelReady,
        cloudConfig,
        loadModel: () => { /* no-op */ },
        startListening,
        stopListening,
        reset,
    }
}

