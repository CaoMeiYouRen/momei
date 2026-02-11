import { ref, onUnmounted, computed, watch } from 'vue'

export type VoiceTranscriptionMode = 'web-speech' | 'local-standard' | 'local-advanced'

export function usePostEditorVoice() {
    const isListening = ref(false)
    const isSupported = ref(false)
    const interimTranscript = ref('')
    const committedTranscript = ref('') // 之前识别完成的内容
    const currentSessionFinal = ref('') // 当前正在进行的会话中已确认的内容
    const error = ref('')

    // 模式切换
    const mode = ref<VoiceTranscriptionMode>('web-speech')

    // 记录每个模式下的就绪状态
    const readyModels = ref<Record<string, boolean>>({
        'local-standard': false,
        'local-advanced': false,
    })

    const isModelReady = computed(() => {
        if (mode.value === 'web-speech') {
            return true
        }
        return readyModels.value[mode.value] || false
    })

    // 初始化时从 localStorage 读取模式
    if (import.meta.client) {
        const savedMode = localStorage.getItem('momei_voice_mode') as VoiceTranscriptionMode
        if (savedMode && (savedMode === 'web-speech' || savedMode === 'local-standard' || savedMode === 'local-advanced')) {
            mode.value = savedMode
        }
    }

    watch(mode, (newMode) => {
        if (import.meta.client) {
            localStorage.setItem('momei_voice_mode', newMode)
        }
    })

    const isLoadingModel = ref(false)
    const modelProgress = ref(0)
    const isWorkerBusy = ref(false)

    const config = useRuntimeConfig()
    const hfProxy = config.public.hfProxy

    // 对外暴露的最终文本：已提交的 + 当前会话已确认的
    const finalTranscript = computed(() => committedTranscript.value + currentSessionFinal.value)

    let recognition: any = null
    let worker: Worker | null = null
    let audioContext: AudioContext | null = null
    let mediaStream: MediaStream | null = null
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    let processor: ScriptProcessorNode | null = null
    let audioData: Float32Array[] = []
    let transcribeTimer: any = null
    let currentLang = 'zh-CN'

    // 初始化 Web Speech API
    if (import.meta.client) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
            isSupported.value = true
            recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event: any) => {
                if (mode.value !== 'web-speech') {
                    return
                }
                let interim = ''
                let sessionFinal = ''
                for (const result of event.results) {
                    if (result.isFinal) {
                        sessionFinal += result[0].transcript
                    } else {
                        interim += result[0].transcript
                    }
                }
                currentSessionFinal.value = sessionFinal
                interimTranscript.value = interim
            }

            recognition.onerror = (event: any) => {
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

            recognition.onend = () => {
                if (mode.value !== 'web-speech') {
                    return
                }
                committedTranscript.value += currentSessionFinal.value
                currentSessionFinal.value = ''
                interimTranscript.value = ''
                isListening.value = false
            }
        }
    }

    // 初始化 Worker (Local Whisper)
    const initWorker = () => {
        if (typeof Worker === 'undefined') {
            return
        }
        if (worker) {
            return
        }

        worker = new Worker(new URL('../assets/js/workers/transcription.worker.ts', import.meta.url), {
            type: 'module',
        })

        worker.onmessage = (event) => {
            const { type, data, isFinal, model } = event.data
            // console.debug('[Voice Composable] Received worker message:', type, data)
            switch (type) {
                case 'progress':
                    if (data.status === 'progress') {
                        modelProgress.value = data.progress
                    } else if (data.status === 'done' || data.status === 'ready') {
                        modelProgress.value = 100
                    }
                    break
                case 'ready':
                    console.info(`[Voice Composable] Model ${model} is ready`)
                    if (model) {
                        readyModels.value[model === 'onnx-community/whisper-tiny' ? 'local-standard' : 'local-advanced'] = true
                    }
                    if (
                        (mode.value === 'local-standard' && model === 'onnx-community/whisper-tiny')
                        || (mode.value === 'local-advanced' && model === 'Xenova/whisper-base')
                    ) {
                        isLoadingModel.value = false
                        modelProgress.value = 100
                    }
                    break
                case 'result':
                    if (isFinal) {
                        currentSessionFinal.value = data.text
                        interimTranscript.value = ''
                        isListening.value = false
                    } else {
                        interimTranscript.value = data.text
                    }
                    isWorkerBusy.value = false
                    break
                case 'error':
                    error.value = data
                    isLoadingModel.value = false
                    isListening.value = false
                    isWorkerBusy.value = false
                    break
            }
        }
    }

    const loadModel = () => {
        if (!worker) {
            void initWorker()
        }
        if (isModelReady.value) {
            isLoadingModel.value = false
            return
        }
        if (isLoadingModel.value) {
            return
        }

        isLoadingModel.value = true
        modelProgress.value = 0
        const modelName = mode.value === 'local-standard' ? 'onnx-community/whisper-tiny' : 'Xenova/whisper-base'
        console.info(`[Voice Composable] Posting load message to worker for ${modelName} with proxy:`, hfProxy)
        worker?.postMessage({ type: 'load', hfProxy, model: modelName })
    }

    const sendCurrentBuffer = (isFinal: boolean = false) => {
        if (!worker || !isModelReady.value || audioData.length === 0) {
            return
        }
        if (isWorkerBusy.value && !isFinal) {
            return
        }

        isWorkerBusy.value = true

        // 合并数据并发送给 Worker
        const length = audioData.reduce((acc, curr) => acc + curr.length, 0)
        const merged = new Float32Array(length)
        let offset = 0
        for (const chunk of audioData) {
            merged.set(chunk, offset)
            offset += chunk.length
        }

        worker?.postMessage({
            type: 'transcribe',
            audio: merged,
            language: currentLang.split('-')[0] || 'zh',
            model: mode.value === 'local-standard' ? 'onnx-community/whisper-tiny' : 'Xenova/whisper-base',
            isFinal,
        })
    }

    // 处理音频录制 (用于 Local Whisper)
    const startRecording = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioContext = new AudioContext({ sampleRate: 16000 })
            const source = audioContext.createMediaStreamSource(mediaStream)
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            processor = audioContext.createScriptProcessor(4096, 1, 1)

            audioData = []
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            processor.onaudioprocess = (e) => {
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                const inputData = e.inputBuffer.getChannelData(0)
                audioData.push(new Float32Array(inputData))
            }

            source.connect(processor)
            processor.connect(audioContext.destination)
            isListening.value = true

            // 定时进行增量识别（实时显示）
            transcribeTimer = setInterval(() => {
                if (isListening.value && !isWorkerBusy.value) {
                    sendCurrentBuffer(false)
                }
            }, 3000)
        } catch (err: any) {
            console.error('Failed to start recording', err)
            error.value = err.name === 'NotAllowedError' ? 'permission_denied' : 'failed_to_start'
        }
    }

    const stopRecording = () => {
        if (transcribeTimer) {
            clearInterval(transcribeTimer)
            transcribeTimer = null
        }
        if (processor) {
            processor.disconnect()
            processor = null
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop())
            mediaStream = null
        }
        if (audioContext) {
            void audioContext.close()
            audioContext = null
        }

        // 发送最终完整数据包
        sendCurrentBuffer(true)
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
                error.value = 'not_supported'
                return
            }
            recognition.lang = recognitionLang
            try {
                void recognition.start()
                isListening.value = true
            } catch (e) {
                console.error('Failed to start Web Speech recognition', e)
                error.value = 'failed_to_start'
            }
        } else {
            if (!isModelReady.value) {
                loadModel()
                return
            }
            void startRecording()
        }
    }

    const stopListening = () => {
        if (mode.value === 'web-speech') {
            recognition?.stop()
            isListening.value = false
        } else {
            stopRecording()
        }
    }

    const reset = () => {
        interimTranscript.value = ''
        currentSessionFinal.value = ''
        committedTranscript.value = ''
        error.value = ''
    }

    onUnmounted(() => {
        if (recognition && isListening.value) {
            recognition.stop()
        }
        if (worker) {
            worker.terminate()
        }
        stopRecording()
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
        loadModel,
        startListening,
        stopListening,
        reset,
    }
}
