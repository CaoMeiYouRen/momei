import { describe, expect, it } from 'vitest'
import { getInstallationChecklist } from './installation-checklist'

describe('getInstallationChecklist', () => {
    it('should expose grouped production setup guidance', () => {
        const checklist = getInstallationChecklist('production')

        expect(checklist.immediate.map((item) => item.key)).toEqual([
            'site_identity',
            'locale_timezone',
            'admin_access',
            'seo_visibility',
        ])
        expect(checklist.later.map((item) => item.key)).toEqual([
            'auth_experience',
            'storage_delivery',
            'ai_workflow',
            'notifications',
        ])
    })

    it('should expose demo-first guidance without reusing production checklist items', () => {
        const checklist = getInstallationChecklist('demo')

        expect(checklist.immediate.map((item) => item.key)).toEqual([
            'demo_public',
            'demo_creator',
            'demo_locale',
        ])
        expect(checklist.later.map((item) => item.key)).toEqual([
            'demo_production_identity',
            'demo_integrations',
            'demo_notifications',
        ])
        expect(checklist.immediate.every((item) => item.link)).toBe(true)
        expect(checklist.later.every((item) => item.link)).toBe(true)
    })
})
