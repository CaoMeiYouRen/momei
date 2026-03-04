import { describe, it, expect } from 'vitest'
import {
    generateSignature,
    verifySignature,
    validateTimestamp,
    validateWebhookRequest,
    buildSignaturePayload,
} from './webhook-security'

describe('Webhook Security Utils', () => {
    const secret = 'test-secret-key-123456'

    describe('generateSignature', () => {
        it('should generate consistent HMAC-SHA256 signature', () => {
            const payload = 'test-payload'
            const signature = generateSignature(payload, secret)

            // SHA256 hex string is 64 characters
            expect(signature).toMatch(/^[a-f0-9]{64}$/)
            // Consistency check
            expect(signature).toBe(generateSignature(payload, secret))
        })

        it('should generate different signatures for different payloads', () => {
            const sig1 = generateSignature('payload1', secret)
            const sig2 = generateSignature('payload2', secret)

            expect(sig1).not.toBe(sig2)
        })

        it('should generate different signatures for different secrets', () => {
            const payload = 'test-payload'
            const sig1 = generateSignature(payload, secret)
            const sig2 = generateSignature(payload, 'different-secret')

            expect(sig1).not.toBe(sig2)
        })

        it('should support SHA512 algorithm', () => {
            const payload = 'test-payload'
            const signature = generateSignature(payload, secret, 'sha512')

            // SHA512 hex string is 128 characters
            expect(signature).toMatch(/^[a-f0-9]{128}$/)
        })
    })

    describe('verifySignature', () => {
        it('should return true for valid signature', () => {
            const payload = 'test-payload'
            const signature = generateSignature(payload, secret)

            expect(verifySignature(payload, signature, secret)).toBe(true)
        })

        it('should return false for invalid signature', () => {
            expect(verifySignature('payload', 'invalid-sig', secret)).toBe(false)
        })

        it('should return false for wrong secret', () => {
            const signature = generateSignature('payload', secret)
            expect(verifySignature('payload', signature, 'wrong-secret')).toBe(false)
        })

        it('should return false for malformed signature', () => {
            expect(verifySignature('payload', 'not-hex-string!', secret)).toBe(false)
        })

        it('should return false for signature with wrong length', () => {
            const signature = generateSignature('payload', secret)
            // Truncate the signature
            const truncatedSig = signature.slice(0, 32)
            expect(verifySignature('payload', truncatedSig, secret)).toBe(false)
        })
    })

    describe('validateTimestamp', () => {
        it('should accept current timestamp', () => {
            const result = validateTimestamp(Date.now())
            expect(result.valid).toBe(true)
        })

        it('should accept timestamp within tolerance', () => {
            const timestamp = Date.now() - 4 * 60 * 1000 // 4 minutes ago
            const result = validateTimestamp(timestamp, 5 * 60 * 1000)

            expect(result.valid).toBe(true)
        })

        it('should reject expired timestamp', () => {
            const oldTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
            const result = validateTimestamp(oldTimestamp, 5 * 60 * 1000)

            expect(result.valid).toBe(false)
            expect(result.reason).toContain('expired')
        })

        it('should reject future timestamp beyond tolerance', () => {
            const futureTimestamp = Date.now() + 10 * 60 * 1000 // 10 minutes in future
            const result = validateTimestamp(futureTimestamp, 5 * 60 * 1000)

            expect(result.valid).toBe(false)
        })

        it('should use default tolerance when not specified', () => {
            const timestamp = Date.now() - 4 * 60 * 1000 // 4 minutes ago
            const result = validateTimestamp(timestamp)

            expect(result.valid).toBe(true)
        })
    })

    describe('buildSignaturePayload', () => {
        it('should build payload with timestamp only', () => {
            const payload = buildSignaturePayload({ timestamp: 1234567890 })

            expect(payload).toBe('1234567890')
        })

        it('should build payload with timestamp and source', () => {
            const payload = buildSignaturePayload({
                timestamp: 1234567890,
                source: 'vercel',
            })

            expect(payload).toBe('1234567890\nvercel')
        })

        it('should build payload with timestamp, source and body', () => {
            const payload = buildSignaturePayload({
                timestamp: 1234567890,
                source: 'cloudflare',
                body: '{"test":true}',
            })

            expect(payload).toBe('1234567890\ncloudflare\n{"test":true}')
        })

        it('should build payload with timestamp and body (no source)', () => {
            const payload = buildSignaturePayload({
                timestamp: 1234567890,
                body: '{"test":true}',
            })

            expect(payload).toBe('1234567890\n{"test":true}')
        })
    })

    describe('validateWebhookRequest', () => {
        it('should pass valid request', () => {
            const timestamp = Date.now()
            const source = 'vercel'
            const body = '{"test":true}'
            const payload = buildSignaturePayload({ timestamp, source, body })
            const signature = generateSignature(payload, secret)

            const result = validateWebhookRequest(
                { timestamp, signature, source, body },
                { secret },
            )

            expect(result.valid).toBe(true)
        })

        it('should pass valid request without body', () => {
            const timestamp = Date.now()
            const source = 'cloudflare'
            const payload = buildSignaturePayload({ timestamp, source })
            const signature = generateSignature(payload, secret)

            const result = validateWebhookRequest(
                { timestamp, signature, source },
                { secret },
            )

            expect(result.valid).toBe(true)
        })

        it('should reject request with expired timestamp', () => {
            const timestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
            const payload = buildSignaturePayload({ timestamp })
            const signature = generateSignature(payload, secret)

            const result = validateWebhookRequest(
                { timestamp, signature },
                { secret },
            )

            expect(result.valid).toBe(false)
            expect(result.reason).toContain('expired')
        })

        it('should reject request with invalid signature', () => {
            const result = validateWebhookRequest(
                { timestamp: Date.now(), signature: 'invalid-signature' },
                { secret },
            )

            expect(result.valid).toBe(false)
            expect(result.reason).toContain('Invalid signature')
        })

        it('should reject request with signature for different payload', () => {
            const timestamp = Date.now()
            const payload = buildSignaturePayload({ timestamp, source: 'vercel' })
            const signature = generateSignature(payload, secret)

            // Use signature with different source
            const result = validateWebhookRequest(
                { timestamp, signature, source: 'cloudflare' },
                { secret },
            )

            expect(result.valid).toBe(false)
        })

        it('should use custom timestamp tolerance', () => {
            const timestamp = Date.now() - 3 * 60 * 1000 // 3 minutes ago
            const payload = buildSignaturePayload({ timestamp })
            const signature = generateSignature(payload, secret)

            // Should fail with 2 minute tolerance
            const result = validateWebhookRequest(
                { timestamp, signature },
                { secret, timestampTolerance: 2 * 60 * 1000 },
            )

            expect(result.valid).toBe(false)
        })

        it('should support SHA512 algorithm', () => {
            const timestamp = Date.now()
            const payload = buildSignaturePayload({ timestamp })
            const signature = generateSignature(payload, secret, 'sha512')

            const result = validateWebhookRequest(
                { timestamp, signature },
                { secret, algorithm: 'sha512' },
            )

            expect(result.valid).toBe(true)
        })
    })
})
