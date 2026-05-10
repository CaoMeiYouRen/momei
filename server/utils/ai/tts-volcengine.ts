import crypto from 'node:crypto'
import { createError } from 'h3'
import WebSocket from 'ws'
import logger from '../logger'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    buildVolcengineConnectionClientRequestFrame,
    buildVolcengineEventClientRequestFrame,
    createVolcengineAuthHeaders,
    parseVolcengineErrorPacket,
    parseVolcengineEventPacket,
} from './volcengine-protocol'
import { generateVolcengineWebSocketSpeech } from './tts-volcengine-websocket'
import type { TTSAudioVoice, TTSOptions, AIProvider, TTSVoiceQuery } from '@/types/ai'
import { splitAndNormalizeStringList } from '@/utils/shared/string-list'

export interface VolcengineTTSConfig {
    appId: string
    accessKey: string // 即 Access Token
    secretKey?: string // 目前 V3 接口主要使用 Access Token
    defaultModel?: string
}

/**
 * 火山引擎 (豆包) 语音合成提供者
 * 适配 豆包语音合成模型 2.0 (Seed-TTS)
 * 采用 V3 HTTP 单向流式接口
 */
export class VolcengineTTSProvider implements Partial<AIProvider> {
    name = 'volcengine'
    private static readonly PODCAST_APP_KEY = 'aGjiRDfUWi'

