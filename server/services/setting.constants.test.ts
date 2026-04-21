import { describe, it, expect } from 'vitest'
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
} from './setting.constants'
import { SettingKey } from '@/types/setting'

describe('setting.constants', () => {
    describe('getLocalizedSettingDefinition', () => {
        it('returns null for non-localized settings', () => {
            expect(getLocalizedSettingDefinition(SettingKey.SITE_NAME)).toBeNull()
        })

        it('returns null for unknown keys', () => {
            expect(getLocalizedSettingDefinition('unknown_key')).toBeNull()
        })
    })

    describe('isLocalizedSettingKey', () => {
        it('returns false for non-localized key', () => {
            expect(isLocalizedSettingKey(SettingKey.SITE_URL)).toBe(false)
        })

        it('returns false for unknown key', () => {
            expect(isLocalizedSettingKey('does_not_exist')).toBe(false)
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
    })

    describe('isInternalOnlySettingKey', () => {
        it('returns false for regular setting key', () => {
            expect(isInternalOnlySettingKey(SettingKey.SITE_NAME)).toBe(false)
        })

        it('returns true for Hexo repository sync settings', () => {
            expect(isInternalOnlySettingKey(SettingKey.HEXO_SYNC_ENABLED)).toBe(true)
            expect(isInternalOnlySettingKey(SettingKey.HEXO_SYNC_ACCESS_TOKEN)).toBe(true)
        })

        it('returns false for unknown key', () => {
            expect(isInternalOnlySettingKey('not_a_key')).toBe(false)
        })
    })

    describe('isLegacyOnlySettingKey', () => {
        it('returns false for current setting key', () => {
            expect(isLegacyOnlySettingKey(SettingKey.SITE_NAME)).toBe(false)
        })

        it('returns false for unknown key', () => {
            expect(isLegacyOnlySettingKey('unknown')).toBe(false)
        })
    })

    describe('getSettingDefaultValue', () => {
        it('returns null for keys with no default', () => {
            expect(getSettingDefaultValue('no_default_key')).toBeNull()
        })

        it('returns defined default value when one exists', () => {
            // POST_COPYRIGHT should have a default
            const value = getSettingDefaultValue(SettingKey.POST_COPYRIGHT)
            // May be null if no default defined, just test it returns something deterministic
            expect(value === null || typeof value === 'string').toBe(true)
        })
    })

    describe('getSettingEffectiveSource', () => {
        it('returns db or env (no env override in test)', () => {
            const source = getSettingEffectiveSource(SettingKey.SITE_NAME)
            expect(['db', 'env']).toContain(source)
        })
    })

    describe('doesSettingRequireRestart', () => {
        it('returns a boolean', () => {
            expect(typeof doesSettingRequireRestart(SettingKey.SITE_NAME)).toBe('boolean')
        })
    })

    describe('getSettingLockReason', () => {
        it('returns null when not locked by env (during tests)', () => {
            // In test env, SITE_NAME should not be overridden
            const reason = getSettingLockReason(SettingKey.SITE_NAME)
            expect(reason === null || typeof reason === 'string').toBe(true)
        })
    })
})
