import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { usePostEditorVoice } from './use-post-editor-voice'

const { directBatchMock, directStreamMock, useASRDirectMock } = vi.hoisted(() => ({
    directBatchMock: {
        transcribeBatch: vi.fn(),
    },
    directStreamMock: {
        isConnected: { value: false },
        interimTranscript: { value: '' },
        finalTranscript: { value: '' },
        error: { value: '' },
        connect: vi.fn(),
        sendAudio: vi.fn(),
        stop: vi.fn(),
        reset: vi.fn(),
    },
    useASRDirectMock: vi.fn((options: { mode: 'batch' | 'stream' }) => (options.mode === 'batch'
        ? directBatchMock
        : directStreamMock)),
}))

vi.mock('./use-asr-direct', () => ({
    useASRDirect: useASRDirectMock,
}))

class MockSpeechRecognition {
    static lastInstance: MockSpeechRecognition | null = null

    continuous = false
    interimResults = false
    lang = ''
    onresult: ((event: { results: ArrayLike<{ '0': { transcript: string }, isFinal: boolean }> }) => void) | null = null
    onerror: ((event: { error: string }) => void) | null = null
    onend: (() => void) | null = null
    start = vi.fn()
    stop = vi.fn()

    constructor() {
        MockSpeechRecognition.lastInstance = this
    }
}

class MockMediaRecorder {
    static lastInstance: MockMediaRecorder | null = null

    ondataavailable: ((event: { data: Blob }) => void) | null = null
    start = vi.fn()
    stop = vi.fn(() => {
        this.ondataavailable?.({ data: new Blob(['audio-data'], { type: 'audio/webm' }) })
    })

    constructor(stream: MediaStream, options?: MediaRecorderOptions) {
        void stream
        void options
        MockMediaRecorder.lastInstance = this
    }
}

class MockScriptProcessorNode {
    onaudioprocess: ((event: { inputBuffer: { getChannelData: (channel: number) => Float32Array } }) => void) | null = null
    connect = vi.fn()
    disconnect = vi.fn()
}

class MockAudioContext {
    static lastInstance: MockAudioContext | null = null

    state: 'running' | 'suspended' | 'closed' = 'running'
    sampleRate = 16000
    destination = {}
    audioWorklet?: { addModule: ReturnType<typeof vi.fn> }
    resume = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockImplementation(() => {
        this.state = 'closed'
        return Promise.resolve(undefined)
    })

    sourceNode = {
        connect: vi.fn(),
        disconnect: vi.fn(),
    }

    gainNode = {
        gain: { value: 1 },
        connect: vi.fn(),
        disconnect: vi.fn(),
    }

    scriptProcessorNode = new MockScriptProcessorNode()
    createMediaStreamSource = vi.fn(() => this.sourceNode)
    createGain = vi.fn(() => this.gainNode)
    createScriptProcessor = vi.fn(() => this.scriptProcessorNode)

    constructor(options?: { sampleRate?: number }) {
        if (options?.sampleRate) {
            this.sampleRate = options.sampleRate
        }
        MockAudioContext.lastInstance = this
    }
}

class MockWebSocket {
    static instances: MockWebSocket[] = []
    static OPEN = 1

    url: string
    readyState = MockWebSocket.OPEN
    sent: string[] = []
    closed = false
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    onclose: (() => void) | null = null

    constructor(url: string) {
        this.url = url
        MockWebSocket.instances.push(this)
    }

    send = vi.fn((payload: string) => {
        this.sent.push(payload)
    })

    close = vi.fn(() => {
        this.closed = true
        this.onclose?.()
    })
}

const mockFetch = vi.fn()
const getUserMediaMock = vi.fn()

async function flushVoiceUpdates() {
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
}

async function mountVoice(options?: Parameters<typeof usePostEditorVoice>[0]) {
    let voice: ReturnType<typeof usePostEditorVoice> | null = null

    const TestComponent = defineComponent({
        setup() {
            voice = usePostEditorVoice(options)
            return () => null
        },
    })

    await mountSuspended(TestComponent)
    await flushVoiceUpdates()

    if (!voice) {
        throw new Error('voice composable not initialized')
    }

    return voice as ReturnType<typeof usePostEditorVoice>
}

