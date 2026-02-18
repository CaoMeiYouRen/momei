import logger from '../logger'
import type { AIProvider, TranscribeOptions, TranscribeResponse } from '@/types/ai'

export interface VolcengineASRConfig {
    appId: string
    token: string
    cluster?: string
}

export class VolcengineASRProvider implements Partial<AIProvider> {
    name = 'volcengine'
    private config: VolcengineASRConfig

    constructor(config: VolcengineASRConfig) {
        this.config = {
            cluster: 'volc_auc_common',
            ...config,
        }
    }

    async transcribe(options: TranscribeOptions): Promise<TranscribeResponse> {
        // 实际上这应该是一个 WebSocket 实现，这里提供一个简化的 HTTPS 轮询或单次上传逻辑
        // 如果是 V3 版，通常推荐使用官方 SDK。这里实现一个符合接口声明的占位或轻量逻辑
        logger.info(`[VolcengineASR] Transcribing with appId: ${this.config.appId}`)

        // 模拟返回
        return {
            text: 'Volcengine ASR 暂时仅支持通过 WebSocket 实时流式传输或官方 SDK。',
            language: 'zh-CN',
            duration: 0,
            confidence: 1,
            usage: { audioSeconds: 0 },
        }
    }

    async check(): Promise<boolean> {
        return !!(this.config.appId && this.config.token)
    }
}

/**
 * 原有的 ASRService 逻辑，用于辅助构建 WebSocket 消息
 */
export class VolcengineASRService {
    /**
     * 构建 V3 下发的消息包
     */
    static buildStartMessage(appId: string, userId: string, config: any = {}) {
        return {
            app: {
                appid: appId,
                token: config.token || 'access_token',
                cluster: config.cluster || 'volc_auc_common',
            },
            user: {
                uid: userId,
            },
            audio: {
                format: config.format || 'webm',
                codec: config.codec || 'opus',
                rate: config.rate || 16000,
                bits: config.bits || 16,
                channel: config.channel || 1,
            },
            request: {
                workflow: 'asr',
                result_type: 'full',
                show_utterance: true,
            },
        }
    }

    static buildBinaryFrame(chunk: Buffer, sequence: number) {
        const header = Buffer.alloc(8)
        header.writeUInt8(0x11, 0)
        header.writeUInt8(0x10, 2)
        header.writeUInt8(0x01, 3)
        header.writeInt32BE(sequence, 4)
        return Buffer.concat([header, chunk])
    }
}
