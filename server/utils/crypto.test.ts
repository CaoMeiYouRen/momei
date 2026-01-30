import { describe, it, expect } from 'vitest'
import { scryptHash, scryptVerify } from './crypto'

describe('crypto.ts', () => {
    describe('scryptHash', () => {
        it('should generate hash with default options', () => {
            const hash = scryptHash('password123')
            expect(hash).toBeTruthy()
            expect(hash).toContain(':')

            const [salt, hashValue] = hash.split(':')
            expect(salt).toHaveLength(32) // 16 bytes = 32 hex chars
            expect(hashValue).toHaveLength(128) // 64 bytes = 128 hex chars
        })

        it('should generate different hashes for same input', () => {
            const hash1 = scryptHash('password')
            const hash2 = scryptHash('password')
            expect(hash1).not.toBe(hash2) // Different salts
        })

        it('should generate hash with custom salt length', () => {
            const hash = scryptHash('password', { saltLength: 32 })
            const [salt] = hash.split(':')
            expect(salt).toHaveLength(64) // 32 bytes = 64 hex chars
        })

        it('should generate hash with custom key length', () => {
            const hash = scryptHash('password', { keyLength: 32 })
            const [, hashValue] = hash.split(':')
            expect(hashValue).toHaveLength(64) // 32 bytes = 64 hex chars
        })

        it('should handle empty string', () => {
            const hash = scryptHash('')
            expect(hash).toBeTruthy()
            expect(hash).toContain(':')
        })

        it('should handle special characters', () => {
            const hash = scryptHash('!@#$%^&*()')
            expect(hash).toBeTruthy()
            expect(hash).toContain(':')
        })

        it('should handle unicode characters', () => {
            const hash = scryptHash('密码🔐')
            expect(hash).toBeTruthy()
            expect(hash).toContain(':')
        })

        it('should handle long strings', () => {
            const longPassword = 'a'.repeat(1000)
            const hash = scryptHash(longPassword)
            expect(hash).toBeTruthy()
            expect(hash).toContain(':')
        })
    })

    describe('scryptVerify', () => {
        it('should verify correct password', () => {
            const password = 'mySecurePassword'
            const hash = scryptHash(password)
            expect(scryptVerify(password, hash)).toBe(true)
        })

        it('should reject incorrect password', () => {
            const password = 'mySecurePassword'
            const hash = scryptHash(password)
            expect(scryptVerify('wrongPassword', hash)).toBe(false)
        })

        it('should handle empty password', () => {
            const hash = scryptHash('')
            expect(scryptVerify('', hash)).toBe(true)
            expect(scryptVerify('notEmpty', hash)).toBe(false)
        })

        it('should reject malformed hash (no colon)', () => {
            expect(scryptVerify('password', 'invalidhash')).toBe(false)
        })

        it('should reject malformed hash (missing salt)', () => {
            expect(scryptVerify('password', ':hashonly')).toBe(false)
        })

        it('should reject malformed hash (missing hash)', () => {
            expect(scryptVerify('password', 'saltonly:')).toBe(false)
        })

        it('should reject hash with wrong length', () => {
            const password = 'password'
            const hash = scryptHash(password, { keyLength: 32 })
            // Try to verify with different keyLength
            expect(scryptVerify(password, hash, { keyLength: 64 })).toBe(false)
        })

        it('should verify with custom key length', () => {
            const password = 'password'
            const hash = scryptHash(password, { keyLength: 32 })
            expect(scryptVerify(password, hash, { keyLength: 32 })).toBe(true)
        })

        it('should handle special characters', () => {
            const password = '!@#$%^&*()'
            const hash = scryptHash(password)
            expect(scryptVerify(password, hash)).toBe(true)
            expect(scryptVerify('!@#$%^&*', hash)).toBe(false)
        })

        it('should handle unicode characters', () => {
            const password = '密码🔐'
            const hash = scryptHash(password)
            expect(scryptVerify(password, hash)).toBe(true)
            expect(scryptVerify('密码', hash)).toBe(false)
        })

        it('should be case sensitive', () => {
            const password = 'Password'
            const hash = scryptHash(password)
            expect(scryptVerify('password', hash)).toBe(false)
            expect(scryptVerify('PASSWORD', hash)).toBe(false)
        })

        it('should handle whitespace differences', () => {
            const password = 'pass word'
            const hash = scryptHash(password)
            expect(scryptVerify('password', hash)).toBe(false)
            expect(scryptVerify('pass  word', hash)).toBe(false)
        })
    })

    describe('Integration tests', () => {
        it('should work with multiple passwords', () => {
            const passwords = ['pass1', 'pass2', 'pass3']
            const hashes = passwords.map((p) => scryptHash(p))

            passwords.forEach((password, index) => {
                const hash = hashes[index]
                expect(hash).toBeDefined()
                expect(scryptVerify(password, hash!)).toBe(true)
                // Verify against wrong hashes
                hashes.forEach((wrongHash, hashIndex) => {
                    if (hashIndex !== index) {
                        expect(scryptVerify(password, wrongHash)).toBe(false)
                    }
                })
            })
        })

        it('should maintain consistency across multiple verifications', () => {
            const password = 'consistentPassword'
            const hash = scryptHash(password)

            for (let i = 0; i < 10; i++) {
                expect(scryptVerify(password, hash)).toBe(true)
            }
        })
    })
})