describe('usePostEditorVoice', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
        localStorage.clear()
        MockSpeechRecognition.lastInstance = null
        MockMediaRecorder.lastInstance = null
        MockAudioContext.lastInstance = null
        MockWebSocket.instances = []

        directBatchMock.transcribeBatch.mockReset()
        directStreamMock.connect.mockReset()
        directStreamMock.sendAudio.mockReset()
        directStreamMock.stop.mockReset()
        directStreamMock.reset.mockReset()
        directStreamMock.isConnected.value = false
        directStreamMock.interimTranscript.value = ''
        directStreamMock.finalTranscript.value = ''
        directStreamMock.error.value = ''

        mockFetch.mockImplementation((url: string) => {
            if (url === '/api/ai/asr/config') {
                return Promise.resolve({
                    enabled: true,
                    siliconflow: true,
                    volcengine: true,
                })
            }

            if (url === '/api/ai/asr/transcribe') {
                return Promise.resolve({
                    text: 'proxy transcript',
                })
            }

            return Promise.reject(new Error(`unexpected fetch: ${url}`))
        })

        getUserMediaMock.mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        })

        vi.stubGlobal('$fetch', mockFetch)
        vi.stubGlobal('MediaRecorder', MockMediaRecorder)
        vi.stubGlobal('AudioContext', MockAudioContext)
        vi.stubGlobal('WebSocket', MockWebSocket)
        vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
        vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)

        Object.defineProperty(window, 'SpeechRecognition', {
            configurable: true,
            writable: true,
            value: MockSpeechRecognition,
        })

        Object.defineProperty(window, 'webkitSpeechRecognition', {
            configurable: true,
            writable: true,
            value: MockSpeechRecognition,
        })

        Object.defineProperty(global.navigator, 'mediaDevices', {
            configurable: true,
            value: {
                getUserMedia: getUserMediaMock,
            },
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it('initializes with saved mode and records later mode changes', async () => {
        localStorage.setItem('momei_voice_mode', 'cloud-batch')

        const voice = await mountVoice()

        expect(voice.isSupported.value).toBe(true)
        expect(voice.mode.value).toBe('cloud-batch')
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/asr/config')

        voice.mode.value = 'web-speech'
        await nextTick()

        expect(localStorage.getItem('momei_voice_mode')).toBe('web-speech')
    })

    it('starts web speech recognition, normalizes language and commits final transcript on end', async () => {
        const voice = await mountVoice()

        voice.startListening('en')

        const recognition = MockSpeechRecognition.lastInstance
        expect(recognition).toBeTruthy()
        expect(recognition?.lang).toBe('en-US')
        expect(recognition?.start).toHaveBeenCalledTimes(1)
        expect(voice.isListening.value).toBe(true)

        recognition?.onresult?.({
            results: [
                { '0': { transcript: 'hello ' }, isFinal: false },
                { '0': { transcript: 'world' }, isFinal: true },
            ],
        })

        expect(voice.interimTranscript.value).toBe('hello ')
        expect(voice.finalTranscript.value).toBe('world')

        recognition?.onend?.()

        expect(voice.interimTranscript.value).toBe('')
        expect(voice.finalTranscript.value).toBe('world')
        expect(voice.isListening.value).toBe(false)
    })

    it('maps web speech permission errors to permission_denied', async () => {
        const voice = await mountVoice()

        voice.startListening('zh')
        MockSpeechRecognition.lastInstance?.onerror?.({ error: 'not-allowed' })

        expect(voice.error.value).toBe('permission_denied')
        expect(voice.isListening.value).toBe(false)
    })

    it('falls back to cloud batch recording when speech recognition is unavailable', async () => {
        mockFetch.mockImplementation((url: string) => {
            if (url === '/api/ai/asr/config') {
                return Promise.resolve({
                    enabled: true,
                    siliconflow: true,
                    volcengine: false,
                })
            }

            if (url === '/api/ai/asr/transcribe') {
                return Promise.resolve({
                    text: 'proxy transcript',
                })
            }

            return Promise.reject(new Error(`unexpected fetch: ${url}`))
        })

        Object.defineProperty(window, 'SpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })
        Object.defineProperty(window, 'webkitSpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })

        const voice = await mountVoice()

        voice.startListening('zh')
        await flushVoiceUpdates()

        expect(voice.mode.value).toBe('cloud-batch')
        expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true })
        expect(MockMediaRecorder.lastInstance?.start).toHaveBeenCalledTimes(1)
        expect(voice.isListening.value).toBe(true)

        vi.useFakeTimers()
        voice.stopListening()
        await vi.runAllTimersAsync()
        await flushVoiceUpdates()

        expect(MockMediaRecorder.lastInstance?.stop).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/asr/transcribe', expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData),
        }))
        expect(voice.finalTranscript.value).toBe('proxy transcript')
    })

    it('falls back to proxy batch transcription when direct batch mode fails', async () => {
        directBatchMock.transcribeBatch.mockRejectedValueOnce(new Error('direct batch failed'))

        Object.defineProperty(window, 'SpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })
        Object.defineProperty(window, 'webkitSpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })

        const voice = await mountVoice({ directMode: true })

        voice.mode.value = 'cloud-batch'
        await nextTick()
        voice.startListening('zh-CN')
        await flushVoiceUpdates()

        vi.useFakeTimers()
        voice.stopListening()
        await vi.runAllTimersAsync()
        await flushVoiceUpdates()

        expect(directBatchMock.transcribeBatch).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/asr/transcribe', expect.objectContaining({
            method: 'POST',
        }))
        expect(voice.finalTranscript.value).toBe('proxy transcript')
    })

    it('returns not_supported when neither web speech nor recording fallback is available', async () => {
        Object.defineProperty(window, 'SpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })
        Object.defineProperty(window, 'webkitSpeechRecognition', {
            configurable: true,
            writable: true,
            value: undefined,
        })
        Object.defineProperty(global.navigator, 'mediaDevices', {
            configurable: true,
            value: undefined,
        })
        vi.stubGlobal('MediaRecorder', undefined)

        const voice = await mountVoice()

        voice.startListening('zh-CN')

        expect(voice.error.value).toBe('not_supported')
        expect(voice.isListening.value).toBe(false)
    })

    it('resets transcript and error state', async () => {
        const voice = await mountVoice()

        voice.startListening('zh-CN')
        MockSpeechRecognition.lastInstance?.onresult?.({
            results: [
                { '0': { transcript: '临时' }, isFinal: false },
                { '0': { transcript: '文本' }, isFinal: true },
            ],
        })
        MockSpeechRecognition.lastInstance?.onerror?.({ error: 'network' })

        voice.reset()

        expect(voice.interimTranscript.value).toBe('')
        expect(voice.finalTranscript.value).toBe('')
        expect(voice.error.value).toBe('')
    })

    it('handles proxy cloud-stream websocket lifecycle and transcript messages', async () => {
        const voice = await mountVoice()

        voice.mode.value = 'cloud-stream'
        await nextTick()
        voice.startListening('zh-CN')
        await flushVoiceUpdates()

        const ws = MockWebSocket.instances[0]
        expect(ws).toBeDefined()
        expect(ws?.url).toContain('/api/ai/asr/stream')

        ws?.onopen?.()
        expect(ws?.send).toHaveBeenCalledWith(expect.stringContaining('"type":"start"'))

        ws?.onmessage?.({ data: JSON.stringify({ type: 'transcript', text: '临时片段', isFinal: false }) })
        expect(voice.interimTranscript.value).toBe('临时片段')

        ws?.onmessage?.({ data: JSON.stringify({ type: 'started' }) })
        expect(voice.isListening.value).toBe(true)

        ws?.onmessage?.({ data: JSON.stringify({ type: 'transcript', text: '最终文本', isFinal: true }) })
        expect(voice.interimTranscript.value).toBe('')
        expect(voice.finalTranscript.value).toBe('最终文本')

        ws?.onmessage?.({ data: JSON.stringify({ type: 'error', message: 'stream_failed' }) })
        expect(voice.error.value).toBe('stream_failed')
        expect(voice.isListening.value).toBe(false)
        expect(ws?.closed).toBe(true)
    })

    it('falls back to proxy websocket when direct cloud-stream connection fails', async () => {
        directStreamMock.connect.mockRejectedValueOnce(new Error('direct stream failed'))

        const voice = await mountVoice({ directMode: true })

        voice.mode.value = 'cloud-stream'
        await nextTick()
        voice.startListening('zh-CN')
        await flushVoiceUpdates()

        expect(directStreamMock.connect).toHaveBeenCalledTimes(1)
        const ws = MockWebSocket.instances[0]
        expect(ws).toBeDefined()
        ws?.onopen?.()
        ws?.onmessage?.({ data: JSON.stringify({ type: 'started' }) })

        expect(voice.isListening.value).toBe(true)
        expect(MockAudioContext.lastInstance?.createScriptProcessor).toHaveBeenCalledTimes(1)
    })

    it('reacts to direct cloud-stream watcher updates and stops direct stream cleanly', async () => {
        directStreamMock.connect.mockImplementation(() => {
            directStreamMock.isConnected.value = true
            return Promise.resolve(undefined)
        })

        const voice = await mountVoice({ directMode: true })

        voice.mode.value = 'cloud-stream'
        await nextTick()
        voice.startListening('zh-CN')
        await flushVoiceUpdates()

        expect(directStreamMock.connect).toHaveBeenCalledTimes(1)
        expect(voice.isListening.value).toBe(true)

        vi.useFakeTimers()
        voice.stopListening()
        await vi.runAllTimersAsync()
        await flushVoiceUpdates()

        expect(directStreamMock.stop).toHaveBeenCalledTimes(1)
        expect(MockAudioContext.lastInstance?.close).toHaveBeenCalledTimes(1)
    })
})
