import { describe, it, expect } from 'vitest'
import { sha256 } from './hash'

describe('hash.ts', () => {
    describe('sha256', () => {
        it('should generate correct SHA-256 hash for a simple string', async () => {
            const result = await sha256('hello')
            expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
        })

        it('should generate correct SHA-256 hash for empty string', async () => {
            const result = await sha256('')
            expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
        })

        it('should generate correct SHA-256 hash for Chinese characters', async () => {
            const result = await sha256('你好世界')
            expect(result).toBe('beca6335b20ff57ccc47403ef4d9e0b8fccb4442b3151c2e7d50050673d43172')
        })

        it('should generate correct SHA-256 hash for special characters', async () => {
            const result = await sha256('!@#$%^&*()')
            expect(result).toBe('95ce789c5c9d18490972709838ca3a9719094bca3ac16332cfec0652b0236141')
        })

        it('should generate different hashes for different inputs', async () => {
            const hash1 = await sha256('test1')
            const hash2 = await sha256('test2')
            expect(hash1).not.toBe(hash2)
        })

        it('should generate same hash for same input', async () => {
            const hash1 = await sha256('consistent')
            const hash2 = await sha256('consistent')
            expect(hash1).toBe(hash2)
        })

        it('should generate 64-character hex string', async () => {
            const result = await sha256('test')
            expect(result).toHaveLength(64)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })

        it('should handle long strings', async () => {
            const longString = 'a'.repeat(10000)
            const result = await sha256(longString)
            expect(result).toHaveLength(64)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })

        it('should handle unicode characters', async () => {
            const result = await sha256('🚀🌟💻')
            expect(result).toHaveLength(64)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })

        it('should handle newlines and tabs', async () => {
            const result = await sha256('line1\nline2\ttab')
            expect(result).toHaveLength(64)
            expect(result).toMatch(/^[0-9a-f]{64}$/)
        })
    })
})
