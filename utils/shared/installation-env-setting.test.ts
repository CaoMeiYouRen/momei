import { describe, expect, it } from 'vitest'
import { resolveInstallationEnvLockMessage } from './installation-env-setting'

describe('installation-env-setting', () => {
    const translate = (key: string, params?: Record<string, string>) => {
        if (!params) {
            return key
        }

        return `${key}:${JSON.stringify(params)}`
    }

    it('returns empty message when env setting is not locked', () => {
        expect(resolveInstallationEnvLockMessage(translate, 'site_title')).toBe('')
        expect(resolveInstallationEnvLockMessage(translate, 'site_title', {
            value: 'Momei',
            isLocked: false,
            maskType: 'plain',
            envKey: 'SITE_TITLE',
            lockReason: null,
        })).toBe('')
    })

    it('returns forced lock message when lock reason is forced_env_lock', () => {
        expect(resolveInstallationEnvLockMessage(translate, 'site_title', {
            value: 'Momei',
            isLocked: true,
            maskType: 'plain',
            envKey: 'SITE_TITLE',
            lockReason: 'forced_env_lock',
        })).toBe('pages.admin.settings.system.smart_mode.messages.forced_env_lock')
    })

    it('falls back to env override message and derives env key from field key', () => {
        expect(resolveInstallationEnvLockMessage(translate, 'site_title', {
            value: 'Momei',
            isLocked: true,
            maskType: 'plain',
            envKey: null,
            lockReason: 'env_override',
        })).toBe('pages.admin.settings.system.smart_mode.messages.env_override:{"envKey":"SITE_TITLE"}')
    })
})
