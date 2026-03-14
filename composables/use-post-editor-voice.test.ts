import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

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

class MockMediaRecorder {
    ondataavailable: ((event: { data: Blob }) => void) | null = null
    start = vi.fn()
    stop = vi.fn(() => {
        this.ondataavailable?.({ data: new Blob(['audio']) })
    })
}

global.Worker = MockWorker as unknown as typeof Worker
// @ts-expect-error global mock
global.MediaRecorder = MockMediaRecorder
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
global.SpeechRecognition = MockSpeechRecognition as never

Object.defineProperty(window, 'SpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: MockSpeechRecognition,
    writable: true,
})

Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        }),
    },
    configurable: true,
})

const mockFetch = vi.fn().mockResolvedValue({
    enabled: true,
    siliconflow: true,
    volcengine: true,
})

vi.stubGlobal('$fetch', mockFetch)

vi.mock('#app', () => ({
    defineNuxtPlugin: (plugin: any) => plugin,
    useCookie: () => ({ value: undefined }),
    useNuxtApp: () => ({}),
    useRuntimeConfig: () => ({
        public: {
            hfProxy: 'https://huggingface.co',
        },
    }),
}))

import { useVoiceInput } from './use-voice-input'

async function mountVoiceInput(): Promise<ReturnType<typeof useVoiceInput>> {
    let voiceInput: ReturnType<typeof useVoiceInput> | null = null

    const TestComponent = defineComponent({
        setup() {
            voiceInput = useVoiceInput()
            return () => null
        },
    })

    await mountSuspended(TestComponent)

    if (!voiceInput) {
        throw new Error('voice input composable was not initialized')
    }

    return voiceInput as ReturnType<typeof useVoiceInput>
}

describe('useVoiceInput', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it('should initialize with default values', async () => {
        const { isListening, mode, isSupported } = await mountVoiceInput()
        expect(isListening.value).toBe(false)
        expect(mode.value).toBe('web-speech')
        expect(isSupported.value).toBe(true)
    })

    it('should switch mode correctly', async () => {
        const { mode } = await mountVoiceInput()

        mode.value = 'cloud-batch'
        await nextTick()

        expect(mode.value).toBe('cloud-batch')
    })

    it('should reset transcripts correctly', async () => {
        const { interimTranscript, finalTranscript, reset } = await mountVoiceInput()

        // Simulating some content
        // Note: interimTranscript is a ref, finalTranscript is a computed
        interimTranscript.value = 'hello'

        reset()

        expect(interimTranscript.value).toBe('')
        expect(finalTranscript.value).toBe('')
    })

    it('should start cloud batch recording when switching to cloud mode', async () => {
        const { mode, startListening, isListening } = await mountVoiceInput()

        mode.value = 'cloud-batch'
        await nextTick()
        startListening('zh-CN')
        await Promise.resolve()

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
        expect(isListening.value).toBe(true)
    })
})
