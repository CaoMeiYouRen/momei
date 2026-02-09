import { ref, onUnmounted, computed } from 'vue'

export function usePostEditorVoice() {
    const isListening = ref(false)
    const isSupported = ref(false)
    const interimTranscript = ref('')
    const committedTranscript = ref('') // 之前识别完成的内容
    const currentSessionFinal = ref('') // 当前正在进行的会话中已确认的内容
    const error = ref('')

    // 对外暴露的最终文本：已提交的 + 当前会话已确认的
    const finalTranscript = computed(() => committedTranscript.value + currentSessionFinal.value)

    let recognition: any = null

    if (import.meta.client) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
            isSupported.value = true
            recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event: any) => {
                let interim = ''
                let sessionFinal = ''
                // 每次识别结果返回时，重建当前会话的完整文本，确保不会因为索引问题导致重复或覆盖
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
                console.error('Speech recognition error', event.error)
                error.value = event.error
                if (event.error === 'not-allowed') {
                    error.value = 'permission_denied'
                }
                isListening.value = false
            }

            recognition.onend = () => {
                // 当会话结束时（可能是用户手动停止，也可能是浏览器自动停止），
                // 将当前会话的最终结果归档到 committedTranscript 中
                committedTranscript.value += currentSessionFinal.value
                currentSessionFinal.value = ''
                interimTranscript.value = ''
                isListening.value = false
            }
        }
    }

    const startListening = (lang: string = 'zh-CN') => {
        if (!recognition || isListening.value) {
            return
        }
        error.value = ''
        interimTranscript.value = ''
        currentSessionFinal.value = '' // 开启新会话时重置当前会话缓存

        // 规范化语言代码，确保如果是 'zh' 则强制使用 'zh-CN' (简体中文)
        // 避免部分浏览器（如台湾地区的浏览器或某些代理环境下）默认识别为繁体
        let recognitionLang = lang
        if (!lang || lang === 'zh') {
            recognitionLang = 'zh-CN'
        } else if (lang.startsWith('zh-')) {
            // 如果已经是明确的 zh-CN, zh-TW 等，则保留
            recognitionLang = lang
        } else if (lang === 'en') {
            recognitionLang = 'en-US'
        }

        recognition.lang = recognitionLang
        try {
            recognition.start()
            isListening.value = true
        } catch (e) {
            console.error('Failed to start recognition', e)
            error.value = 'failed_to_start'
        }
    }

    const stopListening = () => {
        if (!recognition) {
            return
        }
        recognition.stop()
        isListening.value = false
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
    })

    return {
        isListening,
        isSupported,
        interimTranscript,
        finalTranscript,
        error,
        startListening,
        stopListening,
        reset,
    }
}
