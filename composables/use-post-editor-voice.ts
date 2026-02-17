import { ref, onUnmounted, computed, watch } from 'vue'

export type VoiceTranscriptionMode = 'web-speech' | 'cloud-batch' | 'cloud-stream'

export function usePostEditorVoice() {
    const isListening = ref(false)
    const isSupported = ref(false)
    const interimTranscript = ref('')
    const committedTranscript = ref('') // 之前识别完成的内容
    const currentSessionFinal = ref('') // 当前正在进行的会话中已确认的内容
    const error = ref('')

    // 模式切换
    const mode = ref<VoiceTranscriptionMode>('web-speech')

    // 云端功能状态
    const cloudConfig = ref({
        siliconflow: false,
        volcengine: false,
    })

    const isModelReady = computed(() =>
        true, // Web Speech and Cloud modes don't need local model loading
    )

    // 初始化时从 localStorage 读取模式，并检查云端配置
    if (import.meta.client) {
        const savedMode = localStorage.getItem('momei_voice_mode') as VoiceTranscriptionMode
        const validModes: VoiceTranscriptionMode[] = ['web-speech', 'cloud-batch', 'cloud-stream']
        if (savedMode && validModes.includes(savedMode)) {
            mode.value = savedMode
        }

        // 异步检查配置
        void $fetch<any>('/api/ai/voice/config').then((res) => {
            cloudConfig.value = res
            // 如果当前选择的是没配置的云端模式，自动切回 web-speech
            if (mode.value === 'cloud-batch' && !res.siliconflow) {
                mode.value = 'web-speech'
            } else if (mode.value === 'cloud-stream' && !res.volcengine) {
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

    let recognition: any = null
    let mediaStream: MediaStream | null = null
    let currentLang = 'zh-CN'

    let mediaRecorder: MediaRecorder | null = null
    let audioChunks: Blob[] = []
    let ws: WebSocket | null = null

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
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
                const host = window.location.host
                ws = new WebSocket(`${protocol}//${host}/api/ai/voice/stream`)

                ws.onopen = () => {
                    ws?.send(JSON.stringify({ type: 'start' }))
                }

                ws.onmessage = (event) => {
                    const msg = JSON.parse(event.data)
                    if (msg.type === 'transcript') {
                        if (msg.isFinal) {
                            currentSessionFinal.value += msg.text
                            interimTranscript.value = ''
                        } else {
                            interimTranscript.value = msg.text
                        }
                    } else if (msg.type === 'started') {
                        isListening.value = true
                    } else if (msg.type === 'error') {
                        error.value = msg.message
                        isListening.value = false
                    }
                }

                mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' })
                mediaRecorder.ondataavailable = async (e) => {
                    if (e.data.size > 0 && ws?.readyState === WebSocket.OPEN) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                            const base64 = (reader.result as string).split(',')[1]
                            ws?.send(JSON.stringify({ type: 'audio', payload: base64 }))
                        }
                        reader.readAsDataURL(e.data)
                    }
                }
                mediaRecorder.start(500) // 500ms 一个分片
                
            }
        } catch (err: any) {
            console.error('Failed to start recording', err)
            error.value = err.name === 'NotAllowedError' ? 'permission_denied' : 'failed_to_start'
        }
    }

    const stopRecording = async () => {
        if (mode.value === 'cloud-batch' && mediaRecorder) {
            mediaRecorder.stop()
            isListening.value = false
            // Wait for last chunks
            await new Promise((resolve) => setTimeout(resolve, 100))
            const blob = new Blob(audioChunks, { type: 'audio/webm' })
            await transcribeCloudBatch(blob)
        } else if (mode.value === 'cloud-stream') {
            mediaRecorder?.stop()
            ws?.send(JSON.stringify({ type: 'stop' }))
            // Wait for final response before closing or just close after a short delay
            setTimeout(() => {
                ws?.close()
                ws = null
            }, 500)
            isListening.value = false
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop())
            mediaStream = null
        }
    }

    const transcribeCloudBatch = async (blob: Blob) => {
        isLoadingModel.value = true // Reuse loading state for UI
        try {
            const formData = new FormData()
            formData.append('audioFile', blob, 'recording.webm')
            formData.append('language', currentLang)

            const result = await $fetch<any>('/api/ai/voice/transcribe', {
                method: 'POST',
                body: formData,
            })

            currentSessionFinal.value = result.text
            committedTranscript.value += result.text
            currentSessionFinal.value = ''
        } catch (err: any) {
            console.error('Cloud batch transcription failed', err)
            error.value = err.data?.message || 'cloud_transcription_failed'
        } finally {
            isLoadingModel.value = false
        }
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
        loadModel: () => {}, // No-op
        startListening,
        stopListening,
        reset,
    }
}

