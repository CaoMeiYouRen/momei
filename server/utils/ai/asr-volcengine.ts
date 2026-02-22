import { randomUUID } from 'node:crypto'
import WebSocket from 'ws'
import { createError } from 'h3'
import logger from '../logger'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_SERIALIZATION,
    buildVolcengineBinaryFrame,
    createVolcengineAuthHeaders,
    decodeVolcenginePayload,
    decodeVolcenginePayloadBySerialization,
} from './volcengine-protocol'
import type { AIProvider, TranscribeOptions, TranscribeResponse } from '@/types/ai'

export const DEFAULT_VOLCENGINE_STREAM_ENDPOINT = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async'
export const DEFAULT_VOLCENGINE_NOSTREAM_ENDPOINT = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream'
export const DEFAULT_VOLCENGINE_RESOURCE_ID = 'volc.seedasr.sauc.duration'

export interface VolcengineASRConfig {
    appId: string
    token: string
    cluster?: string
    endpoint?: string
    resourceId?: string
}

interface VolcenginePacketBase {
    messageTypeFlags: number
}

interface VolcengineResponsePacket extends VolcenginePacketBase {
    type: 'response'
    sequence: number
    data: any
    isFinal: boolean
}

interface VolcengineErrorPacket extends VolcenginePacketBase {
    type: 'error'
    code: number
    message: string
}

interface VolcengineUnknownPacket extends VolcenginePacketBase {
    type: 'unknown'
}

export type VolcengineServerPacket = VolcengineResponsePacket | VolcengineErrorPacket | VolcengineUnknownPacket

export function resolveVolcengineAudioConfig(mimeType = '') {
    const normalized = mimeType.toLowerCase()

    if (normalized.includes('pcm')) {
        return { format: 'pcm', codec: 'raw' as const }
    }
    if (normalized.includes('ogg')) {
        return { format: 'ogg', codec: 'opus' as const }
    }
    if (normalized.includes('webm')) {
        return { format: 'webm', codec: 'opus' as const }
    }
    if (normalized.includes('wav')) {
        return { format: 'wav', codec: 'raw' as const }
    }
    if (normalized.includes('mp3')) {
        return { format: 'mp3', codec: 'raw' as const }
    }

    return { format: 'ogg', codec: 'opus' as const }
}

export function buildVolcengineFullClientRequestFrame(payloadObject: Record<string, any>, sequence = 1) {
    const payloadRaw = Buffer.from(JSON.stringify(payloadObject), 'utf-8')
    const seqBuffer = Buffer.alloc(4)
    seqBuffer.writeInt32BE(sequence, 0)

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: 0b0001,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: VOLCENGINE_COMPRESSION.gzip,
        prefixBuffers: [seqBuffer],
        payload: payloadRaw,
    })
}

export function buildVolcengineAudioRequestFrame(audioBuffer: Buffer, sequence: number, isFinal = false) {
    const seqBuffer = Buffer.alloc(4)
    seqBuffer.writeInt32BE(isFinal ? -Math.abs(sequence) : sequence, 0)

    return buildVolcengineBinaryFrame({
        messageType: VOLCENGINE_MESSAGE_TYPE.audioOnlyRequest,
        messageTypeFlags: isFinal ? 0b0011 : 0b0001,
        serialization: VOLCENGINE_SERIALIZATION.none,
        compression: VOLCENGINE_COMPRESSION.gzip,
        prefixBuffers: [seqBuffer],
        payload: audioBuffer,
    })
}

export function parseVolcengineServerPacket(data: Buffer): VolcengineServerPacket {
    if (data.length < 4) {
        return {
            type: 'unknown',
            messageTypeFlags: 0,
        }
    }

    const messageType = (data.readUInt8(1) >> 4) & 0x0f
    const messageTypeFlags = data.readUInt8(1) & 0x0f
    const serialization = (data.readUInt8(2) >> 4) & 0x0f
    const compression = data.readUInt8(2) & 0x0f

    if (messageType === VOLCENGINE_MESSAGE_TYPE.fullServerResponse) {
        if (data.length < 12) {
            return {
                type: 'unknown',
                messageTypeFlags,
            }
        }

        const sequence = data.readInt32BE(4)
        const payloadSize = data.readUInt32BE(8)
        const payloadStart = 12
        const payloadEnd = payloadStart + payloadSize
        const compressedPayload = data.subarray(payloadStart, payloadEnd)
        const payload = decodeVolcenginePayload(compressedPayload, compression)
        const decoded = decodeVolcenginePayloadBySerialization(payload, serialization)

        return {
            type: 'response',
            sequence,
            messageTypeFlags,
            data: decoded,
            isFinal: messageTypeFlags === 0b0010 || messageTypeFlags === 0b0011,
        }
    }

    if (messageType === VOLCENGINE_MESSAGE_TYPE.error) {
        if (data.length < 12) {
            return {
                type: 'error',
                code: 0,
                message: 'Unknown server error',
                messageTypeFlags,
            }
        }

        const code = data.readUInt32BE(4)
        const size = data.readUInt32BE(8)
        const message = data.subarray(12, 12 + size).toString('utf-8')

        return {
            type: 'error',
            code,
            message,
            messageTypeFlags,
        }
    }

    return {
        type: 'unknown',
        messageTypeFlags,
    }
}

