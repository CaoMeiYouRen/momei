import { describe, expect, it } from 'vitest'
import {
    VOLCENGINE_COMPRESSION,
    VOLCENGINE_MESSAGE_TYPE,
    buildVolcengineEventClientRequestFrame,
    createVolcengineAuthHeaders,
    parseVolcengineErrorPacket,
    parseVolcengineEventPacket,
} from './volcengine-protocol'

describe('volcengine-protocol', () => {
    it('should build auth headers with app-id/app-key/resource/connect-id', () => {
        const headers = createVolcengineAuthHeaders({
            appId: 'app-id',
            appKey: 'fixed-app-key',
            accessKey: 'access-key',
            resourceId: 'resource-id',
            connectId: 'connect-id',
            requestId: 'request-id',
        })

        expect(headers['X-Api-App-Id']).toBe('app-id')
        expect(headers['X-Api-App-Key']).toBe('fixed-app-key')
        expect(headers['X-Api-Access-Key']).toBe('access-key')
        expect(headers['X-Api-Resource-Id']).toBe('resource-id')
        expect(headers['X-Api-Connect-Id']).toBe('connect-id')
        expect(headers['X-Api-Request-Id']).toBe('request-id')
    })

    it('should build and parse event frame', () => {
        const frame = buildVolcengineEventClientRequestFrame({
            event: 100,
            sessionId: 'session-001',
            payload: {
                action: 0,
                input_text: 'hello',
            },
            compression: VOLCENGINE_COMPRESSION.none,
        })

        const packet = parseVolcengineEventPacket(frame)
        expect(packet).toBeTruthy()
        expect(packet?.event).toBe(100)
        expect(packet?.sessionId).toBe('session-001')
        expect(packet?.messageType).toBe(VOLCENGINE_MESSAGE_TYPE.fullClientRequest)
        expect(packet?.payload).toMatchObject({
            action: 0,
            input_text: 'hello',
        })
    })

    it('should parse volcengine error packet', () => {
        const code = 55000000
        const message = 'server error'
        const messageBuffer = Buffer.from(message, 'utf-8')

        const raw = Buffer.alloc(12 + messageBuffer.length)
        raw.writeUInt8(0x11, 0)
        raw.writeUInt8(0xf0, 1)
        raw.writeUInt8(0x10, 2)
        raw.writeUInt8(0x00, 3)
        raw.writeUInt32BE(code, 4)
        raw.writeUInt32BE(messageBuffer.length, 8)
        messageBuffer.copy(raw, 12)

        const packet = parseVolcengineErrorPacket(raw)
        expect(packet).toBeTruthy()
        expect(packet?.code).toBe(code)
        expect(packet?.message).toBe(message)
    })
})
