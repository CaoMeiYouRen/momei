import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// Mock Worker
class MockWorker {
    onmessage: any = null
    postMessage = vi.fn()
    terminate = vi.fn()
}

class MockSpeechRecognition {
    continuous = false
    interimResults = false
    onresult: any = null
    onerror: any = null
    onend: any = null
    start = vi.fn()
    stop = vi.fn()
}

// @ts-expect-error global mock
global.Worker = MockWorker
global.AudioContext = vi.fn().mockImplementation(() => ({
    state: 'running',
    resume: vi.fn(),
    audioWorklet: {
        addModule: vi.fn().mockResolvedValue(undefined),
    },
    createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
    createGain: vi.fn().mockReturnValue({
        gain: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn(),
    }),
    createScriptProcessor: vi.fn().mockReturnValue({ connect: vi.fn(), onaudioprocess: null }),
    destination: {},
    sampleRate: 16000,
    close: vi.fn(),
}))
global.SpeechRecognition = MockSpeechRecognition

vi.mock('#app', () => ({
    defineNuxtPlugin: (plugin: any) => plugin,
    useRuntimeConfig: () => ({
        public: {
            hfProxy: 'https://huggingface.co',
        },
    }),
}))

import { usePostEditorVoice } from './use-post-editor-voice'

describe('usePostEditorVoice', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with default values', () => {
        const { isListening, mode, isSupported } = usePostEditorVoice()
        expect(isListening.value).toBe(false)
        expect(mode.value).toBe('web-speech')
        expect(isSupported.value).toBe(true)
    })

    it('should switch mode correctly', async () => {
        const { mode } = usePostEditorVoice()

        mode.value = 'cloud-batch'
        await nextTick()

        expect(mode.value).toBe('cloud-batch')
    })

    it('should reset transcripts correctly', () => {
        const { interimTranscript, finalTranscript, reset } = usePostEditorVoice()

        // Simulating some content
        // Note: interimTranscript is a ref, finalTranscript is a computed
        interimTranscript.value = 'hello'

        reset()

        expect(interimTranscript.value).toBe('')
        expect(finalTranscript.value).toBe('')
    })
})
