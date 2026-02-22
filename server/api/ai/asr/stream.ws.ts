import { randomUUID } from 'node:crypto'
import { defineWebSocketHandler } from 'h3'
import WebSocket from 'ws'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import logger from '~/server/utils/logger'
import { auth } from '@/lib/auth'
import { hasRole, UserRole } from '@/utils/shared/roles'
import {
    DEFAULT_VOLCENGINE_RESOURCE_ID,
    DEFAULT_VOLCENGINE_STREAM_ENDPOINT,
    buildVolcengineAudioRequestFrame,
    buildVolcengineFullClientRequestFrame,
    createVolcengineAuthHeaders,
    extractVolcengineTranscript,
    parseVolcengineServerPacket,
    resolveVolcengineAudioConfig,
} from '~/server/utils/ai/asr-volcengine'

interface PeerWithVolcState {
    id: string
    send: (data: string) => void
    close: (code?: number, reason?: string) => void
    request?: Request
    volcClient?: WebSocket
    initialized?: boolean
    userId?: string
    authorized?: boolean
}

export default defineWebSocketHandler({
    async open(peer) {
        const currentPeer = peer as PeerWithVolcState
        try {
            const request = currentPeer.request
            if (!request?.headers) {
                throw new Error('Upgrade request headers not found on peer')
            }

            const session = await auth.api.getSession({
                headers: request.headers,
            })

            if (!session?.user || !hasRole(session.user.role, [UserRole.ADMIN, UserRole.AUTHOR])) {
                throw new Error('Unauthorized')
            }

            currentPeer.userId = session.user.id
            currentPeer.authorized = true
            logger.info(`[ASR-WS] Peer connected: ${currentPeer.id}`)
        } catch (error) {
            logger.error(`[ASR-WS] Unauthorized WS connection attempt: ${currentPeer.id}`, error)
            currentPeer.authorized = false
            currentPeer.close(4001, 'Unauthorized')
        }
    },

    async message(peer, message) {
        const currentPeer = peer as PeerWithVolcState

        if (currentPeer.authorized !== true) {
            currentPeer.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
            currentPeer.close(4001, 'Unauthorized')
            return
        }

        const rawText = message.text()
        if (rawText === 'ping') {
            currentPeer.send('pong')
            return
        }

        try {
            const data = JSON.parse(rawText)

            if (data.type === 'start') {
                if (currentPeer.initialized) {
                    currentPeer.send(JSON.stringify({ type: 'started' }))
                    return
                }

                logger.info(`[ASR-WS] Received start from peer=${currentPeer.id}, lang=${String(data.language || 'zh-CN')}, mime=${String(data.mimeType || 'unknown')}`)

                await startVolcengineSession(currentPeer, {
                    language: typeof data.language === 'string' ? data.language : 'zh-CN',
                    mimeType: typeof data.mimeType === 'string' ? data.mimeType : 'audio/ogg;codecs=opus',
                    sampleRate: Number.isFinite(data.sampleRate) ? Number(data.sampleRate) : 16000,
                })
                return
            }

            if (data.type === 'audio') {
                if (currentPeer.volcClient?.readyState !== WebSocket.OPEN) {
                    currentPeer.send(JSON.stringify({
                        type: 'error',
                        message: 'ASR stream is not started',
                    }))
                    return
                }
                const audioBuffer = Buffer.from(data.payload, 'base64')
                logger.debug(`[ASR-WS] Audio chunk received peer=${currentPeer.id}, bytes=${audioBuffer.length}`)
                currentPeer.volcClient.send(buildVolcengineAudioRequestFrame(audioBuffer, false))
                return
            }

            if (data.type === 'stop') {
                if (currentPeer.volcClient?.readyState !== WebSocket.OPEN) {
                    currentPeer.send(JSON.stringify({
                        type: 'error',
                        message: 'ASR stream is not started',
                    }))
                    return
                }

                currentPeer.volcClient.send(buildVolcengineAudioRequestFrame(Buffer.alloc(0), true))
                logger.info(`[ASR-WS] Stop received peer=${currentPeer.id}, sent final frame`)
                setTimeout(() => {
                    try {
                        currentPeer.volcClient?.close()
                    } catch {
                        // ignore
                    }
                }, 1500)
            }
        } catch (error: any) {
            logger.warn('[ASR-WS] Message processing error', error)
            currentPeer.send(JSON.stringify({
                type: 'error',
                message: error?.message || 'Invalid message',
            }))
        }
    },

    close(peer) {
        const currentPeer = peer as PeerWithVolcState
        if (currentPeer.volcClient) {
            currentPeer.volcClient.close()
        }
        logger.info(`[ASR-WS] Peer disconnected: ${currentPeer.id}`)
    },
})

