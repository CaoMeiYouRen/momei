import { gunzipSync, gzipSync } from 'node:zlib'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_HEADER_SIZE_UNITS,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_PROTOCOL_VERSION,
    VOLCENGINE_SERIALIZATION,
    buildVolcengineBinaryFrame as buildSharedVolcengineBinaryFrame,
    buildVolcengineConnectionClientRequestFrame as buildSharedVolcengineConnectionClientRequestFrame,
    buildVolcengineEventClientRequestFrame as buildSharedVolcengineEventClientRequestFrame,
    buildVolcengineHeader as buildSharedVolcengineHeader,
    decodeVolcengineSerializedPayload,
    parseVolcengineErrorFrame,
    parseVolcengineEventFrame,
} from '@/utils/shared/volcengine-protocol'

export {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_HEADER_SIZE_UNITS,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_PROTOCOL_VERSION,
    VOLCENGINE_SERIALIZATION,
}

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

export type VolcengineParsedPayload = string | Record<string, unknown> | Buffer

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
    return Buffer.from(buildSharedVolcengineHeader(options))
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

    return Buffer.from(buildSharedVolcengineBinaryFrame({
        messageType: options.messageType,
        messageTypeFlags: options.messageTypeFlags,
        serialization: options.serialization,
        compression: options.compression,
        prefixChunks: options.prefixBuffers?.map((chunk) => new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)),
        payload: new Uint8Array(compressedPayload.buffer, compressedPayload.byteOffset, compressedPayload.byteLength),
    }))
}

export function parseVolcengineErrorPacket(data: Buffer): VolcengineErrorPacket | null {
    return parseVolcengineErrorFrame(data)
}

export function parseVolcengineEventPacket(data: Buffer): VolcengineEventPacket | null {
    const packet = parseVolcengineEventFrame(data)
    if (!packet) {
        return null
    }

    const decompressed = decodeVolcenginePayload(Buffer.from(packet.rawPayload), packet.compression)
    const payload = decodeVolcenginePayloadBySerialization(decompressed, packet.serialization)

    return {
        event: packet.event,
        sessionId: packet.sessionId,
        payload,
        rawPayload: decompressed,
        messageType: packet.messageType,
        messageTypeFlags: packet.messageTypeFlags,
    }
}

export function buildVolcengineEventClientRequestFrame(options: {
    event: number
    sessionId: string
    payload: Record<string, unknown>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    return Buffer.from(buildSharedVolcengineEventClientRequestFrame(options))
}

export function buildVolcengineConnectionClientRequestFrame(options: {
    event: number
    payload?: Record<string, unknown>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    return Buffer.from(buildSharedVolcengineConnectionClientRequestFrame(options))
}
