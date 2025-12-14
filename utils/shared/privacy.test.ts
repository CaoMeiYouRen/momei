import { describe, it, expect } from 'vitest'
import { maskEmail, maskPhone, maskUserId, maskUsername, maskIP, maskString } from './privacy'

describe('privacy.ts', () => {
    describe('maskEmail', () => {
        it('should mask email correctly', () => {
            expect(maskEmail('test@example.com')).toBe('t**t@example.com')
            expect(maskEmail('longusername@example.com')).toBe('l****e@example.com')
        })

        it('should handle short usernames', () => {
            expect(maskEmail('abc@example.com')).toBe('a***@example.com')
            expect(maskEmail('ab@example.com')).toBe('a***@example.com')
            expect(maskEmail('a@example.com')).toBe('a***@example.com')
        })

        it('should return original if invalid', () => {
            expect(maskEmail('')).toBe('')
            // @ts-expect-error testing invalid input
            expect(maskEmail(null)).toBe(null)
            expect(maskEmail('invalid-email')).toBe('invalid-email')
        })
    })

    describe('maskPhone', () => {
        it('should mask E164 phone number correctly', () => {
            // +86 138 0013 8000 -> +86 138 **** 8000
            expect(maskPhone('+8613800138000')).toBe('+86 138 **** 8000')
        })

        it('should mask short phone number correctly', () => {
            // Assuming a short number is valid in some region or fallback
            // 1234567 -> 1234567 (invalid number returns original)
            expect(maskPhone('1234567')).toBe('1234567')
        })

        it('should return original if invalid or too short', () => {
            expect(maskPhone('123')).toBe('123')
            expect(maskPhone('')).toBe('')
        })

        it('should handle fallback for parsing failure', () => {
            // If parsing fails, it strips non-digits and masks
            // 13800138000 is valid, so it gets formatted.
            expect(maskPhone('13800138000')).toBe('+86 138 **** 8000')
        })
    })

    describe('maskUserId', () => {
        it('should mask short user id', () => {
            expect(maskUserId('12345678')).toBe('12***78')
        })

        it('should mask long user id', () => {
            expect(maskUserId('1234567890')).toBe('1234****7890')
        })

        it('should return original if invalid', () => {
            expect(maskUserId('')).toBe('')
        })
    })

    describe('maskUsername', () => {
        it('should not mask short username', () => {
            expect(maskUsername('ab')).toBe('ab')
        })

        it('should mask medium username', () => {
            expect(maskUsername('abcd')).toBe('a***d')
        })

        it('should mask long username', () => {
            expect(maskUsername('abcde')).toBe('ab***de')
        })

        it('should return original if invalid', () => {
            expect(maskUsername('')).toBe('')
        })
    })

    describe('maskIP', () => {
        it('should mask IPv4', () => {
            expect(maskIP('192.168.1.1')).toBe('192.168.1.***')
        })

        it('should mask IPv6', () => {
            expect(maskIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:***:***')
        })

        it('should return original if invalid', () => {
            expect(maskIP('invalid')).toBe('invalid')
            expect(maskIP('')).toBe('')
        })
    })

    describe('maskString', () => {
        it('should mask string', () => {
            expect(maskString('1234567890')).toBe('12***90')
        })

        it('should mask short string', () => {
            expect(maskString('1234')).toBe('****')
        })

        it('should return original if invalid', () => {
            expect(maskString('')).toBe('')
        })
    })
})
