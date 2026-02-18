import crypto from 'node:crypto'
import { createError } from 'h3'
import logger from '../logger'
import type { TTSAudioVoice, TTSOptions, AIProvider } from '@/types/ai'

export interface VolcengineTTSConfig {
    appId: string
    accessKey: string // 即 Access Token
    secretKey?: string // 目前 V3 接口主要使用 Access Token (握手头中的 X-Api-Access-Key)
    defaultModel?: string
}

/**
 * 构造火山引擎 V3 协议帧 (TTS)
 * 协议参考：https://www.volcengine.com/docs/6561/130101
 */
function buildVolcFrame(messageType: number, flags: number, event: number, payload: Buffer | string | object) {
    let payloadBuffer: Buffer
    if (typeof payload === 'string') {
        payloadBuffer = Buffer.from(payload)
    } else if (payload instanceof Buffer) {
        payloadBuffer = payload
    } else {
        payloadBuffer = Buffer.from(JSON.stringify(payload))
    }

    const header = Buffer.alloc(12)

    // Header (4B)
    header.writeUInt8(0x11, 0) // v1, head_size 4
    header.writeUInt8((messageType << 4) | flags, 1) // message type (left 4) | flags (right 4)
    header.writeUInt8(0x10, 2) // serialization JSON (1), compression None (0)
    header.writeUInt8(0x00, 3) // reserved

    // Event (4B)
    header.writeUInt32BE(event, 4)

    // Payload Size (4B)
    header.writeUInt32BE(payloadBuffer.length, 8)

    return Buffer.concat([header, payloadBuffer])
}

/**
 * 解析火山引擎 V3 协议帧 (TTS)
 */
function parseVolcFrame(buffer: Buffer) {
    if (buffer.length < 12) { return null }
    // const head0 = buffer.readUInt8(0)
    const messageType = (buffer.readUInt8(1) >> 4) & 0x0F
    const event = buffer.readUInt32BE(4)
    const payloadSize = buffer.readUInt32BE(8)
    const payload = buffer.subarray(12, 12 + payloadSize)

    return { messageType, event, payload, payloadSize }
}

/**
 * 火山引擎 (豆包) 语音合成提供者
 * 适配 豆包语音合成模型 2.0 (Seed-TTS)
 */
export class VolcengineTTSProvider implements Partial<AIProvider> {
    name = 'volcengine'

    // 预设一些常用的豆包音色
    availableVoices: TTSAudioVoice[] = [
        { id: 'zh_female_shuangkuaisisi_moon_bigtts', name: '爽快思思', language: 'zh', gender: 'female' },
        { id: 'zh_male_dayixiansheng_moon_bigtts', name: '大义先生', language: 'zh', gender: 'male' },
        { id: 'zh_female_mizaitongxue_v2_saturn_bigtts', name: '蜜仔同学', language: 'zh', gender: 'female' },
        { id: 'zh_male_naxinglaoshi_v2_saturn_bigtts', name: '纳型老师', language: 'zh', gender: 'male' },
    ]

    private config: VolcengineTTSConfig

    constructor(config: VolcengineTTSConfig) {
        this.config = {
            defaultModel: 'seed-tts-2.0',
            ...config,
        }
    }

    get model() {
        return this.config.defaultModel
    }

    getVoices(): Promise<TTSAudioVoice[]> {
        return Promise.resolve(this.availableVoices)
    }

    estimateTTSCost(text: string, _voice: string | string[]): Promise<number> {
        // 豆包 2.0 价格大约 0.05 / 1k 字符 (仅供参考，具体以官网为准)
        return Promise.resolve((text.length / 1000) * 0.05)
    }

    async generateSpeech(
        text: string,
        voice: string | string[],
        _options: TTSOptions,
    ): Promise<ReadableStream<Uint8Array>> {
        const appId = this.config.appId
        const token = this.config.accessKey

        if (!appId || !token) {
            throw createError({
                statusCode: 500,
                message: 'Volcengine TTS Error: AppID or Access Token (API Key) missing',
            })
        }

        const model = this.config.defaultModel || 'seed-tts-2.0'
        const speaker = Array.isArray(voice) ? voice[0] : voice
        const sessionId = crypto.randomUUID()

        // 豆包 2.0 双向流式接口 (WebSocket V3)
        return new ReadableStream({
            start(controller) {
                const url = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection'

                // 使用原生 WebSocket (Node.js 22+ 或浏览器端)
                // 注意：Node.js 原生 WebSocket (基于 undici) 在构造函数中可能支持 headers 选项
                const ws = new (globalThis.WebSocket as any)(url, {
                    headers: {
                        'X-Api-App-Key': appId,
                        'X-Api-Access-Key': token,
                        'X-Api-Resource-Id': model === 'seed-tts-2.0' ? 'seed-tts-2.0' : 'seed-tts-1.0',
                        'X-Api-Connect-Id': crypto.randomUUID(),
                    },
                })

                ws.binaryType = 'arraybuffer'

                ws.onopen = () => {
                    logger.debug(`[VolcengineTTS] WebSocket connected. Session: ${sessionId}`)
                    // 1. 发送 StartConnection (Event 1)
                    ws.send(buildVolcFrame(1, 4, 1, {}))
                }

                ws.onmessage = (event: MessageEvent) => {
                    const buffer = Buffer.from(event.data as ArrayBuffer)
                    const frame = parseVolcFrame(buffer)
                    if (!frame) { return }

                    const { event: eventNum, payload } = frame

                    // ConnectionStarted (50)
                    if (eventNum === 50) {
                        // 2. 发送 StartSession (Event 100)
                        const sessionMeta = {
                            user: { uid: 'momei-user' },
                            event: 100,
                            req_params: {
                                text,
                                speaker,
                                model: model === 'seed-tts-2.0' ? 'seed-tts-2.0-expressive' : undefined,
                                audio_params: {
                                    format: 'mp3',
                                    sample_rate: 24000,
                                },
                            },
                        }
                        ws.send(buildVolcFrame(1, 4, 100, sessionMeta))
                    } else if (eventNum === 352) {
                        // Audio Response (352)
                        controller.enqueue(new Uint8Array(payload))
                    } else if (eventNum === 152) {
                        // Session Finished (152)
                        logger.debug(`[VolcengineTTS] Session finished.`)
                        ws.send(buildVolcFrame(1, 4, 2, {})) // FinishConnection (2)
                        ws.close()
                        controller.close()
                    } else if (frame.messageType === 0xF) {
                        // Error (Message Type 0xF)
                        const errorMsg = payload.toString()
                        logger.error(`[VolcengineTTS] Error from server: ${errorMsg}`)
                        controller.error(new Error(`Volcengine TTS Error: ${errorMsg}`))
                        ws.close()
                    }
                }

                ws.onerror = (err: any) => {
                    logger.error(`[VolcengineTTS] WebSocket error:`, err)
                    controller.error(err)
                }

                ws.onclose = () => {
                    logger.debug(`[VolcengineTTS] WebSocket closed.`)
                }
            },
        })
    }

    async check(): Promise<boolean> {
        return !!(this.config.appId && this.config.accessKey)
    }
}

