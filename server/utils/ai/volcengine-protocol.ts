import { gunzipSync, gzipSync } from 'node:zlib'

export const VOLCENGINE_PROTOCOL_VERSION = 0b0001
export const VOLCENGINE_HEADER_SIZE_UNITS = 0b0001

export const VOLCENGINE_MESSAGE_TYPE = {
    fullClientRequest: 0b0001,
    audioOnlyRequest: 0b0010,
    fullServerResponse: 0b1001,
    audioOnlyServerResponse: 0b1011,
    error: 0b1111,
} as const

export const VOLCENGINE_SERIALIZATION = {
    none: 0b0000,
    json: 0b0001,
} as const

export const VOLCENGINE_COMPRESSION = {
    none: 0b0000,
    gzip: 0b0001,
} as const

export interface VolcengineAuthHeadersOptions {
    appId: string
    accessKey: string
    resourceId: string
    connectId?: string
    // 可选覆盖。默认与 appId 相同。
    // 说明：不同接口文档命名不一致（HTTP 常见 X-Api-App-Id，WS 常见 X-Api-App-Key），
    // 但两者语义一致，值都应为控制台 APP ID。
    appKey?: string
    requestId?: string
}

export interface VolcengineFrameHeader {
    protocolVersion: number
    headerSize: number
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
}

export interface VolcengineFrameBody {
    header: VolcengineFrameHeader
    headerBytes: number
    payloadStart: number
    payloadSize: number
    payload: Buffer
}

export interface VolcengineErrorPacket {
    code: number
    message: string
    messageTypeFlags: number
}

export type VolcengineParsedPayload = string | Record<string, any> | Buffer

export interface VolcengineEventPacket {
    event: number
    sessionId: string
    payload: VolcengineParsedPayload
    rawPayload: Buffer
    messageType: number
    messageTypeFlags: number
}

/**
 * 统一构建火山鉴权请求头。
 *
 * 为兼容不同接口文档命名差异，这里同时写入：
 * - X-Api-App-Id
 * - X-Api-App-Key
 *
 * 默认两者都使用同一个 APP ID（options.appId）。
 * 如个别接口需显式传入 appKey，可通过 options.appKey 覆盖。
 */
export function createVolcengineAuthHeaders(options: VolcengineAuthHeadersOptions) {
    const headers: Record<string, string> = {
        'X-Api-App-Id': options.appId,
        'X-Api-App-Key': options.appKey || options.appId,
        'X-Api-Access-Key': options.accessKey,
        'X-Api-Resource-Id': options.resourceId,
    }

    if (options.connectId) {
        headers['X-Api-Connect-Id'] = options.connectId
    }

    if (options.requestId) {
        headers['X-Api-Request-Id'] = options.requestId
    }

    return headers
}

export function buildVolcengineHeader(options: {
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
}) {
    const header = Buffer.alloc(4)
    header.writeUInt8((VOLCENGINE_PROTOCOL_VERSION << 4) | VOLCENGINE_HEADER_SIZE_UNITS, 0)
    header.writeUInt8((options.messageType << 4) | options.messageTypeFlags, 1)
    header.writeUInt8((options.serialization << 4) | options.compression, 2)
    header.writeUInt8(0x00, 3)
    return header
}

export function encodeVolcenginePayload(payload: Buffer, compression: number) {
    if (compression === VOLCENGINE_COMPRESSION.gzip && payload.length > 0) {
        return gzipSync(payload)
    }
    return payload
}

export function decodeVolcenginePayload(payload: Buffer, compression: number) {
    if (compression === VOLCENGINE_COMPRESSION.gzip && payload.length > 0) {
        return gunzipSync(payload)
    }
    return payload
}

export function decodeVolcenginePayloadBySerialization(payload: Buffer, serialization: number): VolcengineParsedPayload {
    if (serialization === VOLCENGINE_SERIALIZATION.none) {
        return payload
    }

    const text = payload.toString('utf-8')
    if (serialization === VOLCENGINE_SERIALIZATION.json) {
        try {
            return JSON.parse(text)
        } catch {
            return text
        }
    }

    return text
}

export function buildVolcengineBinaryFrame(options: {
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
    prefixBuffers?: Buffer[]
    payload: Buffer
}) {
    const compressedPayload = encodeVolcenginePayload(options.payload, options.compression)
    const payloadSize = Buffer.alloc(4)
    payloadSize.writeUInt32BE(compressedPayload.length, 0)

    const header = buildVolcengineHeader({
        messageType: options.messageType,
        messageTypeFlags: options.messageTypeFlags,
        serialization: options.serialization,
        compression: options.compression,
    })

    return Buffer.concat([
        header,
        ...(options.prefixBuffers || []),
        payloadSize,
        compressedPayload,
    ])
}

