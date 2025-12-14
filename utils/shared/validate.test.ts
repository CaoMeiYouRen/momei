import { describe, it, expect } from 'vitest'
import {
    validateEmail,
    validatePhone,
    validateUrl,
    validateUsername,
    usernameValidator,
    nicknameValidator,
} from './validate'

describe('validate.ts', () => {
    describe('validateEmail', () => {
        it('should return true for valid emails', () => {
            expect(validateEmail('test@example.com')).toBe(true)
            expect(validateEmail('user.name@domain.co.uk')).toBe(true)
            expect(validateEmail('user+tag@example.com')).toBe(true)
        })

        it('should return false for invalid emails', () => {
            expect(validateEmail('invalid-email')).toBe(false)
            expect(validateEmail('@example.com')).toBe(false)
            expect(validateEmail('user@')).toBe(false)
            expect(validateEmail('user@domain')).toBe(false) // require_tld: true
            expect(validateEmail('user@192.168.1.1')).toBe(false) // allow_ip_domain: false
        })
    })

    describe('validatePhone', () => {
        it('should return true for valid phones', () => {
            expect(validatePhone('+8613800138000')).toBe(true)
            expect(validatePhone('+12025550123')).toBe(true)
        })

        it('should return false for invalid phones', () => {
            expect(validatePhone('123')).toBe(false)
            expect(validatePhone('abc')).toBe(false)
            expect(validatePhone('13800138000')).toBe(false) // strictMode: true, requires +
        })
    })

    describe('validateUrl', () => {
        it('should return true for valid URLs', () => {
            expect(validateUrl('https://example.com')).toBe(true)
            expect(validateUrl('http://example.com/path?query=1')).toBe(true)
        })

        it('should return false for invalid URLs', () => {
            expect(validateUrl('ftp://example.com')).toBe(false) // protocols: ['http', 'https']
            expect(validateUrl('example.com')).toBe(false) // require_protocol: true
            expect(validateUrl('https://')).toBe(false) // require_host: true
        })
    })

    describe('validateUsername', () => {
        it('should return true for valid usernames', () => {
            expect(validateUsername('user123')).toBe(true)
            expect(validateUsername('user_name')).toBe(true)
            expect(validateUsername('user-name')).toBe(true)
            expect(validateUsername('ab')).toBe(true)
        })

        it('should return false for invalid usernames', () => {
            expect(validateUsername('a')).toBe(false) // length < 2
            expect(validateUsername('a'.repeat(37))).toBe(false) // length > 36
            expect(validateUsername('user@name')).toBe(false) // invalid char
            expect(validateUsername('user name')).toBe(false) // invalid char
        })
    })

    describe('usernameValidator', () => {
        it('should return true for valid usernames', () => {
            expect(usernameValidator('validUser')).toBe(true)
        })

        it('should return false for invalid usernames', () => {
            expect(usernameValidator('a')).toBe(false) // invalid format
        })

        it('should return false for email-like usernames', () => {
            expect(usernameValidator('test@example.com')).toBe(false)
        })

        it('should return false for phone-like usernames', () => {
            expect(usernameValidator('13800138000')).toBe(false)
        })
    })

    describe('nicknameValidator', () => {
        it('should return true for valid nicknames', () => {
            expect(nicknameValidator('MyNickname')).toBe(true)
            expect(nicknameValidator('昵称测试')).toBe(true)
        })

        it('should return false for invalid nicknames', () => {
            expect(nicknameValidator('a')).toBe(false) // length < 2
            expect(nicknameValidator(' ')).toBe(false) // space
            // Control characters
            expect(nicknameValidator('\u0000ab')).toBe(false)
        })
    })
})
