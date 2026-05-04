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

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export interface VolcengineFrameHeader {
    protocolVersion: number
    headerSize: number
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
}

export interface VolcengineErrorFrame {
    code: number
    message: string
    messageTypeFlags: number
}

export interface VolcengineEventFrame {
    event: number
    sessionId: string
    rawPayload: Uint8Array
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
}

function toUint8Array(input: ArrayBuffer | ArrayBufferView): Uint8Array {
    if (input instanceof Uint8Array) {
        return input
    }

    if (ArrayBuffer.isView(input)) {
        return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    }

    return new Uint8Array(input)
}

export function buildVolcengineHeader(options: {
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
}) {
    const header = new Uint8Array(4)
    header[0] = (VOLCENGINE_PROTOCOL_VERSION << 4) | VOLCENGINE_HEADER_SIZE_UNITS
    header[1] = (options.messageType << 4) | options.messageTypeFlags
    header[2] = (options.serialization << 4) | options.compression
    header[3] = 0
    return header
}

export function createVolcengineSignedInt32Buffer(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setInt32(0, value, false)
    return new Uint8Array(buffer)
}

export function createVolcengineUnsignedInt32Buffer(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setUint32(0, value, false)
    return new Uint8Array(buffer)
}

export function concatVolcengineChunks(...chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0

    chunks.forEach((chunk) => {
        merged.set(chunk, offset)
        offset += chunk.length
    })

    return merged
}

export function buildVolcengineBinaryFrame(options: {
    messageType: number
    messageTypeFlags: number
    serialization: number
    compression: number
    prefixChunks?: Uint8Array[]
    payload: Uint8Array
}) {
    const header = buildVolcengineHeader({
        messageType: options.messageType,
        messageTypeFlags: options.messageTypeFlags,
        serialization: options.serialization,
        compression: options.compression,
    })

    return concatVolcengineChunks(
        header,
        ...(options.prefixChunks || []),
        createVolcengineUnsignedInt32Buffer(options.payload.length),
        options.payload,
    )
}

export function buildVolcengineEventClientRequestFrame(options: {
    event: number
    sessionId: string
    payload: Record<string, unknown>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    const payloadBuffer = textEncoder.encode(JSON.stringify(options.payload || {}))
    const sessionBuffer = textEncoder.encode(options.sessionId)

    return buildVolcengineBinaryFrame({
        messageType: options.messageType ?? VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: options.messageTypeFlags ?? 0b0100,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: options.compression ?? VOLCENGINE_COMPRESSION.none,
        prefixChunks: [
            createVolcengineSignedInt32Buffer(options.event),
            createVolcengineUnsignedInt32Buffer(sessionBuffer.length),
            sessionBuffer,
        ],
        payload: payloadBuffer,
    })
}

export function buildVolcengineConnectionClientRequestFrame(options: {
    event: number
    payload?: Record<string, unknown>
    compression?: number
    messageType?: number
    messageTypeFlags?: number
}) {
    const payloadBuffer = textEncoder.encode(JSON.stringify(options.payload || {}))

    return buildVolcengineBinaryFrame({
        messageType: options.messageType ?? VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
        messageTypeFlags: options.messageTypeFlags ?? 0b0100,
        serialization: VOLCENGINE_SERIALIZATION.json,
        compression: options.compression ?? VOLCENGINE_COMPRESSION.none,
        prefixChunks: [createVolcengineSignedInt32Buffer(options.event)],
        payload: payloadBuffer,
    })
}

export function parseVolcengineErrorFrame(input: ArrayBuffer | ArrayBufferView): VolcengineErrorFrame | null {
    const data = toUint8Array(input)
    if (data.length < 12) {
        return null
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const messageType = (view.getUint8(1) >> 4) & 0x0f
    if (messageType !== VOLCENGINE_MESSAGE_TYPE.error) {
        return null
    }

    const size = view.getUint32(8, false)
    const messageEnd = 12 + size
    if (data.length < messageEnd) {
        return null
    }

    return {
        code: view.getUint32(4, false),
        message: textDecoder.decode(data.subarray(12, messageEnd)),
        messageTypeFlags: view.getUint8(1) & 0x0f,
    }
}

export function parseVolcengineEventFrame(input: ArrayBuffer | ArrayBufferView): VolcengineEventFrame | null {
    const data = toUint8Array(input)
    if (data.length < 16) {
        return null
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const messageType = (view.getUint8(1) >> 4) & 0x0f
    const messageTypeFlags = view.getUint8(1) & 0x0f
    const serialization = (view.getUint8(2) >> 4) & 0x0f
    const compression = view.getUint8(2) & 0x0f

    if (messageType === VOLCENGINE_MESSAGE_TYPE.error) {
        return null
    }

    let cursor = 4
    const event = view.getInt32(cursor, false)
    cursor += 4

    if (data.length < cursor + 4) {
        return null
    }
    const sessionIdSize = view.getUint32(cursor, false)
    cursor += 4

    if (data.length < cursor + sessionIdSize + 4) {
        return null
    }

    const sessionId = textDecoder.decode(data.subarray(cursor, cursor + sessionIdSize))
    cursor += sessionIdSize

    const payloadSize = view.getUint32(cursor, false)
    cursor += 4

    if (data.length < cursor + payloadSize) {
        return null
    }

    return {
        event,
        sessionId,
        rawPayload: data.subarray(cursor, cursor + payloadSize),
        messageType,
        messageTypeFlags,
        serialization,
        compression,
    }
}

export function decodeVolcengineSerializedPayload(payload: Uint8Array, serialization: number): unknown {
    if (serialization === VOLCENGINE_SERIALIZATION.none) {
        return textDecoder.decode(payload)
    }

    const text = textDecoder.decode(payload)
    if (serialization === VOLCENGINE_SERIALIZATION.json) {
        try {
            return JSON.parse(text) as unknown
        } catch {
            return text
        }
    }

    return text
}

export function toVolcengineArrayBuffer(data: Uint8Array): ArrayBuffer {
    const { buffer, byteOffset, byteLength } = data

    if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) {
        return buffer
    }

    return data.slice().buffer
}
