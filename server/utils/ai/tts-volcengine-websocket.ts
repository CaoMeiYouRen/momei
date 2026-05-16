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
import { AI_HEAVY_TASK_TIMEOUT_MS } from '@/utils/shared/env'
import {
    normalizeVolcengineSpeaker,
    resolveVolcengineBodyModel,
    resolveVolcengineLoudnessRate,
    resolveVolcengineSpeechRate,
    resolveVolcengineSpeechResourceId,
} from '@/utils/shared/volcengine-tts-profile'
import type { TTSOptions } from '@/types/ai'

export interface VolcengineTTSConfigLike {
    appId: string
    accessKey: string
    defaultModel?: string
}

export interface VolcengineWebSocketSpeechParams {
    config: VolcengineTTSConfigLike
    text: string
    voice: string | string[]
    options: TTSOptions
}

function extractJsonPayload(payloadBuffer: Buffer): string | Record<string, unknown> | Buffer {
    const payloadText = payloadBuffer.toString('utf-8')
    try {
        return JSON.parse(payloadText) as Record<string, unknown>
    } catch {
        return payloadText
    }
}

function parseConnectionPacket(data: Buffer) {
    if (data.length < 12) {
        return null
    }

    const messageType = (data.readUInt8(1) >> 4) & 0x0f
    const messageTypeFlags = data.readUInt8(1) & 0x0f
    const serialization = (data.readUInt8(2) >> 4) & 0x0f
    const compression = data.readUInt8(2) & 0x0f
    const event = data.readInt32BE(4)

    if (event < 50 || event > 52) {
        return null
    }

    const connectionIdSize = data.readUInt32BE(8)
    const connectionIdStart = 12
    const connectionIdEnd = connectionIdStart + connectionIdSize
    if (data.length < connectionIdEnd + 4) {
        return null
    }

    const payloadSize = data.readUInt32BE(connectionIdEnd)
    const payloadStart = connectionIdEnd + 4
    if (data.length < payloadStart + payloadSize) {
        return null
    }

    const connectionId = connectionIdSize > 0
        ? data.subarray(connectionIdStart, connectionIdEnd).toString('utf-8')
        : ''
    const payloadBuffer = data.subarray(payloadStart, payloadStart + payloadSize)

    return {
        event,
        connectionId,
        payload: serialization === 0b0001 ? extractJsonPayload(payloadBuffer) : payloadBuffer,
        messageType,
        messageTypeFlags,
        serialization,
        compression,
    }
}

function enqueueAudioPayload(payload: unknown, controller: ReadableStreamDefaultController<Uint8Array>) {
    if (Buffer.isBuffer(payload)) {
        if (payload.length > 0) {
            controller.enqueue(new Uint8Array(payload))
            return true
        }
        return false
    }

    if (typeof payload === 'string') {
        try {
            const binary = Buffer.from(payload, 'base64')
            if (binary.length > 0) {
                controller.enqueue(new Uint8Array(binary))
                return true
            }
        } catch {
            // ignore invalid payload
        }
        return false
    }

    if (payload && typeof payload === 'object') {
        const objectPayload = payload as Record<string, unknown>
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
                return true
            }
        }
    }

    return false
}

