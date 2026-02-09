import { describe, it, expect, vi } from 'vitest'

// Mock the env module before importing security
vi.mock('~/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('~/utils/shared/env')>()
    return {
        ...actual,
        AUTH_SECRET: 'test-secret-key-for-testing',
    }
})

import { signCookieValue, verifyCookieValue } from './security'

describe('security.ts', () => {
    describe('signCookieValue', () => {
        it('should sign a value with secret', () => {
            const value = 'test-value'
            const signed = signCookieValue(value)

            expect(signed).toContain('.')
            expect(signed).toContain(value)
            expect(signed.split('.')[0]).toBe(value)
        })

        it('should generate different signatures for different values', () => {
            const signed1 = signCookieValue('value1')
            const signed2 = signCookieValue('value2')

            expect(signed1).not.toBe(signed2)
            expect(signed1.split('.')[1]).not.toBe(signed2.split('.')[1])
        })

        it('should generate same signature for same value', () => {
            const value = 'consistent-value'
            const signed1 = signCookieValue(value)
            const signed2 = signCookieValue(value)

            expect(signed1).toBe(signed2)
        })

        it('should handle empty string', () => {
            const signed = signCookieValue('')
            expect(signed).toContain('.')
        })

        it('should handle special characters', () => {
            const value = '!@#$%^&*()'
            const signed = signCookieValue(value)
            expect(signed).toContain('.')
            expect(signed).toContain(value)
        })

        it('should handle unicode characters', () => {
            const value = '你好🔐'
            const signed = signCookieValue(value)
            expect(signed).toContain('.')
        })
    })

    describe('verifyCookieValue', () => {
        it('should verify correctly signed value', () => {
            const value = 'test-value'
            const signed = signCookieValue(value)
            const verified = verifyCookieValue(signed)

            expect(verified).toBe(value)
        })

        it('should return null for tampered signature', () => {
            const value = 'test-value'
            const signed = signCookieValue(value)
            const tampered = `${signed.slice(0, -1)}x` // Change last char

            expect(verifyCookieValue(tampered)).toBeNull()
        })

        it('should return null for tampered value', () => {
            const value = 'test-value'
            const signed = signCookieValue(value)
            const [, signature] = signed.split('.')
            const tampered = `tampered-value.${signature}`

            expect(verifyCookieValue(tampered)).toBeNull()
        })

        it('should return null for undefined input', () => {
            expect(verifyCookieValue(undefined)).toBeNull()
        })

        it('should return null for empty signature', () => {
            expect(verifyCookieValue('value.')).toBeNull()
        })

        it('should return null for empty value', () => {
            expect(verifyCookieValue('.signature')).toBeNull()
        })

        it('should return null for empty string value (by design)', () => {
            // Empty string is treated as invalid by the security module
            const signed = signCookieValue('')
            const verified = verifyCookieValue(signed)
            expect(verified).toBeNull()
        })

        it('should verify special characters', () => {
            const value = '!@#$%^&*()'
            const signed = signCookieValue(value)
            const verified = verifyCookieValue(signed)
            expect(verified).toBe(value)
        })

        it('should verify unicode characters', () => {
            const value = '你好🔐'
            const signed = signCookieValue(value)
            const verified = verifyCookieValue(signed)
            expect(verified).toBe(value)
        })
    })

    describe('Integration tests', () => {
        it('should work with multiple values', () => {
            const values = ['value1', 'value2', 'value3']
            const signed = values.map((v) => signCookieValue(v))

            signed.forEach((s, index) => {
                expect(verifyCookieValue(s)).toBe(values[index])
            })
        })

        it('should maintain consistency across multiple operations', () => {
            const value = 'consistent-value'

            for (let i = 0; i < 10; i++) {
                const signed = signCookieValue(value)
                expect(verifyCookieValue(signed)).toBe(value)
            }
        })

        it('should reject cross-value verification', () => {
            const value1 = 'value1'
            const value2 = 'value2'
            const signed1 = signCookieValue(value1)
            const signed2 = signCookieValue(value2)

            expect(verifyCookieValue(signed1)).toBe(value1)
            expect(verifyCookieValue(signed2)).toBe(value2)

            // Swap signatures
            const [v1] = signed1.split('.')
            const [, sig2] = signed2.split('.')
            const swapped = `${v1}.${sig2}`

            expect(verifyCookieValue(swapped)).toBeNull()
        })
    })
})
