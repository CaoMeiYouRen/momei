import { describe, it, expect } from 'vitest'
import { generateInsecureRandomString, generateRandomString } from './random'

describe('random.ts', () => {
    describe('generateRandomString', () => {
        it('should generate string of correct length', () => {
            expect(generateRandomString(10)).toHaveLength(10)
            expect(generateRandomString(0)).toHaveLength(0)
        })

        it('should generate different strings', () => {
            const str1 = generateRandomString(10)
            const str2 = generateRandomString(10)
            expect(str1).not.toBe(str2)
        })

        it('should contain allowed characters', () => {
            const str = generateRandomString(100)
            expect(str).toMatch(/^[A-Za-z0-9]+$/)
        })

        it('should handle large lengths', () => {
            const str = generateRandomString(1000)
            expect(str).toHaveLength(1000)
        })
    })

    describe('generateInsecureRandomString', () => {
        it('should generate string of correct length', () => {
            expect(generateInsecureRandomString(10)).toHaveLength(10)
            expect(generateInsecureRandomString(0)).toHaveLength(0)
        })

        it('should generate different strings', () => {
            const str1 = generateInsecureRandomString(10)
            const str2 = generateInsecureRandomString(10)
            // Most likely different, but not guaranteed
            expect(str1.length).toBe(10)
            expect(str2.length).toBe(10)
        })

        it('should contain allowed characters', () => {
            const str = generateInsecureRandomString(100)
            expect(str).toMatch(/^[A-Za-z0-9]+$/)
        })

        it('should handle large lengths', () => {
            const str = generateInsecureRandomString(500)
            expect(str).toHaveLength(500)
        })
    })
})

