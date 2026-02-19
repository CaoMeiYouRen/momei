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
        { id: 'saturn_zh_female_cancan_mars_bigtts', name: '灿灿 (Mars)', language: 'zh', gender: 'female' },
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
        void _voice
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

        const resourceId = options.model || this.config.defaultModel || 'seed-tts-2.0'
        const url = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'

        // 语速变换：取值范围[-50,100]，100代表2.0倍速，-50代表0.5倍速
        const speed = options.speed || 1.0
        let speechRate = 0
        if (speed >= 1) {
            speechRate = Math.min(100, Math.round((speed - 1) * 100))
        } else {
            speechRate = Math.max(-50, Math.round((speed - 1) * 100))
        }

        // 音量变换：取值范围[-50,100]，100代表2.0倍音量，-50代表0.5倍音量
        const volume = options.volume || 1.0
        let loudnessRate = 0
        if (volume >= 1) {
            loudnessRate = Math.min(100, Math.round((volume - 1) * 100))
        } else {
            loudnessRate = Math.max(-50, Math.round((volume - 1) * 100))
        }

        const additions: any = {
            explicit_language: options.language || 'zh',
            disable_markdown_filter: true,
        }

        // 如果设置了音调
        if (options.pitch !== undefined) {
            additions.post_process = {
                pitch: Math.max(-12, Math.min(12, Math.round(options.pitch))),
            }
        }

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
                req_params: {
                    text,
                    speaker,
                    model: options.model || (speaker.startsWith('saturn_') ? 'seed-tts-2.0-expressive' : undefined),
                    audio_params: {
                        format: options.outputFormat || 'mp3',
                        sample_rate: options.sampleRate || 24000,
                        speech_rate: speechRate,
                        loudness_rate: loudnessRate,
                    },
                    additions: JSON.stringify(additions),
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
            const cleanLine = line.replace(/^data:\s*/, '').trim()
            if (!cleanLine) {
                return false
            }
            try {
                const json = JSON.parse(cleanLine)

                // 处理音频数据 (即使是完成包，有时也可能带数据)
                if (json.data) {
                    const binary = Buffer.from(json.data, 'base64')
                    controller.enqueue(new Uint8Array(binary))
                }

                // 20000000 表示正常完成
                if (json.code === 20000000) {
                    if (json.usage) {
                        logger.debug(`[VolcengineTTS] Synthesis finished. Usage:`, json.usage)
                    }
                    return true // 标记完成
                }

                // 非 0 且非 20000000 的 code 视为错误
                if (json.code !== 0) {
                    const errorMsg = `Volcengine TTS Stream Error: ${json.message || 'Unknown error'} (code: ${json.code}, LogID: ${logId})`
                    logger.error(`[VolcengineTTS] Error payload:`, json)

                    // 如果已经有数据了，可能只是中间包报错，尝试继续还是直接报错？
                    // 通常 code != 0 是致命的
                    controller.error(new Error(errorMsg))
                    return true
                }

                return false
            } catch (e) {
                logger.warn(`[VolcengineTTS] Failed to parse line (LogID: ${logId}): ${cleanLine.substring(0, 100)}...`, e)
                return false
            }
        }

        let isFinished = false

        return new ReadableStream({
            async pull(controller) {
                if (isFinished) {
                    return
                }

                try {
                    const { done, value } = await reader.read()

                    if (done) {
                        logger.debug(`[VolcengineTTS] Stream reader done. Remaining buffer length: ${buffer.length}`)
                        if (buffer.trim()) {
                            processLine(buffer, controller)
                        }
                        if (!isFinished) {
                            isFinished = true
                            controller.close()
                        }
                        return
                    }

                    const chunk = decoder.decode(value, { stream: true })
                    buffer += chunk

                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (processLine(line, controller)) {
                            isFinished = true
                            controller.close()
                            await reader.cancel()
                            break
                        }
                    }
                } catch (error) {
                    logger.error(`[VolcengineTTS] Stream read error:`, error)
                    if (!isFinished) {
                        isFinished = true
                        controller.error(error)
                    }
                    await reader.cancel()
                }
            },
            async cancel() {
                isFinished = true
                await reader.cancel()
            },
        })
    }

    check(): Promise<boolean> {
        return Promise.resolve(!!(this.config.appId && this.config.accessKey))
    }
}

