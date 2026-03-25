import type {
    CompressionLevel,
    CompressionOptions,
    CompressionResult,
    SupportedFormats,
    CompressionStrategy,
} from '~/types/asr'

/**
 * 检测浏览器支持的音频编码格式
 */
export function detectSupportedFormats(): SupportedFormats {
    const formats: SupportedFormats = {
        opus: false,
        webm: false,
        mp3: false,
        wav: true, // WAV 始终支持 (PCM)
    }

    if (typeof MediaRecorder === 'undefined') {
        return formats
    }

    // 检测 Opus 支持
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        formats.opus = true
        formats.webm = true
    }

    // 检测 WebM 支持
    if (MediaRecorder.isTypeSupported('audio/webm')) {
        formats.webm = true
    }

    // 检测 MP3 支持 (较少浏览器支持编码)
    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        formats.mp3 = true
    }

    return formats
}

/**
 * 推荐最佳压缩策略
 *
 * 策略优先级: Opus > WebM > PCM
 */
export function recommendCompressionStrategy(
    level: CompressionLevel = 'light',
): CompressionStrategy {
    const formats = detectSupportedFormats()

    // 根据压缩级别调整参数
    const sampleRateMap: Record<CompressionLevel, number> = {
        none: 48000,
        light: 16000, // ASR 最佳采样率
        medium: 16000,
        aggressive: 8000, // 电话质量
    }

    // 优先使用 Opus 编码 (高压缩比，适合语音)
    if (formats.opus) {
        return {
            mimeType: 'audio/webm;codecs=opus',
            codec: 'opus',
            sampleRate: sampleRateMap[level],
        }
    }

    // 降级到 WebM
    if (formats.webm) {
        return {
            mimeType: 'audio/webm',
            codec: 'webm',
            sampleRate: sampleRateMap[level],
        }
    }

    // 最终降级到 PCM
    return {
        mimeType: 'audio/pcm',
        codec: 'pcm',
        sampleRate: sampleRateMap[level],
    }
}

/**
 * 轻量级压缩: 使用 OfflineAudioContext 重采样
 *
 * 优点: 无需额外依赖，性能好
 * 缺点: 压缩率有限
 */
export async function lightCompress(
    audioBuffer: AudioBuffer,
    options: CompressionOptions = { level: 'light' },
): Promise<CompressionResult> {
    const originalSize = audioBuffer.length * audioBuffer.numberOfChannels * 4

    // 获取目标采样率
    const strategy = recommendCompressionStrategy(options.level)
    const targetSampleRate = options.targetSampleRate || strategy.sampleRate

    // 创建离线音频上下文进行重采样
    const offlineCtx = new OfflineAudioContext(
        1, // 单声道 (ASR 最佳)
        Math.ceil(audioBuffer.duration * targetSampleRate),
        targetSampleRate,
    )

    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineCtx.destination)
    source.start()

    const resampledBuffer = await offlineCtx.startRendering()

    // 转换为 PCM Int16
    const pcmData = float32ToPcmInt16(resampledBuffer.getChannelData(0))
    const blob = new Blob([pcmData], { type: 'audio/pcm' })

    return {
        blob,
        mimeType: 'audio/pcm',
        originalSize,
        compressedSize: pcmData.byteLength,
        compressionRatio: pcmData.byteLength / originalSize,
    }
}

/**
 * Float32 转 PCM Int16
 */
export function float32ToPcmInt16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2)
    const view = new DataView(buffer)

    for (let i = 0; i < float32Array.length; i++) {
        const sample = float32Array[i] ?? 0
        const clamped = Math.max(-1, Math.min(1, sample))
        const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
        view.setInt16(i * 2, int16, true)
    }

    return buffer
}

/**
 * Int16Array 转 Float32Array
 */
export function pcmInt16ToFloat32(int16Array: Int16Array): Float32Array {
    const float32 = new Float32Array(int16Array.length)

    for (let i = 0; i < int16Array.length; i++) {
        const sample = int16Array[i] ?? 0
        float32[i] = sample < 0 ? sample / 0x8000 : sample / 0x7FFF
    }

    return float32
}

/**
 * 合并多个 AudioBuffer
 */
export function mergeAudioBuffers(buffers: AudioBuffer[]): AudioBuffer | null {
    if (buffers.length === 0) {
        return null
    }
    if (buffers.length === 1) {
        return buffers[0] ?? null
    }

    const firstBuffer = buffers[0]!
    const sampleRate = firstBuffer.sampleRate
    const numberOfChannels = firstBuffer.numberOfChannels

    // 计算总长度
    let totalLength = 0
    for (const buffer of buffers) {
        totalLength += buffer.length
    }

    // 创建新的 AudioBuffer
    const audioContext = new AudioContext()
    const mergedBuffer = audioContext.createBuffer(
        numberOfChannels,
        totalLength,
        sampleRate,
    )

    // 复制数据
    let offset = 0
    for (const buffer of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel)
            const destData = mergedBuffer.getChannelData(channel)
            destData.set(sourceData, offset)
        }
        offset += buffer.length
    }

    void audioContext.close()

    return mergedBuffer
}

/**
 * 获取 AudioBuffer 的 PCM 数据
 */
export function getAudioBufferPcm(audioBuffer: AudioBuffer): Float32Array {
    // 如果是单声道，直接返回
    if (audioBuffer.numberOfChannels === 1) {
        return audioBuffer.getChannelData(0)
    }

    // 如果是立体声，混合为单声道
    const leftChannel = audioBuffer.getChannelData(0)
    const rightChannel = audioBuffer.getChannelData(1)
    const monoData = new Float32Array(leftChannel.length)

    for (let i = 0; i < leftChannel.length; i++) {
        monoData[i] = (leftChannel[i]! + rightChannel[i]!) / 2
    }

    return monoData
}

/**
 * 计算音频时长 (秒)
 */
export function getAudioDuration(audioBuffer: AudioBuffer): number {
    return audioBuffer.duration
}

/**
 * 计算音频数据大小 (字节)
 */
export function getAudioSize(audioBuffer: AudioBuffer): number {
    return audioBuffer.length * audioBuffer.numberOfChannels * 4 // Float32 = 4 bytes
}
