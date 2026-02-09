import { ref, onUnmounted } from 'vue'

export function usePostEditorVoice() {
    const isListening = ref(false)
    const isSupported = ref(false)
    const interimTranscript = ref('')
    const finalTranscript = ref('')
    const error = ref('')

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
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript.value += event.results[i][0].transcript
                    } else {
                        interim += event.results[i][0].transcript
                    }
                }
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
                isListening.value = false
            }
        }
    }

    const startListening = (lang: string = 'zh-CN') => {
        if (!recognition || isListening.value) {
            return
        }
        error.value = ''
        finalTranscript.value = ''
        interimTranscript.value = ''
        recognition.lang = lang
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
        finalTranscript.value = ''
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
