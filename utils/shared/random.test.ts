import { describe, it, expect } from 'vitest'
import { generateRandomString } from './random'

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
    })
})
