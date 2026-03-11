import { describe, expect, it } from 'vitest'
import { resolveAdminSettingsTab } from './admin-settings-tabs'

describe('resolveAdminSettingsTab', () => {
    it('returns a known admin settings tab from query input', () => {
        expect(resolveAdminSettingsTab('notifications')).toBe('notifications')
        expect(resolveAdminSettingsTab(['storage'])).toBe('storage')
    })

    it('falls back to general for unknown tabs', () => {
        expect(resolveAdminSettingsTab('unknown')).toBe('general')
        expect(resolveAdminSettingsTab(undefined)).toBe('general')
    })
})
