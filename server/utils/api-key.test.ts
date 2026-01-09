import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey, verifyApiKey, maskApiKey } from './api-key'

describe('API Key Utils', () => {
    it('should generate a key with correct prefix', () => {
        const key = generateApiKey()
        expect(key).to.match(/^momei_sk_[a-f0-9]{64}$/) // 32 bytes = 64 hex chars
        // Wait, generateApiKey uses prefix + randomBytes(32).toString('hex')
        // Default length is 32 bytes which becomes 64 hex characters.
        // Prefix is 'momei_sk_'.
        expect(key.startsWith('momei_sk_')).toBe(true)
        expect(key.length).toBe('momei_sk_'.length + 64)
    })

    it('should hash and verify key correctly', () => {
        const key = generateApiKey()
        const hash = hashApiKey(key)

        expect(hash).not.toBe(key)
        expect(verifyApiKey(key, hash)).toBe(true)
        expect(verifyApiKey('wrong_key', hash)).toBe(false)
    })

    describe('maskApiKey', () => {
        it('should mask long keys correctly', () => {
            const key = '1234567890abcdef'
            expect(maskApiKey(key)).toBe('1234...cdef')
        })

        it('should mask short keys fully', () => {
            const key = '12345678'
            expect(maskApiKey(key)).toBe('********')
        })
    })
})
