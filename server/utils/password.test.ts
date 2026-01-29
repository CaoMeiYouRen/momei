import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', () => {
            const password = 'test123456'
            const hash = hashPassword(password)

            expect(hash).toBeDefined()
            expect(typeof hash).toBe('string')
            expect(hash.length).toBeGreaterThan(0)
        })

        it('should generate different hashes for same password', () => {
            const password = 'test123456'
            const hash1 = hashPassword(password)
            const hash2 = hashPassword(password)

            // Due to random salt, hashes should be different
            expect(hash1).not.toBe(hash2)
        })

        it('should handle empty password', () => {
            const hash = hashPassword('')
            expect(hash).toBeDefined()
        })
    })

    describe('verifyPassword', () => {
        it('should verify correct password', () => {
            const password = 'test123456'
            const hash = hashPassword(password)

            expect(verifyPassword(password, hash)).toBe(true)
        })

        it('should reject incorrect password', () => {
            const password = 'test123456'
            const hash = hashPassword(password)

            expect(verifyPassword('wrongpassword', hash)).toBe(false)
        })

        it('should handle empty password verification', () => {
            const hash = hashPassword('')
            expect(verifyPassword('', hash)).toBe(true)
            expect(verifyPassword('nonempty', hash)).toBe(false)
        })

        it('should handle complex passwords', () => {
            const password = 'P@ssw0rd!#$%^&*()'
            const hash = hashPassword(password)

            expect(verifyPassword(password, hash)).toBe(true)
            expect(verifyPassword('P@ssw0rd!#$%^&*()x', hash)).toBe(false)
        })
    })
})
