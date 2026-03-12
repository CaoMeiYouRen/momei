import { describe, expect, it } from 'vitest'
import { buildAdminSettingsTabLocation, resolveAdminSettingsTab } from './admin-settings-tabs'

describe('admin settings tabs helpers', () => {
    it('normalizes tab query values to known tabs', () => {
        expect(resolveAdminSettingsTab('agreements')).toBe('agreements')
        expect(resolveAdminSettingsTab('notifications')).toBe('notifications')
        expect(resolveAdminSettingsTab(['storage'])).toBe('storage')
        expect(resolveAdminSettingsTab('unknown')).toBe('general')
        expect(resolveAdminSettingsTab(undefined)).toBe('general')
    })

    it('builds a route location that preserves existing query params', () => {
        expect(buildAdminSettingsTabLocation({
            path: '/admin/settings',
            query: {
                keyword: 'mail',
            },
        }, 'agreements')).toEqual({
            path: '/admin/settings',
            query: {
                keyword: 'mail',
                tab: 'agreements',
            },
        })
    })
})
