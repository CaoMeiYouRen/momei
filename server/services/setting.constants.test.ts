import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getLocalizedSettingDefinition,
    isLocalizedSettingKey,
    getSettingLookupKeys,
    isInternalOnlySettingKey,
    isLegacyOnlySettingKey,
    getSettingDefaultValue,
    getSettingEffectiveSource,
    doesSettingRequireRestart,
    getSettingLockReason,
    isAdminSettingsExcludedKey,
    isSettingEnvLocked,
    resolveSettingEnvEntry,
} from './setting.constants'
import { SettingKey } from '@/types/setting'

beforeEach(() => {
    vi.unstubAllEnvs()
})

describe('setting.constants', () => {
    describe('getLocalizedSettingDefinition', () => {
        it('returns null for non-localized settings', () => {
            expect(getLocalizedSettingDefinition(SettingKey.SITE_NAME)).toBeNull()
        })

        it('returns null for unknown keys', () => {
            expect(getLocalizedSettingDefinition('unknown_key')).toBeNull()
        })

        it('returns definition for localized settings', () => {
            const def = getLocalizedSettingDefinition(SettingKey.SITE_TITLE)
            expect(def).not.toBeNull()
            expect(def?.key).toBe(SettingKey.SITE_TITLE)
            expect(def?.valueType).toBe('localized-text')
            expect(def?.publicReadable).toBe(true)
            expect(def?.adminEditable).toBe(true)
        })
    })

    describe('isLocalizedSettingKey', () => {
        it('returns false for non-localized key', () => {
            expect(isLocalizedSettingKey(SettingKey.SITE_URL)).toBe(false)
        })

        it('returns false for unknown key', () => {
            expect(isLocalizedSettingKey('does_not_exist')).toBe(false)
        })

        it('returns true for localized setting key', () => {
            expect(isLocalizedSettingKey(SettingKey.SITE_DESCRIPTION)).toBe(true)
            expect(isLocalizedSettingKey(SettingKey.SITE_KEYWORDS)).toBe(true)
        })
    })

    describe('getSettingLookupKeys', () => {
        it('returns at least the key itself', () => {
            const keys = getSettingLookupKeys(SettingKey.SITE_NAME)
            expect(keys).toContain(SettingKey.SITE_NAME)
        })

        it('returns an array', () => {
            expect(Array.isArray(getSettingLookupKeys(SettingKey.SITE_URL))).toBe(true)
        })

        it('includes legacy aliases when they exist', () => {
            // POST_COPYRIGHT has legacy alias 'site_copyright'
            const keys = getSettingLookupKeys(SettingKey.POST_COPYRIGHT)
            expect(keys).toContain(SettingKey.POST_COPYRIGHT)
            expect(keys).toContain('site_copyright')
        })

        it('deduplicates keys when alias matches the key itself', () => {
            const keys = getSettingLookupKeys(SettingKey.SITE_NAME)
            // No legacy aliases for SITE_NAME
            expect(keys).toEqual([SettingKey.SITE_NAME])
        })
    })

    describe('isInternalOnlySettingKey', () => {
        it('returns false for regular setting key', () => {
            expect(isInternalOnlySettingKey(SettingKey.SITE_NAME)).toBe(false)
        })

        it('returns true for Hexo repository sync settings', () => {
            expect(isInternalOnlySettingKey(SettingKey.HEXO_SYNC_ENABLED)).toBe(true)
            expect(isInternalOnlySettingKey(SettingKey.HEXO_SYNC_ACCESS_TOKEN)).toBe(true)
        })

        it('returns true for ASR volcengine secret key', () => {
            expect(isInternalOnlySettingKey(SettingKey.ASR_VOLCENGINE_SECRET_KEY)).toBe(true)
        })

        it('returns true for Web push private key', () => {
            expect(isInternalOnlySettingKey(SettingKey.WEB_PUSH_VAPID_PRIVATE_KEY)).toBe(true)
        })

        it('returns false for unknown key', () => {
            expect(isInternalOnlySettingKey('not_a_key')).toBe(false)
        })
    })

    describe('isAdminSettingsExcludedKey', () => {
        it('returns false for a regular setting key', () => {
            expect(isAdminSettingsExcludedKey(SettingKey.SITE_NAME)).toBe(false)
        })

        it('returns true for Hexo sync enabled', () => {
            expect(isAdminSettingsExcludedKey(SettingKey.HEXO_SYNC_ENABLED)).toBe(true)
        })

        it('returns false for unknown key', () => {
            expect(isAdminSettingsExcludedKey('unknown_key')).toBe(false)
        })
    })

    describe('isLegacyOnlySettingKey', () => {
        it('returns false for current setting key', () => {
            expect(isLegacyOnlySettingKey(SettingKey.SITE_NAME)).toBe(false)
        })

        it('returns false for unknown key', () => {
            expect(isLegacyOnlySettingKey('unknown')).toBe(false)
        })

        it('returns true for legacy alias key', () => {
            // 'site_copyright' is a legacy alias for POST_COPYRIGHT
            expect(isLegacyOnlySettingKey('site_copyright')).toBe(true)
        })
    })

    describe('getSettingDefaultValue', () => {
        it('returns null for keys with no default', () => {
            expect(getSettingDefaultValue('no_default_key')).toBeNull()
        })

        it('returns defined default value when one exists', () => {
            const value = getSettingDefaultValue(SettingKey.DEFAULT_LANGUAGE)
            expect(value).toBe('zh-CN')
        })

        it('returns number as string for numeric defaults', () => {
            const value = getSettingDefaultValue(SettingKey.POSTS_PER_PAGE)
            expect(value).toBe('10')
        })

        it('returns string for boolean-like defaults', () => {
            const value = getSettingDefaultValue(SettingKey.FRIEND_LINKS_ENABLED)
            expect(value).toBe('true')
        })
    })

    describe('resolveSettingEnvEntry', () => {
        it('returns empty result when env var is not set', () => {
            const result = resolveSettingEnvEntry(SettingKey.SITE_NAME)
            // NUXT_PUBLIC_APP_NAME not set in test env
            expect(result.value).toBeUndefined()
            expect(result.envKey).toBe('NUXT_PUBLIC_APP_NAME')
        })

        it('returns env value when env var is set', () => {
            vi.stubEnv('NUXT_PUBLIC_APP_NAME', 'Test Blog')
            const result = resolveSettingEnvEntry(SettingKey.SITE_NAME)
            expect(result.value).toBe('Test Blog')
            expect(result.envKey).toBe('NUXT_PUBLIC_APP_NAME')
        })

        it('checks legacy env aliases when primary is not set', () => {
            // POST_COPYRIGHT has legacy env alias 'NUXT_PUBLIC_DEFAULT_COPYRIGHT'
            vi.stubEnv('NUXT_PUBLIC_DEFAULT_COPYRIGHT', 'legacy value')
            const result = resolveSettingEnvEntry(SettingKey.POST_COPYRIGHT)
            expect(result.value).toBe('legacy value')
            expect(result.envKey).toBe('NUXT_PUBLIC_DEFAULT_COPYRIGHT')
        })

        it('returns null envKey when setting has no env mapping', () => {
            const result = resolveSettingEnvEntry('non_existent_setting_key')
            expect(result.envKey).toBeNull()
            expect(result.value).toBeUndefined()
        })
    })

    describe('getSettingEffectiveSource', () => {
        it('returns env when internal-only key', () => {
            const source = getSettingEffectiveSource(SettingKey.ASR_VOLCENGINE_SECRET_KEY)
            expect(source).toBe('env')
        })

        it('returns env when env var overrides', () => {
            vi.stubEnv('NUXT_PUBLIC_APP_NAME', 'overridden')
            const source = getSettingEffectiveSource(SettingKey.SITE_NAME)
            expect(source).toBe('env')
        })

        it('returns db when no env override', () => {
            const source = getSettingEffectiveSource(SettingKey.SITE_NAME)
            expect(source).toBe('db')
        })
    })

    describe('isSettingEnvLocked', () => {
        it('returns true for internal-only setting keys', () => {
            expect(isSettingEnvLocked(SettingKey.ASR_VOLCENGINE_SECRET_KEY)).toBe(true)
        })

        it('returns true when env var is set', () => {
            vi.stubEnv('NUXT_PUBLIC_APP_NAME', 'overridden')
            expect(isSettingEnvLocked(SettingKey.SITE_NAME)).toBe(true)
        })

        it('returns true for forced env locked keys', () => {
            expect(isSettingEnvLocked(SettingKey.SITE_URL)).toBe(true)
        })

        it('returns false when no env override and not locked', () => {
            expect(isSettingEnvLocked(SettingKey.AI_ENABLED)).toBe(false)
        })
    })

    describe('doesSettingRequireRestart', () => {
        it('returns true for env-locked settings that require restart', () => {
            expect(doesSettingRequireRestart(SettingKey.SITE_URL)).toBe(true)
            expect(doesSettingRequireRestart(SettingKey.EMAIL_REQUIRE_VERIFICATION)).toBe(true)
        })

        it('returns false for non-restart-required setting', () => {
            expect(doesSettingRequireRestart(SettingKey.SITE_NAME)).toBe(false)
        })
    })

    describe('getSettingLockReason', () => {
        it('returns null when not locked by env (during tests)', () => {
            const reason = getSettingLockReason(SettingKey.SITE_NAME)
            expect(reason).toBeNull()
        })

        it('returns env_override when env var is set', () => {
            vi.stubEnv('NUXT_PUBLIC_APP_NAME', 'overridden')
            expect(getSettingLockReason(SettingKey.SITE_NAME)).toBe('env_override')
        })

        it('returns forced_env_lock for internal-only keys', () => {
            expect(getSettingLockReason(SettingKey.ASR_VOLCENGINE_SECRET_KEY)).toBe('forced_env_lock')
        })

        it('returns forced_env_lock for FORCED_ENV_LOCKED_KEYS', () => {
            expect(getSettingLockReason(SettingKey.SITE_URL)).toBe('forced_env_lock')
        })
    })
})
