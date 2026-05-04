import { describe, expect, it } from 'vitest'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    buildVolcengineEventClientRequestFrame,
    decodeVolcengineSerializedPayload,
    parseVolcengineErrorFrame,
    parseVolcengineEventFrame,
} from './volcengine-protocol'

describe('shared volcengine protocol helpers', () => {
    it('builds and parses event request frames', () => {
        const frame = buildVolcengineEventClientRequestFrame({
            event: 100,
            sessionId: 'session-001',
            payload: {
                action: 0,
                input_text: 'hello',
            },
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

    it('parses error frames with length-prefixed message payloads', () => {
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
    })
})