export function parseVolcengineFrame(data: Buffer): VolcengineFrameBody | null {
    if (data.length < 8) {
        return null
    }

    const protocolVersion = (data.readUInt8(0) >> 4) & 0x0f
    const headerSizeUnits = data.readUInt8(0) & 0x0f
    const headerBytes = headerSizeUnits * 4
    if (headerBytes <= 0 || data.length < headerBytes + 4) {
        return null
    }

    const messageType = (data.readUInt8(1) >> 4) & 0x0f
    const messageTypeFlags = data.readUInt8(1) & 0x0f
    const serialization = (data.readUInt8(2) >> 4) & 0x0f
    const compression = data.readUInt8(2) & 0x0f

    const payloadSizeOffset = headerBytes
    const payloadSize = data.readUInt32BE(payloadSizeOffset)
    const payloadStart = payloadSizeOffset + 4
    const payloadEnd = payloadStart + payloadSize
    if (data.length < payloadEnd) {
        return null
    }

    return {
        header: {
            protocolVersion,
            headerSize: headerBytes,
            messageType,
            messageTypeFlags,
            serialization,
            compression,
        },
        headerBytes,
        payloadStart,
        payloadSize,
        payload: data.subarray(payloadStart, payloadEnd),
    }
}

export function parseVolcengineErrorPacket(data: Buffer): VolcengineErrorPacket | null {
    if (data.length < 12) {
        return null
    }

    const messageType = (data.readUInt8(1) >> 4) & 0x0f
    if (messageType !== VOLCENGINE_MESSAGE_TYPE.error) {
        return null
    }

    const messageTypeFlags = data.readUInt8(1) & 0x0f
    const code = data.readUInt32BE(4)
    const size = data.readUInt32BE(8)
    const message = data.subarray(12, 12 + size).toString('utf-8')

    return {
        code,
        message,
        messageTypeFlags,
    }
}

export function parseVolcengineEventPacket(data: Buffer): VolcengineEventPacket | null {
    if (data.length < 16) {
        return null
    }

    const messageType = (data.readUInt8(1) >> 4) & 0x0f
    const messageTypeFlags = data.readUInt8(1) & 0x0f
    const serialization = (data.readUInt8(2) >> 4) & 0x0f
    const compression = data.readUInt8(2) & 0x0f

    if (messageType === VOLCENGINE_MESSAGE_TYPE.error) {
        return null
    }

    let cursor = 4
    if (data.length < cursor + 4) {
        return null
    }
    const event = data.readInt32BE(cursor)
    cursor += 4

    if (data.length < cursor + 4) {
        return null
    }
    const sessionIdSize = data.readUInt32BE(cursor)
    cursor += 4

    if (data.length < cursor + sessionIdSize + 4) {
        return null
    }
    const sessionId = data.subarray(cursor, cursor + sessionIdSize).toString('utf-8')
    cursor += sessionIdSize

    const payloadSize = data.readUInt32BE(cursor)
    cursor += 4

    if (data.length < cursor + payloadSize) {
        return null
    }

    const rawPayload = data.subarray(cursor, cursor + payloadSize)
    const decompressed = decodeVolcenginePayload(rawPayload, compression)
    const payload = decodeVolcenginePayloadBySerialization(decompressed, serialization)

    return {
        event,
        sessionId,
        payload,
        rawPayload: decompressed,
        messageType,
        messageTypeFlags,
    }
}

export function buildVolcengineEventClientRequestFrame(options: {
    event: number
    sessionId: string
    payload: Record<string, any>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    const serialization = VOLCENGINE_SERIALIZATION.json
    const compression = options.compression ?? VOLCENGINE_COMPRESSION.none
    const payloadBuffer = Buffer.from(JSON.stringify(options.payload || {}), 'utf-8')
    const sessionBuffer = Buffer.from(options.sessionId, 'utf-8')

    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(options.event, 0)

    const sessionSizeBuffer = Buffer.alloc(4)
    sessionSizeBuffer.writeUInt32BE(sessionBuffer.length, 0)

    return buildVolcengineBinaryFrame({
        messageType: options.messageType ?? VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: options.messageTypeFlags ?? 0b0100,
        serialization,
        compression,
        prefixBuffers: [eventBuffer, sessionSizeBuffer, sessionBuffer],
        payload: payloadBuffer,
    })
}

export function buildVolcengineConnectionClientRequestFrame(options: {
    event: number
    payload?: Record<string, any>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    const serialization = VOLCENGINE_SERIALIZATION.json
    const compression = options.compression ?? VOLCENGINE_COMPRESSION.none
    const payloadBuffer = Buffer.from(JSON.stringify(options.payload || {}), 'utf-8')

    const eventBuffer = Buffer.alloc(4)
    eventBuffer.writeInt32BE(options.event, 0)

    return buildVolcengineBinaryFrame({
        messageType: options.messageType ?? VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: options.messageTypeFlags ?? 0b0100,
        serialization,
        compression,
        prefixBuffers: [eventBuffer],
        payload: payloadBuffer,
    })
}