export function generateVolcengineWebSocketSpeech({
    config,
    text,
    voice,
    options,
}: VolcengineWebSocketSpeechParams): ReadableStream<Uint8Array> {
    const appId = config.appId
    const token = config.accessKey
    logger.debug(`[VolcengineTTS] Starting WebSocket V3 TTS generation. Text length: ${text.length}, Voice: ${Array.isArray(voice) ? voice.join(',') : voice}`)

    if (!appId || !token) {
        throw createError({
            statusCode: 500,
            message: 'Volcengine TTS Error: AppID or Access Token missing',
        })
    }

    const speaker = Array.isArray(voice)
        ? normalizeVolcengineSpeaker(voice[0])
        : normalizeVolcengineSpeaker(voice)
    const resourceId = resolveVolcengineSpeechResourceId(speaker)
    const bodyModel = resolveVolcengineBodyModel(speaker, options.model)
    logger.debug(`[VolcengineTTS] Resource ID: ${resourceId}, Final Body Model: ${bodyModel}`)

    const endpoint = 'wss://openspeech.bytedance.com/api/v3/tts/bidirection'
    const connectId = crypto.randomUUID()
    const requestId = crypto.randomUUID()
    const sessionId = crypto.randomUUID()
    const userId = crypto.randomUUID()

    const speechRate = resolveVolcengineSpeechRate(options.speed)
    const loudnessRate = resolveVolcengineLoudnessRate(options.volume)

    const additions: Record<string, unknown> = {
        explicit_language: options.language || 'zh',
        disable_markdown_filter: true,
        enable_timestamp: true,
    }

    if (options.pitch !== undefined) {
        additions.post_process = {
            pitch: Math.max(-12, Math.min(12, Math.round(options.pitch))),
        }
    }

    logger.debug(`[VolcengineTTS] Request payload prepared. Speaker: ${speaker}, Model: ${bodyModel}, Speech Rate: ${speechRate}, Loudness Rate: ${loudnessRate}, Additions: ${JSON.stringify(additions)}`)

    const startConnectionFrame = buildVolcengineConnectionClientRequestFrame({
        event: 1,
        payload: {},
        messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: 0b0100,
        compression: VOLCENGINE_COMPRESSION.none,
    })

    const startSessionFrame = buildVolcengineEventClientRequestFrame({
        event: 100,
        sessionId,
        payload: {
            user: { uid: userId },
            namespace: 'BidirectionalTTS',
            req_params: {
                model: bodyModel,
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
        },
        messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: 0b0100,
        compression: VOLCENGINE_COMPRESSION.none,
    })

    const taskRequestFrame = buildVolcengineEventClientRequestFrame({
        event: 200,
        sessionId,
        payload: {
            namespace: 'BidirectionalTTS',
            req_params: {
                text,
            },
        },
        messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: 0b0100,
        compression: VOLCENGINE_COMPRESSION.none,
    })

    const finishSessionFrame = buildVolcengineEventClientRequestFrame({
        event: 102,
        sessionId,
        payload: {},
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
            accessKey: token,
            resourceId,
            connectId,
            requestId,
        }),
    })

    logger.info(`[VolcengineTTS] Starting WebSocket V3 TTS generation. Session: ${sessionId}`)

    return new ReadableStream<Uint8Array>({
        start(controller) {
            let settled = false
            let wsOpened = false
            let connectionStarted = false
            let sessionStarted = false
            let finishSessionSent = false
            let timeoutId: ReturnType<typeof setTimeout> | null = null

            const clearTimeoutIfNeeded = () => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }

            const settle = (action: () => void) => {
                if (settled) {
                    return
                }
                settled = true
                clearTimeoutIfNeeded()
                action()
            }

            const closeSocket = () => {
                try {
                    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                        ws.close()
                    }
                } catch {
                    // ignore
                }
            }

            const sendFrame = (frame: Buffer) => {
                try {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(frame)
                    }
                } catch {
                    // ignore
                }
            }

            timeoutId = setTimeout(() => {
                settle(() => {
                    controller.error(createError({
                        statusCode: 504,
                        message: `Volcengine TTS websocket timeout (${AI_HEAVY_TASK_TIMEOUT_MS}ms)`,
                    }))
                    closeSocket()
                })
            }, AI_HEAVY_TASK_TIMEOUT_MS)

            ws.on('upgrade', (res) => {
                const logId = res.headers['x-tt-logid']
                if (logId) {
                    logger.info(`[VolcengineTTS] WebSocket connected, X-Tt-Logid=${String(logId)}`)
                }
            })

            ws.on('open', () => {
                wsOpened = true
                sendFrame(startConnectionFrame)
            })

            ws.on('message', (rawData: WebSocket.RawData) => {
                if (settled) {
                    return
                }

                const messageBuffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData as ArrayBuffer)

                const errorPacket = parseVolcengineErrorPacket(messageBuffer)
                if (errorPacket) {
                    settle(() => {
                        controller.error(createError({
                            statusCode: 502,
                            message: `Volcengine TTS Error(${errorPacket.code}): ${errorPacket.message}`,
                        }))
                        closeSocket()
                    })
                    return
                }

                const connectionPacket = parseConnectionPacket(messageBuffer)
                if (connectionPacket) {
                    if (connectionPacket.event === 50) {
                        if (!connectionStarted) {
                            connectionStarted = true
                            sendFrame(startSessionFrame)
                        }
                        return
                    }

                    if (connectionPacket.event === 51) {
                        settle(() => {
                            const payload = connectionPacket.payload
                            const payloadMessage = payload && typeof payload === 'object'
                                ? (payload as Record<string, unknown>).message
                                : undefined
                            controller.error(createError({
                                statusCode: 502,
                                message: typeof payloadMessage === 'string' && payloadMessage
                                    ? `Volcengine TTS Connection Failed: ${payloadMessage}`
                                    : 'Volcengine TTS Connection Failed',
                            }))
                            closeSocket()
                        })
                        return
                    }

                    if (connectionPacket.event === 52) {
                        settle(() => {
                            try {
                                controller.close()
                            } catch {
                                // ignore
                            }
                            closeSocket()
                        })
                        return
                    }

                    return
                }

                const packet = parseVolcengineEventPacket(messageBuffer)
                if (!packet) {
                    return
                }

                if (packet.event === 150) {
                    if (!sessionStarted) {
                        sessionStarted = true
                        sendFrame(taskRequestFrame)
                        if (!finishSessionSent) {
                            finishSessionSent = true
                            sendFrame(finishSessionFrame)
                        }
                    }
                    return
                }

                if (packet.event === 350 || packet.event === 351) {
                    return
                }

                if (packet.event === 352) {
                    enqueueAudioPayload(packet.payload, controller)
                    return
                }

                if (packet.event === 154 && packet.payload && typeof packet.payload === 'object') {
                    const payloadObj = packet.payload as Record<string, unknown>
                    logger.info(`[VolcengineTTS] Usage: ${JSON.stringify(payloadObj.usage || payloadObj)}`)
                    return
                }

                if (packet.event === 152 || packet.event === 153) {
                    settle(() => {
                        if (!finishSessionSent) {
                            finishSessionSent = true
                            sendFrame(finishSessionFrame)
                        }

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
                        closeSocket()
                    })
                }
            })

            ws.on('error', (error) => {
                if (settled) {
                    return
                }

                settle(() => {
                    controller.error(createError({
                        statusCode: 502,
                        message: `Volcengine TTS websocket error: ${error.message}`,
                    }))
                    closeSocket()
                })
            })

            ws.on('close', () => {
                if (settled) {
                    return
                }

                settle(() => {
                    if (!wsOpened) {
                        controller.error(createError({
                            statusCode: 502,
                            message: 'Volcengine TTS connection closed before start',
                        }))
                        return
                    }

                    try {
                        controller.close()
                    } catch {
                        // ignore
                    }
                })
            })
        },
        cancel() {
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(finishSessionFrame)
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
