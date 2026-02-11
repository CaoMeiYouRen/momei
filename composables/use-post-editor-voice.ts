import { ref, onUnmounted, computed, watch } from 'vue'

export type VoiceTranscriptionMode = 'web-speech' | 'local-whisper'

export function usePostEditorVoice() {
    const isListening = ref(false)
    const isSupported = ref(false)
    const interimTranscript = ref('')
    const committedTranscript = ref('') // 之前识别完成的内容
    const currentSessionFinal = ref('') // 当前正在进行的会话中已确认的内容
    const error = ref('')

    // 模式切换
    const mode = ref<VoiceTranscriptionMode>('web-speech')
    const isLoadingModel = ref(false)
    const modelProgress = ref(0)
    const isModelReady = ref(false)

    // 对外暴露的最终文本：已提交的 + 当前会话已确认的
    const finalTranscript = computed(() => committedTranscript.value + currentSessionFinal.value)

    let recognition: any = null
    let worker: Worker | null = null
    let audioContext: AudioContext | null = null
    let mediaStream: MediaStream | null = null
    let processor: ScriptProcessorNode | null = null
    let audioData: Float32Array[] = []

    // 初始化 Web Speech API
    if (import.meta.client) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
            isSupported.value = true
            recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event: any) => {
                if (mode.value !== 'web-speech') { return }
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
                if (mode.value !== 'web-speech') { return }
                console.error('Speech recognition error', event.error)
                error.value = event.error
                if (event.error === 'not-allowed') {
                    error.value = 'permission_denied'
                }
                isListening.value = false
            }

            recognition.onend = () => {
                if (mode.value !== 'web-speech') { return }
                committedTranscript.value += currentSessionFinal.value
                currentSessionFinal.value = ''
                interimTranscript.value = ''
                isListening.value = false
            }
        }
    }

    // 初始化 Worker (Local Whisper)
    const initWorker = () => {
        if (typeof Worker === 'undefined') { return }
        if (worker) { return }

        worker = new Worker(new URL('../assets/js/workers/transcription.worker.ts', import.meta.url), {
            type: 'module',
        })

        worker.onmessage = (event) => {
            const { type, data } = event.data
            switch (type) {
                case 'progress':
                    if (data.status === 'progress') {
                        modelProgress.value = data.progress
                    }
                    break
                case 'ready':
                    isModelReady.value = true
                    isLoadingModel.value = false
                    break
                case 'result':
                    currentSessionFinal.value = data.text
                    isListening.value = false
                    break
                case 'error':
                    error.value = data
                    isLoadingModel.value = false
                    isListening.value = false
                    break
            }
        }
    }

    const loadModel = () => {
        if (!worker) { initWorker() }
        if (isModelReady.value) { return }

        isLoadingModel.value = true
        worker?.postMessage({ type: 'load' })
    }

    // 处理音频录制 (用于 Local Whisper)
    const startRecording = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioContext = new AudioContext({ sampleRate: 16000 })
            const source = audioContext.createMediaStreamSource(mediaStream)
            processor = audioContext.createScriptProcessor(4096, 1, 1)

            audioData = []
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0)
                audioData.push(new Float32Array(inputData))
            }

            source.connect(processor)
            processor.connect(audioContext.destination)
            isListening.value = true
        } catch (err: any) {
            console.error('Failed to start recording', err)
            error.value = err.name === 'NotAllowedError' ? 'permission_denied' : 'failed_to_start'
        }
    }

    const stopRecording = () => {
        if (processor) {
            processor.disconnect()
            processor = null
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop())
            mediaStream = null
        }
        if (audioContext) {
            audioContext.close()
            audioContext = null
        }

        // 合并数据并发送给 Worker
        if (audioData.length > 0) {
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
                language: recognition?.lang?.split('-')[0] || 'zh', // Whisper usually takes 'zh', 'en' etc.
            })
        }
    }

    const startListening = (lang: string = 'zh-CN') => {
        if (isListening.value) { return }
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

        if (mode.value === 'web-speech') {
            if (!recognition) {
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
            if (!isModelReady.value) {
                loadModel()
                return
            }
            startRecording()
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

    watch(mode, (newMode) => {
        if (newMode === 'local-whisper' && !isModelReady.value) {
            loadModel()
        }
    })

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
        startListening,
        stopListening,
        reset,
    }
}
