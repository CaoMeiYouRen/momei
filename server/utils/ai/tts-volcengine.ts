import crypto from 'node:crypto'
import { createError } from 'h3'
import logger from '../logger'
import type { TTSAudioVoice, TTSOptions, AIProvider } from '@/types/ai'

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
        { id: 'en_male_tim_uranus_bigtts', name: 'Tim', language: 'en', gender: 'male' },
        { id: 'en_female_dacey_uranus_bigtts', name: 'Dacey', language: 'en', gender: 'female' },
        { id: 'en_female_stokie_uranus_bigtts', name: 'Stokie', language: 'en', gender: 'female' },
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
        options: TTSOptions,
    ): Promise<ReadableStream<Uint8Array>> {
        const appId = this.config.appId
        const token = this.config.accessKey
        logger.debug(`[VolcengineTTS] Starting HTTP V3 TTS generation. Text length: ${text.length}, Voice: ${Array.isArray(voice) ? voice.join(',') : voice}`)

        if (!appId || !token) {
            throw createError({
                statusCode: 500,
                message: 'Volcengine TTS Error: AppID or Access Token missing',
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

        const resourceId = this.config.defaultModel || 'seed-tts-2.0'
        const url = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

        // 计算语速变换：V3 范围是 [-50, 100]，0 是正常速度 (1.0x)，100 是 2.0x，-50 是 0.5x
        const speechRate = Math.round(((options.speed || 1.0) - 1.0) * 100)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Api-App-Id': appId,
                'X-Api-Access-Key': token,
                'X-Api-Resource-Id': resourceId,
                'X-Api-Request-Id': crypto.randomUUID(),
                'X-Control-Require-Usage-Tokens-Return': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: { uid: crypto.randomUUID() },
                namespace: 'BidirectionalTTS',
                req_params: {
                    text,
                    speaker,
                    audio_params: {
                        format: options.outputFormat || 'mp3',
                        sample_rate: 24000,
                        speech_rate: speechRate,
                        pitch_rate: options.pitch !== undefined ? Math.round(options.pitch * 10) : 0,
                    },
                },
            }),
        })

        const logId = response.headers.get('X-Tt-Logid')
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            logger.error(`[VolcengineTTS] HTTP Error: ${response.status}, LogID: ${logId}`, errorData)
            throw createError({
                statusCode: response.status,
                message: `Volcengine TTS Error: ${errorData.message || response.statusText} (LogID: ${logId})`,
            })
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw createError({
                statusCode: 500,
                message: `Volcengine TTS Error: Failed to get response stream (LogID: ${logId})`,
            })
        }

        const decoder = new TextDecoder()
        let buffer = ''

        const processLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
            // 处理 SSE 格式 (data: {...}) 或直接 JSON 格式
            line = line.replace(/^data:\s*/, '').trim()
            if (!line) {
                return
            }
            try {
                const json = JSON.parse(line)
                // 豆包 V3 的 code=0 表示成功，code=20000000 表示完成
                if (json.code !== 0 && json.code !== 20000000) {
                    logger.warn(`[VolcengineTTS] Message in stream (LogID: ${logId}): ${json.message} (code: ${json.code})`)
                    // 如果是严重错误（例如欠费、并发超限等），抛出异常
                    if (json.code >= 40402003 || json.code === 45000000 || json.code === 55000000) {
                        controller.error(new Error(`Volcengine TTS Stream Error: ${json.message} (${json.code}, LogID: ${logId})`))
                    }
                    return
                }
                if (json.data) {
                    const binary = Buffer.from(json.data, 'base64')
                    controller.enqueue(new Uint8Array(binary))
                }
            } catch (e) {
                logger.warn(`[VolcengineTTS] Failed to parse line (LogID: ${logId}): ${line.substring(0, 100)}...`, e)
            }
        }

        return new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read()
                    if (done) {
                        if (buffer.trim()) {
                            // 处理最后可能剩余的缓冲区内容
                            processLine(buffer, controller)
                        }
                        controller.close()
                        return
                    }

                    buffer += decoder.decode(value, { stream: true })
                    // 分割行并处理
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // 最后一行可能不完整，保留到下一次

                    for (const line of lines) {
                        processLine(line, controller)
                    }
                } catch (error) {
                    logger.error(`[VolcengineTTS] Stream read error:`, error)
                    controller.error(error)
                    await reader.cancel()
                }
            },
            async cancel() {
                await reader.cancel()
            },
        })
    }

    check(): boolean {
        return !!(this.config.appId && this.config.accessKey)
    }
}

