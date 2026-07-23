import { describe, expect, it } from 'vitest'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    VOLCENGINE_PROTOCOL_VERSION,
    VOLCENGINE_HEADER_SIZE_UNITS,
    VOLCENGINE_SERIALIZATION,
    buildVolcengineHeader,
    createVolcengineSignedInt32Buffer,
    createVolcengineUnsignedInt32Buffer,
    concatVolcengineChunks,
    buildVolcengineBinaryFrame,
    buildVolcengineEventClientRequestFrame,
    buildVolcengineConnectionClientRequestFrame,
    buildSpeechStartConnectionFrame,
    buildSpeechStartSessionFrame,
    buildSpeechTaskRequestFrame,
    buildSpeechFinishSessionFrame,
    buildSpeechFinishConnectionFrame,
    buildPodcastStartFrame,
    buildPodcastFinishFrame,
    parseVolcengineErrorFrame,
    parseVolcengineEventFrame,
    decodeVolcengineSerializedPayload,
    toVolcengineArrayBuffer,
} from './volcengine-protocol'

describe('shared volcengine protocol helpers', () => {
    describe('constants', () => {
        it('has correct protocol version and header size', () => {
            expect(VOLCENGINE_PROTOCOL_VERSION).toBe(0b0001)
            expect(VOLCENGINE_HEADER_SIZE_UNITS).toBe(0b0001)
        })

        it('has correct message type values', () => {
            expect(VOLCENGINE_MESSAGE_TYPE.fullClientRequest).toBe(0b0001)
            expect(VOLCENGINE_MESSAGE_TYPE.audioOnlyRequest).toBe(0b0010)
            expect(VOLCENGINE_MESSAGE_TYPE.fullServerResponse).toBe(0b1001)
            expect(VOLCENGINE_MESSAGE_TYPE.audioOnlyServerResponse).toBe(0b1011)
            expect(VOLCENGINE_MESSAGE_TYPE.error).toBe(0b1111)
        })

        it('has correct serialization values', () => {
            expect(VOLCENGINE_SERIALIZATION.none).toBe(0b0000)
            expect(VOLCENGINE_SERIALIZATION.json).toBe(0b0001)
        })

        it('has correct compression values', () => {
            expect(VOLCENGINE_COMPRESSION.none).toBe(0b0000)
            expect(VOLCENGINE_COMPRESSION.gzip).toBe(0b0001)
        })
    })

    describe('buildVolcengineHeader', () => {
        it('builds a 4-byte header with packed bit fields', () => {
            const header = buildVolcengineHeader({
                messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
                messageTypeFlags: 0b0100,
                serialization: VOLCENGINE_SERIALIZATION.json,
                compression: VOLCENGINE_COMPRESSION.none,
            })

            expect(header).toBeInstanceOf(Uint8Array)
            expect(header.length).toBe(4)
            // byte 0: version=1 <<4 | headerSize=1 = 0x11
            expect(header[0]).toBe(0x11)
            // byte 1: messageType=1 <<4 | flags=4 = 0x14
            expect(header[1]).toBe(0x14)
            // byte 2: serialization=1 <<4 | compression=0 = 0x10
            expect(header[2]).toBe(0x10)
            // byte 3: reserved
            expect(header[3]).toBe(0)
        })
    })

    describe('createVolcengineSignedInt32Buffer', () => {
        it('creates a 4-byte big-endian signed int32', () => {
            const buf = createVolcengineSignedInt32Buffer(100)
            expect(buf).toBeInstanceOf(Uint8Array)
            expect(buf.length).toBe(4)
            const view = new DataView(buf.buffer)
            expect(view.getInt32(0, false)).toBe(100)
        })

        it('handles negative values', () => {
            const buf = createVolcengineSignedInt32Buffer(-1)
            const view = new DataView(buf.buffer)
            expect(view.getInt32(0, false)).toBe(-1)
        })
    })

    describe('createVolcengineUnsignedInt32Buffer', () => {
        it('creates a 4-byte big-endian unsigned int32', () => {
            const buf = createVolcengineUnsignedInt32Buffer(300)
            expect(buf.length).toBe(4)
            const view = new DataView(buf.buffer)
            expect(view.getUint32(0, false)).toBe(300)
        })

        it('handles zero', () => {
            const buf = createVolcengineUnsignedInt32Buffer(0)
            const view = new DataView(buf.buffer)
            expect(view.getUint32(0, false)).toBe(0)
        })
    })

    describe('concatVolcengineChunks', () => {
        it('concatenates multiple Uint8Arrays', () => {
            const result = concatVolcengineChunks(
                new Uint8Array([1, 2]),
                new Uint8Array([3, 4, 5]),
            )
            expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
        })

        it('returns empty array for no chunks', () => {
            const result = concatVolcengineChunks()
            expect(result).toEqual(new Uint8Array(0))
        })

        it('handles single chunk', () => {
            const result = concatVolcengineChunks(new Uint8Array([42]))
            expect(result).toEqual(new Uint8Array([42]))
        })
    })

    describe('buildVolcengineBinaryFrame', () => {
        it('builds a frame with header, optional prefix, length prefix, and payload', () => {
            const payload = new TextEncoder().encode('{"key":"value"}')
            const prefix = createVolcengineSignedInt32Buffer(100)

            const frame = buildVolcengineBinaryFrame({
                messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
                messageTypeFlags: 0b0100,
                serialization: VOLCENGINE_SERIALIZATION.json,
                compression: VOLCENGINE_COMPRESSION.none,
                prefixChunks: [prefix],
                payload,
            })

            // 4 (header) + 4 (prefix) + 4 (payload length) + payload.length
            expect(frame.length).toBe(4 + 4 + 4 + payload.length)
        })

        it('works without prefix chunks', () => {
            const payload = new Uint8Array([1, 2, 3])
            const frame = buildVolcengineBinaryFrame({
                messageType: VOLCENGINE_MESSAGE_TYPE.fullClientRequest,
                messageTypeFlags: 0,
                serialization: VOLCENGINE_SERIALIZATION.none,
                compression: VOLCENGINE_COMPRESSION.none,
                payload,
            })

            expect(frame.length).toBe(4 + 4 + 3)
        })
    })

    describe('buildVolcengineEventClientRequestFrame', () => {
        it('builds a frame with event, sessionId and JSON payload', () => {
            const frame = buildVolcengineEventClientRequestFrame({
                event: 100,
                sessionId: 'session-001',
                payload: { action: 0, input_text: 'hello' },
                compression: VOLCENGINE_COMPRESSION.none,
            })

            const packet = parseVolcengineEventFrame(frame)
            expect(packet).toBeTruthy()
            expect(packet?.event).toBe(100)
            expect(packet?.sessionId).toBe('session-001')
            expect(packet?.messageType).toBe(VOLCENGINE_MESSAGE_TYPE.fullClientRequest)
            expect(decodeVolcengineSerializedPayload(packet!.rawPayload, packet!.serialization)).toMatchObject({
                action: 0,
                input_text: 'hello',
            })
        })

        it('uses default messageType and messageTypeFlags', () => {
            const frame = buildVolcengineEventClientRequestFrame({
                event: 200,
                sessionId: 'sess-1',
                payload: {},
            })

            const packet = parseVolcengineEventFrame(frame)
            expect(packet?.messageType).toBe(VOLCENGINE_MESSAGE_TYPE.fullClientRequest)
            expect(packet?.messageTypeFlags).toBe(0b0100)
        })
    })

    describe('buildVolcengineConnectionClientRequestFrame', () => {
        it('builds a connection-level frame with header and event prefix', () => {
            const frame = buildVolcengineConnectionClientRequestFrame({
                event: 1,
                payload: { test: true },
            })

            // Connection frames are valid binary frames but too short for
            // parseVolcengineEventFrame (need ≥16 bytes).
            expect(frame).toBeInstanceOf(Uint8Array)
            expect(frame.length).toBeGreaterThan(8)
            // Header byte 0: version=1 <<4 | headerSize=1 => 0x11
            expect(frame[0]).toBe(0x11)
            // Header byte 1: messageType=1 <<4 | flags=4 => 0x14
            expect(frame[1]).toBe(0x14)
        })
    })

    describe('higher-level frame builders', () => {
        it('buildSpeechStartConnectionFrame returns a valid connection frame', () => {
            const frame = buildSpeechStartConnectionFrame()
            expect(frame).toBeInstanceOf(Uint8Array)
            expect(frame.length).toBeGreaterThan(8)
            expect(frame[0]).toBe(0x11)
        })

        it('buildSpeechStartSessionFrame includes session params', () => {
            const frame = buildSpeechStartSessionFrame({
                sessionId: 'session-001',
                userId: 'user-1',
                speaker: 'zh_female_01',
                model: 'bidirectional-tts',
                speed: 1.0,
                volume: 1.0,
            })

            const packet = parseVolcengineEventFrame(frame)
            expect(packet?.event).toBe(100)
            expect(packet?.sessionId).toBe('session-001')
        })

        it('buildSpeechTaskRequestFrame includes text payload', () => {
            const frame = buildSpeechTaskRequestFrame('session-001', '你好世界')
            const packet = parseVolcengineEventFrame(frame)
            expect(packet?.event).toBe(200)
            expect(packet?.sessionId).toBe('session-001')
        })

        it('buildSpeechFinishSessionFrame marks session end', () => {
            const frame = buildSpeechFinishSessionFrame('session-001')
            const packet = parseVolcengineEventFrame(frame)
            expect(packet?.event).toBe(102)
            expect(packet?.sessionId).toBe('session-001')
        })

        it('buildSpeechFinishConnectionFrame marks connection end', () => {
            const frame = buildSpeechFinishConnectionFrame()
            expect(frame).toBeInstanceOf(Uint8Array)
            expect(frame.length).toBeGreaterThan(8)
        })

        it('buildPodcastStartFrame includes podcast params', () => {
            const frame = buildPodcastStartFrame('podcast-1', 'hello world', ['speaker-1', 'speaker-2'])
            const packet = parseVolcengineEventFrame(frame)
            expect(packet?.event).toBe(100)
            expect(packet?.sessionId).toBe('podcast-1')
        })

        it('buildPodcastFinishFrame marks podcast end', () => {
            const frame = buildPodcastFinishFrame()
            expect(frame).toBeInstanceOf(Uint8Array)
            expect(frame.length).toBeGreaterThan(8)
        })
    })

    describe('parseVolcengineErrorFrame', () => {
        it('returns null for frames shorter than 12 bytes', () => {
            expect(parseVolcengineErrorFrame(new Uint8Array(5))).toBeNull()
        })

        it('returns null for non-error message types', () => {
            const raw = new Uint8Array(12)
            const view = new DataView(raw.buffer)
            view.setUint8(1, 0x10) // messageType = 1 (fullClientRequest)
            expect(parseVolcengineErrorFrame(raw)).toBeNull()
        })

        it('returns null for truncated payload', () => {
            const raw = new Uint8Array(13)
            const view = new DataView(raw.buffer)
            view.setUint8(0, 0x11)
            view.setUint8(1, 0xf0)
            view.setUint8(2, 0x10)
            view.setUint32(8, 100, false) // size = 100 but only 13 bytes total
            expect(parseVolcengineErrorFrame(raw)).toBeNull()
        })

        it('parses valid error frames correctly', () => {
            const code = 55000000
            const message = 'server error'
            const messageBuffer = new TextEncoder().encode(message)

            const raw = new Uint8Array(12 + messageBuffer.length)
            const view = new DataView(raw.buffer)
            view.setUint8(0, 0x11)
            view.setUint8(1, 0xf0)
            view.setUint8(2, 0x10)
            view.setUint8(3, 0)
            view.setUint32(4, code, false)
            view.setUint32(8, messageBuffer.length, false)
            raw.set(messageBuffer, 12)

            const packet = parseVolcengineErrorFrame(raw)
            expect(packet).toBeTruthy()
            expect(packet?.code).toBe(code)
            expect(packet?.message).toBe(message)
            expect(packet?.messageTypeFlags).toBe(0)
        })
    })

    describe('parseVolcengineEventFrame', () => {
        it('returns null for frames shorter than 16 bytes', () => {
            expect(parseVolcengineEventFrame(new Uint8Array(10))).toBeNull()
        })

        it('returns null for error message type', () => {
            const raw = new Uint8Array(20)
            const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
            view.setUint8(1, 0xf0) // messageType = 15 (error)
            expect(parseVolcengineEventFrame(raw)).toBeNull()
        })

        it('returns null when sessionId size exceeds buffer length', () => {
            const raw = new Uint8Array(20)
            const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
            view.setUint8(1, 0x10) // messageType = 1 (fullClientRequest)
            // event at offset 4, default = 0
            view.setUint32(8, 9999, false) // sessionIdSize = 9999 (too large)
            expect(parseVolcengineEventFrame(raw)).toBeNull()
        })

        it('returns null when payload size exceeds buffer length', () => {
            // Minimum structure: header(4) + event(4) + sessionIdSize(4) + sessionId(N) + payloadSize(4)
            // sessionId "t" = 1 byte → total needed: 4+4+4+1+4 = 17 bytes
            const raw = new Uint8Array(20)
            const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
            view.setUint8(1, 0x10) // messageType = 1
            view.setInt32(4, 100, false) // event = 100
            view.setUint32(8, 1, false) // sessionIdSize = 1
            raw[12] = 't'.charCodeAt(0) // sessionId = "t"
            view.setUint32(13, 999, false) // payloadSize = 999 (too large)
            expect(parseVolcengineEventFrame(raw)).toBeNull()
        })
    })

    describe('decodeVolcengineSerializedPayload', () => {
        it('decodes none-serialized payload as text', () => {
            const result = decodeVolcengineSerializedPayload(
                new TextEncoder().encode('hello'),
                VOLCENGINE_SERIALIZATION.none,
            )
            expect(result).toBe('hello')
        })

        it('parses JSON-serialized payload', () => {
            const result = decodeVolcengineSerializedPayload(
                new TextEncoder().encode('{"key":"value"}'),
                VOLCENGINE_SERIALIZATION.json,
            )
            expect(result).toEqual({ key: 'value' })
        })

        it('returns raw text for invalid JSON', () => {
            const result = decodeVolcengineSerializedPayload(
                new TextEncoder().encode('not json'),
                VOLCENGINE_SERIALIZATION.json,
            )
            expect(result).toBe('not json')
        })

        it('returns raw text for unknown serialization', () => {
            const result = decodeVolcengineSerializedPayload(
                new TextEncoder().encode('data'),
                0b0010, // unknown serialization
            )
            expect(result).toBe('data')
        })
    })

    describe('toVolcengineArrayBuffer', () => {
        it('returns the underlying buffer when safe', () => {
            const data = new Uint8Array([1, 2, 3])
            const result = toVolcengineArrayBuffer(data)
            expect(result).toBe(data.buffer)
            expect(new Uint8Array(result)).toEqual(data)
        })

        it('copies buffer for views with offset', () => {
            const original = new Uint8Array([0, 0, 1, 2, 3, 0])
            const view = new Uint8Array(original.buffer, 2, 3)
            const result = toVolcengineArrayBuffer(view)
            expect(result).not.toBe(original.buffer)
            expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3]))
        })
    })
})
