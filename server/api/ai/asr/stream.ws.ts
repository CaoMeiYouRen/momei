import { defineWebSocketHandler } from 'h3'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import { requireAdminOrAuthor } from '~/server/utils/permission'
import logger from '~/server/utils/logger'

/**
 * 火山引擎 ASR V3 协议帧构建
 * 每个消息都必须包含一个 8 字节的二进制 head
 */
function buildVolcengineFrame(type: number, sequence: number, payload: Buffer | string) {
    const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload
    const header = Buffer.alloc(8)

    header.writeUInt8(0x01, 0)
    header.writeUInt8(type, 1)
    header.writeUInt8(sequence, 2)
    header.writeUInt8(0x00, 3)
    header.writeUInt32BE(payloadBuffer.length, 4)

    return Buffer.concat([header, payloadBuffer])
}

export default defineWebSocketHandler({
    async open(peer) {
        try {
            const event = (peer as any).event
            if (!event) {
                throw new Error('H3Event not found on peer')
            }
            await requireAdminOrAuthor(event)
            logger.info(`[ASR-WS] Peer connected: ${peer.id}`)
        } catch (e) {
            logger.error(`[ASR-WS] Unauthorized WS connection attempt: ${peer.id}`, e)
            peer.close(4001, 'Unauthorized')
        }
    },

    async message(peer, message) {
        // 心跳处理
        if (message.text() === 'ping') {
            peer.send('pong')
            return
        }

        try {
            const data = JSON.parse(message.text())
            // 客户端请求开始会话
            if (data.type === 'start') {
                await startVolcengineSession(peer)
            }
            // 客户端发送音频分片 (Base64)
            if (data.type === 'audio' && (peer as any).volcClient) {
                const audioBuffer = Buffer.from(data.payload, 'base64')
                const sequenceNum = ((peer as any).audioSeq || 1) + 1;
                (peer as any).audioSeq = sequenceNum

                const frame = buildVolcengineFrame(2, sequenceNum, audioBuffer)
                const vClient = (peer as any).volcClient as WebSocket
                if (vClient.readyState === 1) { // 1 = OPEN
                    vClient.send(frame)
                }
            }
            // 客户端请求结束
            if (data.type === 'stop' && (peer as any).volcClient) {
                const sequenceNum = ((peer as any).audioSeq || 1) + 1
                const frame = buildVolcengineFrame(2, -sequenceNum, Buffer.alloc(0)) // 负值表示结束
                const vClient = (peer as any).volcClient as WebSocket
                if (vClient.readyState === 1) { // 1 = OPEN
                    vClient.send(frame)
                }
            }
        } catch (err) {
            // Ignore non-json or malformed messages
            logger.warn(`[ASR-WS] Message processing error:`, err)
        }
    },

    async close(peer) {
        if ((peer as any).volcClient) {
            (peer as any).volcClient.close()
        }
        await Promise.resolve()
        logger.info(`[ASR-WS] Peer disconnected: ${peer.id}`)
    },
})

async function startVolcengineSession(peer: any) {
    const settings = await getSettings([
        SettingKey.ASR_VOLCENGINE_APP_ID,
        SettingKey.ASR_VOLCENGINE_ACCESS_KEY,
        SettingKey.ASR_VOLCENGINE_SECRET_KEY,
    ])

    const appId = settings[SettingKey.ASR_VOLCENGINE_APP_ID]
    const token = settings[SettingKey.ASR_VOLCENGINE_ACCESS_KEY]

    if (!appId) {
        peer.send(JSON.stringify({ type: 'error', message: 'ASR configuration missing' }))
        return
    }

    const url = 'wss://openspeech.bytedance.com/api/v3/asr'

    try {
        // 使用原生 WebSocket (globalThis.WebSocket)
        // 注意：Node.js 原生 WebSocket 支持 headers 选项 (经由 undici)
        const vClient = new (globalThis.WebSocket as any)(url, {
            headers: {
                'X-Api-App-Key': appId,
                'X-Api-Access-Key': token || 'bearer_token',
            },
        })

        vClient.binaryType = 'arraybuffer'
        peer.volcClient = vClient
        peer.audioSeq = 1

        vClient.onopen = () => {
            // 发送初始化帧 (JSON)
            const config = {
                app: { appid: appId, cluster: 'volcengine_streaming_common', token: token || 'bearer_token' },
                user: { uid: 'momei_user' },
                audio: { format: 'wav', codec: 'pcm', rate: 16000, bits: 16, channel: 1 },
                request: { reqid: peer.id, workflow: 'audio_asr', show_utterance: true },
            }
            vClient.send(buildVolcengineFrame(1, 1, JSON.stringify(config)))
            peer.send(JSON.stringify({ type: 'started' }))
        }

        vClient.onmessage = (event: MessageEvent) => {
            const data = Buffer.from(event.data as ArrayBuffer)
            if (data.length < 8) {
                return
            }
            const typeHeader = data.readUInt8(1)
            const payload = data.subarray(8).toString()

            if (typeHeader === 1) { // JSON Response
                try {
                    const res = JSON.parse(payload)
                    peer.send(JSON.stringify({
                        type: 'transcript',
                        text: res.result?.[0]?.text || '',
                        isFinal: res.is_final,
                    }))
                } catch (parseError) {
                    logger.error(`[ASR-WS] JSON Parse Error:`, parseError)
                }
            } else if (typeHeader === 15) { // Error
                peer.send(JSON.stringify({ type: 'error', message: payload }))
            }
        }

        vClient.onerror = (err: any) => {
            peer.send(JSON.stringify({ type: 'error', message: err.message || 'Unknown WebSocket Error' }))
        }

        vClient.onclose = () => {
            logger.debug('[ASR-WS] Volcengine connection closed')
        }

    } catch (error: any) {
        peer.send(JSON.stringify({ type: 'error', message: error.message }))
    }
}

