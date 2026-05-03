import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    detectSupportedFormats,
    float32ToPcmInt16,
    getAudioBufferPcm,
    getAudioDuration,
    getAudioSize,
    lightCompress,
    mergeAudioBuffers,
    pcmInt16ToFloat32,
    recommendCompressionStrategy,
} from './audio-compression'

function createAudioBufferMock(channelValues: number[][], sampleRate = 48000): AudioBuffer {
    const channels = channelValues.map((values) => Float32Array.from(values))
    const length = channels[0]?.length ?? 0

    return {
        length,
        duration: length / sampleRate,
        numberOfChannels: channels.length,
        sampleRate,
        getChannelData: (channel: number) => channels[channel]!,
    } as AudioBuffer
}

function createMutableAudioBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))

    return {
        length,
        duration: length / sampleRate,
        numberOfChannels,
        sampleRate,
        getChannelData: (channel: number) => channels[channel]!,
    } as AudioBuffer
}

class MockMediaRecorder {
    static supportedTypes = new Set<string>()

    static isTypeSupported(type: string): boolean {
        return MockMediaRecorder.supportedTypes.has(type)
    }
}

class MockOfflineAudioContext {
    static lastInstance: MockOfflineAudioContext | null = null

    readonly destination = { kind: 'offline-destination' }
    readonly source = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(),
    }

    constructor(
        public readonly numberOfChannels: number,
        public readonly length: number,
        public readonly sampleRate: number,
    ) {
        MockOfflineAudioContext.lastInstance = this
    }

    createBufferSource() {
        return this.source
    }

    startRendering(): Promise<AudioBuffer> {
        return Promise.resolve(createAudioBufferMock([[0.5, -0.5, 1.2, -1.5]], this.sampleRate))
    }
}

class MockAudioContext {
    static lastInstance: MockAudioContext | null = null

    readonly close = vi.fn(() => undefined)

    constructor() {
        MockAudioContext.lastInstance = this
    }

    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
        return createMutableAudioBuffer(numberOfChannels, length, sampleRate)
    }
}

