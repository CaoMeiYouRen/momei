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

        it('should mask long phone number correctly', () => {
            expect(maskPhone('+12025550111')).toBe('+1 202 **** 0111')
        })

        it('should mask medium length phone number correctly', () => {
            // HK number 8 digits
            expect(maskPhone('+85223456789')).toBe('+852 23 *** 89')
        })

        it('should return original if invalid', () => {
            expect(maskPhone('1234567890')).toBe('1234567890')
            expect(maskPhone('110')).toBe('110')
            expect(maskPhone('')).toBe('')
        })

        it('should handle fallback for parsing failure', () => {
            // Something that makes phoneUtil.parse throw: non-phone-like string
            expect(maskPhone('abcdefghijk')).toBe('abcdefghijk')

            // For invalid numbers that don't throw, they currently return plain (line 54)
            expect(maskPhone('123456789012345')).toBe('123456789012345')

            // Hit fallback with enough digits but parse failure
            // Note: phoneUtil.parse might not throw on all non-validated numbers
            // We need something that definitely triggers the catch block and has long digits
            // Using a string that starts with + but followed by trash
            expect(maskPhone('+trash1234567890')).toBe('123****7890')
            expect(maskPhone('+trash1234567')).toBe('12***67')
        })
    })

    describe('maskUserId', () => {
        it('should mask short user id', () => {
            expect(maskUserId('12345678')).toBe('12***78')
        })

        it('should mask long user id', () => {
            expect(maskUserId('1234567890')).toBe('1234****7890')
        })

        it('should handle non-string or empty input', () => {
            expect(maskUserId('')).toBe('')
            // @ts-expect-error testing
            expect(maskUserId(null)).toBe(null)
        })
    })

    describe('maskUsername', () => {
        it('should not mask short username', () => {
            expect(maskUsername('ab')).toBe('ab')
            expect(maskUsername('a')).toBe('a')
        })

        it('should mask medium username', () => {
            expect(maskUsername('abc')).toBe('a***c')
            expect(maskUsername('abcd')).toBe('a***d')
        })

        it('should mask long username', () => {
            expect(maskUsername('abcde')).toBe('ab***de')
        })

        it('should handle non-string or empty input', () => {
            expect(maskUsername('')).toBe('')
            // @ts-expect-error testing
            expect(maskUsername(null)).toBe(null)
        })
    })

    describe('maskIP', () => {
        it('should mask IPv4', () => {
            expect(maskIP('192.168.1.1')).toBe('192.168.1.***')
            expect(maskIP('127.0.0.1')).toBe('127.0.0.***')
        })

        it('should mask IPv6', () => {
            expect(maskIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:***:***')
            // Edge case for IPv6 length < 4 parts
            expect(maskIP('::1')).toBe('::1')
        })

        it('should handle invalid IP', () => {
            expect(maskIP('not-an-ip')).toBe('not-an-ip')
            expect(maskIP('1.2.3')).toBe('1.2.3')
        })

        it('should handle non-string or empty input', () => {
            expect(maskIP('')).toBe('')
            // @ts-expect-error testing
            expect(maskIP(null)).toBe(null)
        })
    })

    describe('maskString', () => {
        it('should mask string', () => {
            expect(maskString('1234567890')).toBe('12***90')
        })

        it('should mask short string', () => {
            expect(maskString('1234')).toBe('****')
            expect(maskString('123')).toBe('***')
        })

        it('should return original if empty', () => {
            expect(maskString('')).toBe('')
        })

        it('should handle non-string', () => {
            // @ts-expect-error testing
            expect(maskString(null)).toBe(null)
        })
    })
})
