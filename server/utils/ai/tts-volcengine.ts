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
function buildVolcFrame(type: number, flags: number, event: number, payload: any, sessionId?: string) {
    const buffers: Buffer[] = []

    // Header (4B)
    const header = Buffer.alloc(4)
    header[0] = 0x11 // v1, head_size 4
    header[1] = (type << 4) | flags
    header[2] = 0x10 // serialization JSON
    header[3] = 0x00
    buffers.push(header)

    if (flags & 0x04) {
        // WithEvent
        const eventBuf = Buffer.alloc(4)
        eventBuf.writeUInt32BE(event, 0)
        buffers.push(eventBuf)

        const sid = sessionId || ''
        const sidBuf = Buffer.from(sid, 'utf8')
        const sidLen = Buffer.alloc(4)
        sidLen.writeUInt32BE(sidBuf.length, 0)
        buffers.push(sidLen, sidBuf)
    }

    let payloadBuf: Buffer
    if (Buffer.isBuffer(payload)) {
        payloadBuf = payload
    } else if (typeof payload === 'string') {
        payloadBuf = Buffer.from(payload, 'utf8')
    } else {
        payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8')
    }

    const pLen = Buffer.alloc(4)
    pLen.writeUInt32BE(payloadBuf.length, 0)
    buffers.push(pLen, payloadBuf)

    return Buffer.concat(buffers)
}

/**
 * 解析火山引擎 V3 协议帧 (TTS)
 */
function parseVolcFrame(buffer: Buffer) {
    if (buffer.length < 4) {
        return null
    }
    const type = (buffer.readUInt8(1) >> 4) & 0x0F
    const flags = buffer.readUInt8(1) & 0x0F

    let offset = 4
    let event: number | undefined
    let sessionId: string | undefined

    if (flags & 0x04) {
        if (buffer.length < offset + 4) {
            return null
        }
        event = buffer.readUInt32BE(offset)
        offset += 4

        if (buffer.length < offset + 4) {
            return null
        }
        const sidLen = buffer.readUInt32BE(offset)
        offset += 4

        if (buffer.length < offset + sidLen) {
            return null
        }
        sessionId = buffer.subarray(offset, offset + sidLen).toString()
        offset += sidLen
    }

    if (buffer.length < offset + 4) {
        return null
    }
    const payloadLen = buffer.readUInt32BE(offset)
    offset += 4

    if (buffer.length < offset + payloadLen) {
        return null
    }
    const payload = buffer.subarray(offset, offset + payloadLen)

    return { type, event, sessionId, payload }
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

        let speaker = 'zh_female_shuangkuaisisi_moon_bigtts'
        if (Array.isArray(voice) && voice.length > 0) {
            const v = voice[0]
            if (v) {
                speaker = v
            }
        } else if (typeof voice === 'string' && voice) {
            speaker = voice
        }

        const sessionId = crypto.randomUUID()
        const model = this.config.defaultModel || 'seed-tts-2.0'

        // 确定 Resource ID
        let resourceId = this.config.defaultModel || ''
        if (!resourceId || resourceId === 'seed-tts-2.0') {
            if (speaker.startsWith('S_')) {
                resourceId = 'volc.megatts.default'
            } else {
                resourceId = 'volc.service_type.10029'
            }
        }

        return new ReadableStream({
            async start(controller) {
                const url = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection'

                try {
                    const ws = new (globalThis.WebSocket as any)(url, {
                        headers: {
                            'X-Api-App-Key': appId,
                            'X-Api-Access-Key': token,
                            'X-Api-Resource-Id': resourceId,
                            'X-Api-Connect-Id': crypto.randomUUID(),
                        },
                    })

                    ws.binaryType = 'arraybuffer'

                    // 公共请求模板
                    const requestTemplate = {
                        user: { uid: crypto.randomUUID() },
                        req_params: {
                            speaker,
                            audio_params: {
                                format: 'mp3',
                                sample_rate: 24000,
                            },
                        },
                    }

                    ws.onopen = () => {
                        logger.debug(`[VolcengineTTS] WebSocket connected. Resource: ${resourceId}`)
                        // 1. 发送 StartConnection (Event 1)
                        ws.send(buildVolcFrame(1, 4, 1, {}))
                    }

                    ws.onmessage = (event: MessageEvent) => {
                        const buffer = Buffer.from(event.data as ArrayBuffer)
                        const frame = parseVolcFrame(buffer)
                        if (!frame) { return }

                        const { type, event: eventNum, payload } = frame

                        // Type 0xB (11) is AudioOnlyServer
                        if (type === 11) {
                            controller.enqueue(new Uint8Array(payload))
                            return
                        }

                        // Type 0xF (15) is Error
                        if (type === 15) {
                            const errorMsg = payload.toString()
                            logger.error(`[VolcengineTTS] Error from server (Type 15): ${errorMsg}`)
                            controller.error(new Error(`Volcengine TTS Error: ${errorMsg}`))
                            ws.close()
                            return
                        }

                        // ConnectionStarted (50)
                        if (eventNum === 50) {
                            // 2. 发送 StartSession (Event 100)
                            ws.send(buildVolcFrame(1, 4, 100, {
                                ...requestTemplate,
                                event: 100,
                            }, sessionId))
                        } else if (eventNum === 150) {
                            // SessionStarted (150)
                            // 3. 发送 TaskRequest (Event 200)
                            ws.send(buildVolcFrame(1, 4, 200, {
                                ...requestTemplate,
                                req_params: {
                                    ...requestTemplate.req_params,
                                    text,
                                },
                                event: 200,
                            }, sessionId))
                            // 4. 紧接着发送 FinishSession (Event 102)
                            ws.send(buildVolcFrame(1, 4, 102, {}, sessionId))
                        } else if (eventNum === 152) {
                            // SessionFinished (152)
                            logger.debug(`[VolcengineTTS] Session finished.`)
                            // 5. 发送 FinishConnection (Event 2)
                            ws.send(buildVolcFrame(1, 4, 2, {}))
                        } else if (eventNum === 52) {
                            // ConnectionFinished (52)
                            logger.debug(`[VolcengineTTS] Connection finished.`)
                            ws.close()
                            controller.close()
                        } else if (eventNum === 153 || eventNum === 51) {
                            // SessionFailed (153) or ConnectionFailed (51)
                            const errorMsg = payload.toString()
                            logger.error(`[VolcengineTTS] Failed (Event ${eventNum}): ${errorMsg}`)
                            controller.error(new Error(`Volcengine failed: ${errorMsg}`))
                            ws.close()
                        }
                    }

                    ws.onerror = (err: any) => {
                        logger.error(`[VolcengineTTS] WebSocket error:`, err)
                    }
                } catch (e) {
                    controller.error(e)
                }
            },
        })
    }

    async check(): Promise<boolean> {
        return !!(this.config.appId && this.config.accessKey)
    }
}

