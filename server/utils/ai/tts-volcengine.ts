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
            ...config,
        }
    }

    get model() {
        return this.config.defaultModel || 'seed-tts-2.0'
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

        // --- 逻辑：自动识别模型版本与资源 ID ---
        // 1. 识别音色系列
        const isSaturn = speaker.startsWith('saturn_') // 声音复刻 2.0 (Clone)
        const isUranus = speaker.endsWith('_uranus_bigtts') // 豆包 2.0 (Seed-TTS)
        const isV2 = isSaturn || isUranus

        // 2. 确定 Header: X-Api-Resource-Id (服务资源 ID)
        // 规则：2.0 音色用 seed-tts-2.0, 1.0 音色用 seed-tts-1.0
        const resourceId = isV2 ? 'seed-tts-2.0' : 'seed-tts-1.0'

        // 3. 确定 Body: req_params.model (模型版本)
        let bodyModel = options.model

        // 逻辑：如果 options.model 是通用的 'seed-tts-2.0'、'unknown' 或为空，我们根据音色精细化选择
        if (!bodyModel || bodyModel === 'seed-tts-2.0' || bodyModel === 'unknown') {
            if (isSaturn || isUranus) {
                // 声音复刻 2.0 必须使用 seed-tts-2.0-expressive
                bodyModel = 'seed-tts-2.0-expressive'
            } else {
                // 1.0 版音色统一使用 1.1 提高质量
                bodyModel = 'seed-tts-1.1'
            }
        }
        logger.debug(`[VolcengineTTS] Resource ID: ${resourceId}, Final Body Model: ${bodyModel}`)

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
            enable_timestamp: true,
        }

        // 如果设置了音调
        if (options.pitch !== undefined) {
            additions.post_process = {
                pitch: Math.max(-12, Math.min(12, Math.round(options.pitch))),
            }
        }
        logger.debug(`[VolcengineTTS] Request payload prepared. Speaker: ${speaker}, Model: ${bodyModel}, Speech Rate: ${speechRate}, Loudness Rate: ${loudnessRate}, Additions: ${JSON.stringify(additions)}`)

        // 设置 30 秒连接并响应头部超时
        const controller_abort = new AbortController()
        const timeoutId = setTimeout(() => controller_abort.abort(), 30000)

        const response = await fetch(url, {
            method: 'POST',
            signal: controller_abort.signal,
            headers: {
                'X-Api-App-Id': appId,
                'X-Api-Access-Key': token,
                'X-Api-Resource-Id': resourceId,
                'X-Api-Request-Id': crypto.randomUUID(),
                'X-Control-Require-Usage-Tokens-Return': '*',
                'Content-Type': 'application/json',
                Connection: 'keep-alive',
            },
            body: JSON.stringify({
                user: { uid: crypto.randomUUID() },
                req_params: {
                    text,
                    speaker,
                    audio_params: {
                        format: options.outputFormat || 'mp3',
                        sample_rate: options.sampleRate || 24000,
                        speech_rate: speechRate,
                        loudness_rate: loudnessRate,
                        enable_timestamp: true,
                    },
                    additions: JSON.stringify(additions),
                },
            }),
        }).finally(() => clearTimeout(timeoutId))

        const logId = response.headers.get('X-Tt-Logid')
        if (!response.ok) {
            const errorText = await response.text()
            logger.error(`[VolcengineTTS] HTTP request failed (LogID: ${logId}): ${response.status}`, errorText)
            throw createError({
                statusCode: response.status,
                statusMessage: `Volcengine TTS Request Failed: ${errorText}`,
            })
        }
        logger.debug(`[VolcengineTTS] HTTP request successful. Status: ${response.status}, LogID: ${logId}`)

        const fetchReader = response.body?.getReader()
        if (!fetchReader) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to access response body' })
        }

        const processLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
            const rawLine = line.trim()
            if (!rawLine) {
                return 'continue'
            }

            try {
                const json = JSON.parse(rawLine)

                // 处理音频数据
                if (json.code === 0 && json.data) {
                    const binary = Buffer.from(json.data, 'base64')
                    if (binary.length > 0) {
                        controller.enqueue(new Uint8Array(binary))
                    }
                    return 'continue'
                }

                // 合成完成 (20000000 是成功结束码)
                if (json.code === 20000000) {
                    if (json.usage) {
                        logger.info(`[VolcengineTTS] Synthesis finished (LogID: ${logId}). Usage tokens: ${json.usage.tokens_total || json.usage.tokens}`)
                    }
                    return 'finish'
                }

                // 错误响应 (code > 0 且不等于 20000000)
                if (json.code > 0) {
                    const errorMsg = `Volcengine TTS Stream Error: ${json.message || 'Unknown error'} (code: ${json.code}, LogID: ${logId})`
                    logger.error(`[VolcengineTTS] ${errorMsg}`, json)
                    return 'error'
                }

                return 'continue'
            } catch (e) {
                // 如果解析失败，可能是因为行内容非 JSON，但在 V3 接口中通常应该都是 JSON
                logger.error(`[VolcengineTTS] JSON parse error (LogID: ${logId}). Content highlight: ${rawLine.substring(0, 100)}`, e)
                return 'continue'
            }
        }

        let isFinished = false
        const decoder = new TextDecoder()
        let leftover = ''

        return new ReadableStream({
            async pull(controller) {
                if (isFinished) {
                    return
                }

                try {
                    const { done, value } = await fetchReader.read()

                    if (done) {
                        // 处理流结束后的最后一部分
                        const remaining = decoder.decode()
                        const finalData = leftover + remaining
                        if (finalData.trim()) {
                            processLine(finalData, controller)
                        }

                        if (!isFinished) {
                            logger.info(`[VolcengineTTS] Stream completed (LogID: ${logId})`)
                            isFinished = true
                            controller.close()
                        }
                        return
                    }

                    const chunk = decoder.decode(value, { stream: true })
                    const data = leftover + chunk
                    const lines = data.split('\n')
                    leftover = lines.pop() || ''

                    for (const line of lines) {
                        const status = processLine(line, controller)
                        if (status === 'finish' || status === 'error') {
                            isFinished = true
                            // 即使结束了也不要立即 break，因为后面的行可能包含 usage 等信息
                            // 但在 V3 中 finish 包通常就是最后一个了
                            break
                        }
                    }

                    if (isFinished) {
                        await fetchReader.cancel().catch(() => { /* ignore */ })
                        try {
                            controller.close()
                        } catch (_) {
                            // Already closed or other error
                        }
                    }
                } catch (error) {
                    logger.error(`[VolcengineTTS] Stream read exception (LogID: ${logId}):`, error)
                    if (!isFinished) {
                        isFinished = true
                        controller.error(error)
                    }
                    await fetchReader.cancel().catch(() => { /* ignore */ })
                }
            },
            cancel() {
                isFinished = true
                fetchReader.cancel().catch(() => { /* ignore */ })
            },
        })

    }

    check(): Promise<boolean> {
        return Promise.resolve(!!(this.config.appId && this.config.accessKey))
    }
}