async function startVolcengineSession(peer: PeerWithVolcState, options: { language: string, mimeType: string, sampleRate: number }) {
    const settings = await getSettings([
        SettingKey.ASR_VOLCENGINE_APP_ID,
        SettingKey.ASR_VOLCENGINE_ACCESS_KEY,
        SettingKey.ASR_VOLCENGINE_CLUSTER_ID,
        SettingKey.ASR_MODEL,
        SettingKey.ASR_ENDPOINT,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
    ])

    const appId = settings[SettingKey.ASR_VOLCENGINE_APP_ID] || settings[SettingKey.VOLCENGINE_APP_ID] || ''
    const accessKey = settings[SettingKey.ASR_VOLCENGINE_ACCESS_KEY] || settings[SettingKey.VOLCENGINE_ACCESS_KEY] || ''
    const endpoint = settings[SettingKey.ASR_ENDPOINT] || DEFAULT_VOLCENGINE_STREAM_ENDPOINT
    const configuredModelOrResourceId = settings[SettingKey.ASR_MODEL] || ''
    const configuredVolcResourceId = settings[SettingKey.ASR_VOLCENGINE_CLUSTER_ID] || ''
    let resourceId = DEFAULT_VOLCENGINE_RESOURCE_ID
    if (configuredModelOrResourceId.startsWith('volc.')) {
        resourceId = configuredModelOrResourceId
    } else if (configuredVolcResourceId.startsWith('volc.')) {
        resourceId = configuredVolcResourceId
    }

    if (!appId || !accessKey) {
        peer.send(JSON.stringify({
            type: 'error',
            message: 'ASR configuration missing: appId/accessKey',
        }))
        return
    }

    const connectId = randomUUID()
    const { format, codec } = resolveVolcengineAudioConfig(options.mimeType)
    const rate = Number.isFinite(options.sampleRate) && options.sampleRate > 0 ? options.sampleRate : 16000

    logger.info(`[ASR-WS] Starting Volcengine session peer=${peer.id}, endpoint=${endpoint}, resourceId=${resourceId}, format=${format}, codec=${codec}, rate=${rate}`)

    const fullRequestPayload: Record<string, any> = {
        user: {
            uid: peer.userId || randomUUID(),
        },
        audio: {
            format,
            codec,
            rate,
            bits: 16,
            channel: 1,
        },
        request: {
            model_name: 'bigmodel',
            enable_itn: true,
            enable_punc: true,
            show_utterances: true,
            result_type: 'single',
        },
    }

    if (options.language && endpoint.includes('bigmodel_nostream')) {
        fullRequestPayload.audio.language = options.language
    }

    try {
        const volcClient = new WebSocket(endpoint, {
            headers: createVolcengineAuthHeaders({
                appId,
                accessKey,
                resourceId,
                connectId,
            }),
        })

        peer.volcClient = volcClient

        volcClient.on('upgrade', (res) => {
            const logId = res.headers['x-tt-logid']
            if (logId) {
                logger.info(`[ASR-WS] Connected to Volcengine, X-Tt-Logid=${String(logId)}`)
            }
        })

        volcClient.on('open', () => {
            volcClient.send(buildVolcengineFullClientRequestFrame(fullRequestPayload))
            peer.initialized = true
            logger.info(`[ASR-WS] Volcengine socket open peer=${peer.id}`)
            peer.send(JSON.stringify({ type: 'started' }))
        })

        volcClient.on('message', (rawData: WebSocket.RawData) => {
            const dataBuffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData as ArrayBuffer)
            const packet = parseVolcengineServerPacket(dataBuffer)

            if (packet.type === 'error') {
                logger.warn(`[ASR-WS] Volcengine server error peer=${peer.id} code=${packet.code} msg=${packet.message}`)
                peer.send(JSON.stringify({
                    type: 'error',
                    message: `Volcengine ASR Error(${packet.code}): ${packet.message}`,
                }))
                return
            }

            if (packet.type !== 'response') {
                return
            }

            const text = extractVolcengineTranscript(packet.data)
            if (!text) {
                logger.debug(`[ASR-WS] Empty transcript packet peer=${peer.id}`)
                return
            }

            const hasDefiniteUtterance = Array.isArray(packet.data?.result?.utterances)
                && packet.data.result.utterances.some((item: any) => item?.definite === true)

            peer.send(JSON.stringify({
                type: 'transcript',
                text,
                isFinal: packet.isFinal || hasDefiniteUtterance,
            }))
            logger.debug(`[ASR-WS] Transcript forwarded peer=${peer.id}, len=${text.length}, final=${String(packet.isFinal || hasDefiniteUtterance)}`)
        })

        volcClient.on('error', (error) => {
            logger.error('[ASR-WS] Volcengine socket error', error)
            peer.send(JSON.stringify({
                type: 'error',
                message: error.message || 'Volcengine websocket error',
            }))
        })

        volcClient.on('close', () => {
            peer.volcClient = undefined
            peer.initialized = false
            logger.debug('[ASR-WS] Volcengine connection closed')
        })
    } catch (error: any) {
        logger.error('[ASR-WS] Failed to start Volcengine session', error)
        peer.send(JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to start Volcengine ASR stream',
        }))
    }
}
