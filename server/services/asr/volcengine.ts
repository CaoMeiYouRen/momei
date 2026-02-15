export interface VolcengineConfig {
    appId: string
    accessKey: string
    secretKey: string
}

export class VolcengineASRService {
    static generateSignature(config: VolcengineConfig) {
        // Volcengine V3 ASR 鉴权逻辑 (简化版实现)
        // 参考: https://www.volcengine.com/docs/6561/109033

        // 实际上 V3 WS 接口可以使用更简单的 appid + token 验证，
        // 或者使用基于 HMAC-SHA256 的授权请求头。
        // 这里提供一个生成授权头/Query 的辅助方法

        // 注意：由于 Volcengine SDK 内部逻辑较为复杂，
        // 如果无法引入 SDK，通常建议使用其提供的鉴权脚本。

        return {
            Authorization: `HMAC-SHA256 Credential=${config.accessKey}/...`,
        }
    }

    /**
     * 构建 V3 下发的消息包
     */
    static buildStartMessage(appId: string, userId: string, config: any = {}) {
        return {
            app: {
                appid: appId,
                token: 'access_token', // 如果使用 AccessKey/SecretKey 鉴权，通常这里可以留空或填任意值，主要靠 Header
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
                result_type: 'full', // 'full' 或 'single'
                show_utterance: true,
            },
        }
    }

    /**
     * 处理二进制音频帧
     * Volcengine V3 要求：
     * - Header: 4 bytes (1 byte: version, 1 byte: header size, 1 byte: message type, 1 byte: msg_serialization_methods)
     * - Sequence: 4 bytes
     * - Payload: binary data
     */
    static buildBinaryFrame(chunk: Buffer, sequence: number) {
        const header = Buffer.alloc(8)
        header.writeUInt8(0x11, 0) // version: 1, header size: 1
        header.writeUInt8(0x10, 2) // message type: Audio Data (0x1) | Full response (0x0) -> 0x10 is simplified
        header.writeUInt8(0x01, 3) // serialization: JSON
        header.writeInt32BE(sequence, 4) // sequence

        return Buffer.concat([header, chunk])
    }
}