    // 豆包语音合成模型 2.0 (Seed-TTS) 音色列表
    availableVoices: TTSAudioVoice[] = [
        { id: 'zh_female_vv_uranus_bigtts', name: 'Vivi 2.0', language: 'zh', gender: 'female' },
        { id: 'zh_female_xiaohe_uranus_bigtts', name: '小何 2.0', language: 'zh', gender: 'female' },
        { id: 'zh_male_m191_uranus_bigtts', name: '云舟 2.0', language: 'zh', gender: 'male' },
        { id: 'zh_male_taocheng_uranus_bigtts', name: '小天 2.0', language: 'zh', gender: 'male' },
        { id: 'zh_female_xueayi_saturn_bigtts', name: '儿童绘本', language: 'zh', gender: 'female' },
        { id: 'zh_male_dayi_saturn_bigtts', name: '大壹', language: 'zh', gender: 'male' },
        { id: 'zh_female_mizai_saturn_bigtts', name: '黑猫侦探社咪', language: 'zh', gender: 'female' },
        { id: 'zh_female_jitangnv_saturn_bigtts', name: '鸡汤女', language: 'zh', gender: 'female' },
        { id: 'zh_female_meilinvyou_saturn_bigtts', name: '魅力女友', language: 'zh', gender: 'female' },
        { id: 'zh_female_santongyongns_saturn_bigtts', name: '流畅女声', language: 'zh', gender: 'female' },
        { id: 'zh_male_ruyayichen_saturn_bigtts', name: '儒雅逸辰', language: 'zh', gender: 'male' },
        { id: 'saturn_zh_female_keainvsheng_tob', name: '可爱女生', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_female_tiaopigongzhu_tob', name: '调皮公主', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_male_shuanglangshaonian_tob', name: '爽朗少年', language: 'zh', gender: 'male' },
        { id: 'saturn_zh_male_tiancaitongzhuo_tob', name: '天才同桌', language: 'zh', gender: 'male' },
        { id: 'saturn_zh_female_cancan_tob', name: '知性灿灿', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_female_qingyingduoduo_cs_tob', name: '轻盈朵朵 2.0', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_female_wenwanshanshan_cs_tob', name: '温婉珊珊 2.0', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_female_reqingaina_cs_tob', name: '热情艾娜 2.0', language: 'zh', gender: 'female' },
        { id: 'saturn_zh_female_cancan_mars_bigtts', name: '灿灿 (Mars)', language: 'zh', gender: 'female' },
        { id: 'en_male_tim_uranus_bigtts', name: 'Tim', language: 'en', gender: 'male' },
        { id: 'en_female_dacey_uranus_bigtts', name: 'Dacey', language: 'en', gender: 'female' },
        { id: 'en_female_stokie_uranus_bigtts', name: 'Stokie', language: 'en', gender: 'female' },
    ]

    podcastVoices: TTSAudioVoice[] = [
        {
            id: 'zh_male_dayixiansheng_v2_saturn_bigtts,zh_female_mizaitongxue_v2_saturn_bigtts',
            name: '大壹先生 + 咪仔同学',
            language: 'zh',
            gender: 'neutral',
            mode: 'podcast',
        },
        {
            id: 'zh_male_liufei_v2_saturn_bigtts,zh_male_xiaolei_v2_saturn_bigtts',
            name: '刘飞 + 潇磊',
            language: 'zh',
            gender: 'neutral',
            mode: 'podcast',
        },
    ]

    private config: VolcengineTTSConfig

    constructor(config: VolcengineTTSConfig) {
        this.config = {
            ...config,
        }
    }

    get model() {
        return this.config.defaultModel || 'seed-tts-2.0'
    }

    getVoices(query: TTSVoiceQuery = {}): Promise<TTSAudioVoice[]> {
        if (query.mode === 'podcast') {
            return Promise.resolve(this.podcastVoices)
        }
        return Promise.resolve(this.availableVoices)
    }

    estimateTTSCost(text: string, _voice: string | string[]): Promise<number> {
        void _voice
        // 豆包 2.0 价格大约 0.05 / 1k 字符 (仅供参考，具体以官网为准)
        return Promise.resolve((text.length / 1000) * 0.05)
    }

    generateSpeech(
        text: string,
        voice: string | string[],
        options: TTSOptions,
    ): Promise<ReadableStream<Uint8Array>> {
        if (options.mode === 'podcast') {
            return Promise.resolve().then(() => this.generatePodcastSpeech(text, voice, options))
        }
        return Promise.resolve().then(() => this.generateWebSocketSpeech(text, voice, options))
    }

    private generateWebSocketSpeech(
        text: string,
        voice: string | string[],
        options: TTSOptions,
    ): ReadableStream<Uint8Array> {
        return generateVolcengineWebSocketSpeech({
            config: this.config,
            text,
            voice,
            options,
        })
    }

    private resolvePodcastSpeakers(voice: string | string[]) {
        if (Array.isArray(voice) && voice.length >= 2) {
            return [voice[0], voice[1]].filter(Boolean) as string[]
        }

        if (typeof voice === 'string' && voice.includes(',')) {
            const speakers = splitAndNormalizeStringList(voice, {
                delimiters: ',',
            })
            if (speakers.length >= 2) {
                return [speakers[0], speakers[1]]
            }
        }

        return [
            'zh_male_dayixiansheng_v2_saturn_bigtts',
            'zh_female_mizaitongxue_v2_saturn_bigtts',
        ]
    }

    private generatePodcastSpeech(
        text: string,
        voice: string | string[],
        options: TTSOptions,
    ): ReadableStream<Uint8Array> {
        const appId = this.config.appId
        const token = this.config.accessKey

        if (!appId || !token) {
            throw createError({
                statusCode: 500,
                message: 'Volcengine Podcast Error: AppID or Access Token missing',
            })
        }

        const endpoint = 'wss://openspeech.bytedance.com/api/v3/sami/podcasttts'
        const resourceId = 'volc.service_type.10050'
        const sessionId = crypto.randomUUID()
        const requestId = crypto.randomUUID()
        const speakers = this.resolvePodcastSpeakers(voice)
        const outputFormat = options.outputFormat === 'ogg' ? 'ogg_opus' : (options.outputFormat || 'mp3')

        const startPayload: Record<string, any> = {
            input_id: sessionId,
            input_text: text,
            action: 0,
            use_head_music: false,
            use_tail_music: false,
            audio_config: {
                format: outputFormat,
                sample_rate: options.sampleRate || 24000,
                speech_rate: 0,
            },
            speaker_info: {
                random_order: true,
                speakers,
            },
            aigc_watermark: false,
        }

        const startFrame = buildVolcengineEventClientRequestFrame({
            event: 100,
            sessionId,
            payload: startPayload,
            messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
            messageTypeFlags: 0b0100,
            compression: VOLCENGINE_COMPRESSION.none,
        })

        const finishConnectionFrame = buildVolcengineConnectionClientRequestFrame({
            event: 2,
            payload: {},
            messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
            messageTypeFlags: 0b0100,
            compression: VOLCENGINE_COMPRESSION.none,
        })

        const ws = new WebSocket(endpoint, {
            headers: createVolcengineAuthHeaders({
                appId,
                // 播客 API 的 appKey 固定为 'aGjiRDfUWi'，与 TTS 接口不同
                appKey: VolcengineTTSProvider.PODCAST_APP_KEY,
                accessKey: token,
                resourceId,
                requestId,
            }),
        })

        logger.info(`[VolcengineTTS] Starting Podcast WS generation. Session: ${sessionId}`)

        let settled = false
        let wsOpened = false

        return new ReadableStream<Uint8Array>({
            start(controller) {
                ws.on('upgrade', (res) => {
                    const logId = res.headers['x-tt-logid']
                    if (logId) {
                        logger.info(`[VolcengineTTS] Podcast WS connected, X-Tt-Logid=${String(logId)}`)
                    }
                })

                ws.on('open', () => {
                    wsOpened = true
                    ws.send(startFrame)
                })

                ws.on('message', (rawData: WebSocket.RawData) => {
                    const messageBuffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData as ArrayBuffer)

                    const errorPacket = parseVolcengineErrorPacket(messageBuffer)
                    if (errorPacket) {
                        settled = true
                        controller.error(createError({
                            statusCode: 502,
                            message: `Volcengine Podcast Error(${errorPacket.code}): ${errorPacket.message}`,
                        }))
                        try {
                            ws.close()
                        } catch {
                            // ignore
                        }
                        return
                    }

                    const packet = parseVolcengineEventPacket(messageBuffer)
                    if (!packet) {
                        return
                    }

                    if (packet.event === 361) {
                        if (Buffer.isBuffer(packet.payload) && packet.payload.length > 0) {
                            controller.enqueue(new Uint8Array(packet.payload))
                            return
                        }

                        if (typeof packet.payload === 'string') {
                            try {
                                const binary = Buffer.from(packet.payload, 'base64')
                                if (binary.length > 0) {
                                    controller.enqueue(new Uint8Array(binary))
                                }
                            } catch {
                                // ignore invalid payload
                            }
                            return
                        }

                        if (packet.payload && typeof packet.payload === 'object') {
                            const objectPayload = packet.payload as Record<string, any>
                            let audioBase64 = ''
                            if (typeof objectPayload.data === 'string') {
                                audioBase64 = objectPayload.data
                            } else if (typeof objectPayload.audio === 'string') {
                                audioBase64 = objectPayload.audio
                            }
                            if (audioBase64) {
                                const binary = Buffer.from(audioBase64, 'base64')
                                if (binary.length > 0) {
                                    controller.enqueue(new Uint8Array(binary))
                                }
                            }
                        }
                        return
                    }

                    if (packet.event === 362 && packet.payload && typeof packet.payload === 'object') {
                        const payloadObj = packet.payload as Record<string, any>
                        if (payloadObj.is_error === true) {
                            settled = true
                            controller.error(createError({
                                statusCode: 502,
                                message: payloadObj.error_msg || 'Volcengine Podcast round error',
                            }))
                            try {
                                ws.close()
                            } catch {
                                // ignore
                            }
                            return
                        }
                    }

                    if (packet.event === 363 && packet.payload && typeof packet.payload === 'object') {
                        const payloadObj = packet.payload as Record<string, any>
                        const audioUrl = payloadObj?.meta_info?.audio_url
                        if (audioUrl) {
                            logger.info(`[VolcengineTTS] Podcast generated audio_url: ${String(audioUrl)}`)
                        }
                        return
                    }

                    if (packet.event === 154 && packet.payload && typeof packet.payload === 'object') {
                        const payloadObj = packet.payload as Record<string, any>
                        logger.info(`[VolcengineTTS] Podcast usage: ${JSON.stringify(payloadObj.usage || payloadObj)}`)
                        return
                    }

                    if (packet.event === 152) {
                        settled = true
                        try {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(finishConnectionFrame)
                            }
                        } catch {
                            // ignore
                        }
                        try {
                            controller.close()
                        } catch {
                            // ignore
                        }
                        try {
                            ws.close()
                        } catch {
                            // ignore
                        }
                    }
                })

                ws.on('error', (error) => {
                    if (settled) {
                        return
                    }
                    settled = true
                    controller.error(createError({
                        statusCode: 502,
                        message: `Volcengine Podcast websocket error: ${error.message}`,
                    }))
                })

                ws.on('close', () => {
                    if (settled) {
                        return
                    }
                    settled = true
                    if (!wsOpened) {
                        controller.error(createError({
                            statusCode: 502,
                            message: 'Volcengine Podcast connection closed before start',
                        }))
                        return
                    }
                    try {
                        controller.close()
                    } catch {
                        // ignore
                    }
                })
            },
            cancel() {
                try {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(finishConnectionFrame)
                    }
                } catch {
                    // ignore
                }

                try {
                    ws.close()
                } catch {
                    // ignore
                }
            },
        })
    }

    check(): Promise<boolean> {
        return Promise.resolve(!!(this.config.appId && this.config.accessKey))
    }
}