export function extractVolcengineTranscript(payload: any) {
    if (!payload) {
        return ''
    }

    if (typeof payload.result?.text === 'string') {
        return payload.result.text
    }

    if (Array.isArray(payload.result)) {
        const texts = payload.result.map((item: any) => item?.text).filter((text: any) => typeof text === 'string')
        return texts.join('')
    }

    if (typeof payload.text === 'string') {
        return payload.text
    }

    return ''
}

export class VolcengineASRProvider implements Partial<AIProvider> {
    name = 'volcengine'
    private config: VolcengineASRConfig

    constructor(config: VolcengineASRConfig) {
        this.config = {
            ...config,
        }
    }

    get model() {
        return this.config.resourceId || this.config.cluster || DEFAULT_VOLCENGINE_RESOURCE_ID
    }

    async transcribe(options: TranscribeOptions): Promise<TranscribeResponse> {
        const appId = this.config.appId
        const accessKey = this.config.token

        if (!appId || !accessKey) {
            throw createError({
                statusCode: 500,
                message: 'Volcengine ASR Error: AppID 或 AccessKey 未配置',
            })
        }

        const url = this.config.endpoint || DEFAULT_VOLCENGINE_NOSTREAM_ENDPOINT
        const connectId = randomUUID()
        const resourceId = options.model || this.config.resourceId || this.model
        const { format, codec } = resolveVolcengineAudioConfig(options.mimeType)

        const requestPayload: Record<string, any> = {
            user: {
                uid: randomUUID(),
            },
            audio: {
                format,
                codec,
                rate: 16000,
                bits: 16,
                channel: 1,
            },
            request: {
                model_name: 'bigmodel',
                enable_itn: true,
                enable_punc: true,
                show_utterances: true,
                result_type: 'full',
            },
        }

        if (options.language && url.includes('bigmodel_nostream')) {
            requestPayload.audio.language = options.language
        }

        const ws = new WebSocket(url, {
            headers: createVolcengineAuthHeaders({
                appId,
                accessKey,
                resourceId,
                connectId,
            }),
        })

        logger.info(`[VolcengineASR] Start transcribe connectId=${connectId}, resourceId=${resourceId}`)

        return await new Promise<TranscribeResponse>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                ws.close()
                reject(createError({
                    statusCode: 504,
                    message: 'Volcengine ASR timeout',
                }))
            }, 30000)

            let finalText = ''
            let settled = false
            let sequence = 1

            const settle = (fn: () => void) => {
                if (settled) {
                    return
                }
                settled = true
                clearTimeout(timeoutId)
                fn()
            }

            ws.on('upgrade', (res) => {
                const logId = res.headers['x-tt-logid']
                if (logId) {
                    logger.info(`[VolcengineASR] Connected, X-Tt-Logid=${String(logId)}`)
                }
            })

            ws.on('open', () => {
                ws.send(buildVolcengineFullClientRequestFrame(requestPayload, sequence))
                sequence += 1
                ws.send(buildVolcengineAudioRequestFrame(options.audioBuffer, sequence, true))
            })

            ws.on('message', (rawData: WebSocket.RawData) => {
                const data = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData as ArrayBuffer)
                const packet = parseVolcengineServerPacket(data)

                if (packet.type === 'error') {
                    settle(() => reject(createError({
                        statusCode: 502,
                        message: `Volcengine ASR Error(${packet.code}): ${packet.message}`,
                    })))
                    return
                }

                if (packet.type !== 'response') {
                    return
                }

                const text = extractVolcengineTranscript(packet.data)
                if (text) {
                    finalText = text
                }

                const hasDefiniteUtterance = Array.isArray(packet.data?.result?.utterances)
                    && packet.data.result.utterances.some((item: any) => item?.definite === true)

                if (packet.isFinal || hasDefiniteUtterance) {
                    settle(() => {
                        ws.close()
                        resolve({
                            text: finalText,
                            language: options.language || 'auto',
                            duration: Number(packet.data?.audio_info?.duration || 0),
                            confidence: 1,
                            usage: {
                                audioSeconds: Number(packet.data?.audio_info?.duration || 0) / 1000,
                            },
                        })
                    })
                }
            })

            ws.on('error', (error) => {
                settle(() => reject(createError({
                    statusCode: 502,
                    message: `Volcengine ASR websocket error: ${error.message}`,
                })))
            })

            ws.on('close', () => {
                if (settled) {
                    return
                }
                settle(() => {
                    if (finalText) {
                        resolve({
                            text: finalText,
                            language: options.language || 'auto',
                            duration: 0,
                            confidence: 1,
                            usage: {
                                audioSeconds: 0,
                            },
                        })
                    } else {
                        reject(createError({
                            statusCode: 502,
                            message: 'Volcengine ASR connection closed without result',
                        }))
                    }
                })
            })
        })
    }

    check(): Promise<boolean> {
        return Promise.resolve(!!(this.config.appId && this.config.token))
    }
}
