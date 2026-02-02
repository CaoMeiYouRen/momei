import { describe, expect, it, vi } from 'vitest'
import { maskSettingValue, isMaskedSettingPlaceholder, inferSettingMaskType } from './settings'

// Mock dependencies
vi.mock('@/utils/shared/privacy', () => ({
    maskEmail: vi.fn((email: string) => {
        const [local, domain] = email.split('@')
        if (!local || !domain) {
            return email
        }
        return `${local.substring(0, 2)}***@${domain}`
    }),
    maskString: vi.fn((str: string, start: number, end: number) => {
        if (str.length <= start + end) {
            return '****'
        }
        return `${str.substring(0, start)}****${str.substring(str.length - end)}`
    }),
}))

describe('settings utils', () => {
    describe('maskSettingValue', () => {
        it('should mask password type as asterisks', () => {
            const result = maskSettingValue('mySecretPassword123', 'password')
            expect(result).toBe('********')
        })

        it('should mask key type with partial visibility', () => {
            const result = maskSettingValue('abcd1234efgh5678', 'key')
            expect(result).toBe('abcd****5678')
        })

        it('should mask email type', () => {
            const result = maskSettingValue('user@example.com', 'email')
            expect(result).toBe('us***@example.com')
        })

        it('should return original value for unknown type', () => {
            const result = maskSettingValue('someValue', 'unknown')
            expect(result).toBe('someValue')
        })

        it('should return null for null value', () => {
            const result = maskSettingValue(null, 'password')
            expect(result).toBeNull()
        })

        it('should return empty string for empty value', () => {
            const result = maskSettingValue('', 'password')
            expect(result).toBe('')
        })
    })

    describe('isMaskedSettingPlaceholder', () => {
        it('should detect password placeholder', () => {
            expect(isMaskedSettingPlaceholder('********', 'password')).toBe(true)
        })

        it('should detect key placeholder with 4 asterisks', () => {
            expect(isMaskedSettingPlaceholder('abcd****5678', 'key')).toBe(true)
        })

        it('should detect key placeholder with 3 asterisks', () => {
            expect(isMaskedSettingPlaceholder('abc***5678', 'key')).toBe(true)
        })

        it('should detect email placeholder', () => {
            expect(isMaskedSettingPlaceholder('us***@example.com', 'email')).toBe(true)
        })

        it('should return false for non-placeholder password', () => {
            expect(isMaskedSettingPlaceholder('myPassword', 'password')).toBe(false)
        })

        it('should return false for non-placeholder key', () => {
            expect(isMaskedSettingPlaceholder('abcd1234', 'key')).toBe(false)
        })

        it('should return false for non-placeholder email', () => {
            expect(isMaskedSettingPlaceholder('user@example.com', 'email')).toBe(false)
        })

        it('should return false for empty value', () => {
            expect(isMaskedSettingPlaceholder('', 'password')).toBe(false)
        })

        it('should return false for key placeholder that is too short', () => {
            expect(isMaskedSettingPlaceholder('ab****', 'key')).toBe(false)
        })
    })

    describe('inferSettingMaskType', () => {
        it('should infer password type from key containing "pass"', () => {
            expect(inferSettingMaskType('DB_PASSWORD')).toBe('password')
            expect(inferSettingMaskType('user_pass')).toBe('password')
        })

        it('should infer password type from key containing "secret"', () => {
            expect(inferSettingMaskType('API_SECRET')).toBe('password')
            expect(inferSettingMaskType('client_secret')).toBe('password')
        })

        it('should infer key type from key containing "key"', () => {
            expect(inferSettingMaskType('API_KEY')).toBe('key')
            expect(inferSettingMaskType('encryption_key')).toBe('key')
        })

        it('should infer email type from key containing "email" with @ in value', () => {
            expect(inferSettingMaskType('ADMIN_EMAIL', 'admin@example.com')).toBe('email')
            expect(inferSettingMaskType('support_email', 'support@test.com')).toBe('email')
        })

        it('should infer email type from key containing "user" with @ in value', () => {
            expect(inferSettingMaskType('SMTP_USER', 'smtp@example.com')).toBe('email')
        })

        it('should return none for email key without @ in value', () => {
            expect(inferSettingMaskType('ADMIN_EMAIL', 'admin')).toBe('none')
        })

        it('should return none for unknown key patterns', () => {
            expect(inferSettingMaskType('DATABASE_HOST')).toBe('none')
            expect(inferSettingMaskType('PORT')).toBe('none')
        })

        it('should be case insensitive', () => {
            expect(inferSettingMaskType('db_PASSWORD')).toBe('password')
            expect(inferSettingMaskType('Api_Key')).toBe('key')
            expect(inferSettingMaskType('ADMIN_email', 'test@example.com')).toBe('email')
        })

        it('should prioritize password over key when both patterns match', () => {
            expect(inferSettingMaskType('PASSWORD_KEY')).toBe('password')
        })

        it('should handle empty value parameter', () => {
            expect(inferSettingMaskType('SOME_KEY')).toBe('key')
            expect(inferSettingMaskType('SOME_EMAIL')).toBe('none')
        })
    })
})
