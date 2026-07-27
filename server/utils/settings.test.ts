import { describe, expect, it, vi } from 'vitest'
import { inferSettingMaskType, isMaskedSettingPlaceholder, isPublicSettingKey, maskSettingValue, resolveSettingLevel, resolveSettingMaskType } from './settings'
import { SettingKey } from '@/types/setting'

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

        it('should mask key type with short value using fallback mask', () => {
            const result = maskSettingValue('ab', 'key')
            expect(result).toBe('****')
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

        it('should return false for non-mask types', () => {
            expect(isMaskedSettingPlaceholder('some-value', 'none')).toBe(false)
            expect(isMaskedSettingPlaceholder('********', 'none')).toBe(false)
        })

        it('should return false for email placeholder without @', () => {
            expect(isMaskedSettingPlaceholder('***example', 'email')).toBe(false)
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
            expect(inferSettingMaskType('MEMOS_ACCESS_TOKEN')).toBe('password')
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
            expect(inferSettingMaskType('client_secret_key')).toBe('password')
        })

        it('should handle empty value parameter', () => {
            expect(inferSettingMaskType('SOME_KEY')).toBe('key')
            expect(inferSettingMaskType('SOME_EMAIL')).toBe('none')
        })

        it('should not match password when key lacks underscore prefix', () => {
            // Behavior change: now requires _pass (not just pass)
            expect(inferSettingMaskType('DBPASSWORD')).toBe('none')
            expect(inferSettingMaskType('PASSCODE')).toBe('none')
        })

        it('should not match when key lacks underscore suffix for token', () => {
            // Behavior change: now requires endsWith _token
            expect(inferSettingMaskType('TOKEN_VALUE')).toBe('none')
        })

        it('should not match key when key lacks underscore suffix', () => {
            // Behavior change: now requires endsWith _key
            expect(inferSettingMaskType('APIKEY')).toBe('none')
            expect(inferSettingMaskType('KEYSTONE')).toBe('none')
        })

        it('should match password for keys with _pass suffix', () => {
            expect(inferSettingMaskType('SMTP_PASS')).toBe('password')
            expect(inferSettingMaskType('DB_USER_PASS')).toBe('password')
        })

        it('should match password for keys ending with _token', () => {
            expect(inferSettingMaskType('ACCESS_TOKEN')).toBe('password')
            expect(inferSettingMaskType('REFRESH_TOKEN')).toBe('password')
        })

        it('should match password for keys containing _secret', () => {
            // 'MY_SECRET_KEY' -> lower is 'my_secret_key', includes '_secret'
            expect(inferSettingMaskType('MY_SECRET_KEY')).toBe('password')
            expect(inferSettingMaskType('MY_SECRET')).toBe('password')
            expect(inferSettingMaskType('THE_SECRET_VALUE')).toBe('password')
        })

        it('should match key for keys ending with _key', () => {
            expect(inferSettingMaskType('PRIVATE_KEY')).toBe('key')
            expect(inferSettingMaskType('SSH_KEY')).toBe('key')
        })

        it('should match key for keys containing _key at end', () => {
            expect(inferSettingMaskType('ENCRYPTION_KEY')).toBe('key')
            expect(inferSettingMaskType('API_KEY_V2')).toBe('none') // doesn't end with _key
        })
    })

    describe('resolveSettingMaskType', () => {
        it('should upgrade legacy token fields to password masking', () => {
            expect(resolveSettingMaskType(SettingKey.MEMOS_ACCESS_TOKEN, 'token-value', 'key')).toBe('password')
            expect(resolveSettingMaskType(SettingKey.LISTMONK_ACCESS_TOKEN, 'token-value', 'key')).toBe('password')
        })

        it('should keep publicly exposed settings unmasked in admin', () => {
            expect(resolveSettingMaskType(SettingKey.CONTACT_EMAIL, 'public@example.com', 'email')).toBe('none')
            expect(resolveSettingMaskType(SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY, 'public-key-value', 'key')).toBe('none')
        })

        it('should return inferred type when explicit type is lower priority', () => {
            expect(resolveSettingMaskType('DB_PASSWORD', 'secret', 'none')).toBe('password')
        })

        it('should return explicit type when it has higher priority than inferred', () => {
            expect(resolveSettingMaskType('SOME_KEY', 'value', 'password')).toBe('password')
        })

        it('should handle unknown explicit mask type by falling back to inferred', () => {
            expect(resolveSettingMaskType('API_KEY', 'secret-value', 'unknown' as any)).toBe('key')
        })

        it('should return none for empty key with no explicit type', () => {
            expect(resolveSettingMaskType('')).toBe('none')
        })
    })

    describe('isPublicSettingKey', () => {
        it('returns true for known public setting keys', () => {
            expect(isPublicSettingKey(SettingKey.CONTACT_EMAIL)).toBe(true)
            expect(isPublicSettingKey(SettingKey.WEB_PUSH_VAPID_PUBLIC_KEY)).toBe(true)
        })

        it('returns false for non-public setting keys', () => {
            expect(isPublicSettingKey(SettingKey.SITE_URL)).toBe(false)
            expect(isPublicSettingKey(SettingKey.AI_PROVIDER)).toBe(false)
            expect(isPublicSettingKey('UNKNOWN_KEY')).toBe(false)
        })

        it('returns false for empty string', () => {
            expect(isPublicSettingKey('')).toBe(false)
        })
    })

    describe('resolveSettingLevel', () => {
        it('should keep public settings at level 0', () => {
            expect(resolveSettingLevel(SettingKey.CONTACT_EMAIL, 2)).toBe(0)
        })

        it('should keep explicit admin-visible levels when provided', () => {
            expect(resolveSettingLevel(SettingKey.MEMOS_ACCESS_TOKEN, 2)).toBe(2)
        })

        it('should downgrade legacy non-internal level 3 values to admin-visible level 2', () => {
            expect(resolveSettingLevel(SettingKey.MEMOS_ACCESS_TOKEN, 3)).toBe(2)
        })

        it('should default admin-visible settings to level 2', () => {
            expect(resolveSettingLevel(SettingKey.MEMOS_ACCESS_TOKEN)).toBe(2)
        })
    })
})