describe('audio-compression', () => {
    beforeEach(() => {
        MockMediaRecorder.supportedTypes = new Set()
        MockOfflineAudioContext.lastInstance = null
        MockAudioContext.lastInstance = null
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('detects supported recorder formats and always keeps wav enabled', () => {
        vi.stubGlobal('MediaRecorder', MockMediaRecorder)
        MockMediaRecorder.supportedTypes = new Set([
            'audio/webm;codecs=opus',
            'audio/webm',
        ])

        expect(detectSupportedFormats()).toEqual({
            opus: true,
            webm: true,
            mp3: false,
            wav: true,
        })
    })

    it('falls back to wav-only support when MediaRecorder is unavailable', () => {
        vi.stubGlobal('MediaRecorder', undefined)

        expect(detectSupportedFormats()).toEqual({
            opus: false,
            webm: false,
            mp3: false,
            wav: true,
        })
    })

    it('recommends opus first, then webm, then pcm with level-based sample rates', () => {
        vi.stubGlobal('MediaRecorder', MockMediaRecorder)

        MockMediaRecorder.supportedTypes = new Set(['audio/webm;codecs=opus'])
        expect(recommendCompressionStrategy('light')).toEqual({
            mimeType: 'audio/webm;codecs=opus',
            codec: 'opus',
            sampleRate: 16000,
        })

        MockMediaRecorder.supportedTypes = new Set(['audio/webm'])
        expect(recommendCompressionStrategy('none')).toEqual({
            mimeType: 'audio/webm',
            codec: 'webm',
            sampleRate: 48000,
        })

        MockMediaRecorder.supportedTypes = new Set()
        expect(recommendCompressionStrategy('aggressive')).toEqual({
            mimeType: 'audio/pcm',
            codec: 'pcm',
            sampleRate: 8000,
        })
    })

    it('converts Float32 PCM to Int16 and back with clamping', () => {
        const buffer = float32ToPcmInt16(Float32Array.from([-2, -1, -0.5, 0, 0.5, 1, 2]))
        const int16 = new Int16Array(buffer)

        expect(Array.from(int16)).toEqual([-32768, -32768, -16384, 0, 16383, 32767, 32767])

        const restored = pcmInt16ToFloat32(int16)
        expect(restored[0]).toBeCloseTo(-1, 5)
        expect(restored[2]).toBeCloseTo(-0.5, 4)
        expect(restored[4]).toBeCloseTo(0.5, 4)
        expect(restored[5]).toBeCloseTo(1, 4)
    })

    it('merges multiple buffers and closes the temporary audio context', () => {
        vi.stubGlobal('AudioContext', MockAudioContext)

        const merged = mergeAudioBuffers([
            createAudioBufferMock([[0.1, 0.2], [0.5, 0.6]]),
            createAudioBufferMock([[0.3, 0.4], [0.7, 0.8]]),
        ])

        expect(merged).not.toBeNull()
        expect(Array.from(merged!.getChannelData(0))).toSatisfy((values: number[]) => values.every((value, index) => Math.abs(value - [0.1, 0.2, 0.3, 0.4][index]!) < 1e-6))
        expect(Array.from(merged!.getChannelData(1))).toSatisfy((values: number[]) => values.every((value, index) => Math.abs(value - [0.5, 0.6, 0.7, 0.8][index]!) < 1e-6))
        expect(MockAudioContext.lastInstance?.close).toHaveBeenCalledTimes(1)
    })

    it('returns null for empty merges and keeps single buffers untouched', () => {
        const single = createAudioBufferMock([[0.1, 0.2, 0.3]])

        expect(mergeAudioBuffers([])).toBeNull()
        expect(mergeAudioBuffers([single])).toBe(single)
    })

    it('returns mono PCM directly or mixes stereo channels down to mono', () => {
        const mono = createAudioBufferMock([[0.1, 0.2, 0.3]])
        const stereo = createAudioBufferMock([[0.2, 0.4, 0.6], [0.4, 0.2, 0]])

        expect(getAudioBufferPcm(mono)).toBe(mono.getChannelData(0))
        expect(Array.from(getAudioBufferPcm(stereo))).toSatisfy((values: number[]) => values.every((value) => Math.abs(value - 0.3) < 1e-6))
        expect(getAudioDuration(stereo)).toBeCloseTo(3 / 48000, 8)
        expect(getAudioSize(stereo)).toBe(3 * 2 * 4)
    })

    it('lightly compresses audio by resampling to a mono PCM blob', async () => {
        vi.stubGlobal('MediaRecorder', MockMediaRecorder)
        vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext)

        MockMediaRecorder.supportedTypes = new Set(['audio/webm;codecs=opus'])

        const audioBuffer = createAudioBufferMock([
            [0.1, 0.2, 0.3, 0.4],
            [0.4, 0.3, 0.2, 0.1],
        ])

        const result = await lightCompress(audioBuffer, { level: 'medium' })

        expect(MockOfflineAudioContext.lastInstance?.numberOfChannels).toBe(1)
        expect(MockOfflineAudioContext.lastInstance?.sampleRate).toBe(16000)
        expect(MockOfflineAudioContext.lastInstance?.length).toBe(Math.ceil(audioBuffer.duration * 16000))
        expect(MockOfflineAudioContext.lastInstance?.source.connect).toHaveBeenCalledWith(MockOfflineAudioContext.lastInstance?.destination)
        expect(MockOfflineAudioContext.lastInstance?.source.start).toHaveBeenCalledTimes(1)
        expect(result.mimeType).toBe('audio/pcm')
        expect(result.originalSize).toBe(4 * 2 * 4)
        expect(result.compressedSize).toBe(8)
        expect(result.compressionRatio).toBe(0.25)
        expect(result.blob.type).toBe('audio/pcm')
        expect(result.blob.size).toBe(8)
    })

    it('honors an explicit target sample rate during light compression', async () => {
        vi.stubGlobal('MediaRecorder', MockMediaRecorder)
        vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext)

        const audioBuffer = createAudioBufferMock([[0.1, 0.2, 0.3, 0.4]], 24000)

        await lightCompress(audioBuffer, {
            level: 'none',
            targetSampleRate: 12000,
        })

        expect(MockOfflineAudioContext.lastInstance?.sampleRate).toBe(12000)
        expect(MockOfflineAudioContext.lastInstance?.length).toBe(Math.ceil(audioBuffer.duration * 12000))
    })
})
