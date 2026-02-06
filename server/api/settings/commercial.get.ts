import { getSetting, SETTING_ENV_MAP } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'
import type { CommercialConfig } from '~/utils/shared/commercial'

export default defineEventHandler(async () => {
    const rawValue = await getSetting(SettingKey.COMMERCIAL_SPONSORSHIP)

    let donationLinks = []
    let enabled = true

    if (rawValue) {
        try {
            const config = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
            donationLinks = config.donationLinks || []
            enabled = config.enabled !== false
        } catch (e) {
            console.error('Failed to parse commercial config:', e)
        }
    }

    const envKey = SETTING_ENV_MAP[SettingKey.COMMERCIAL_SPONSORSHIP]
    const isLocked = !!(envKey && process.env[envKey] !== undefined)

    const data: CommercialConfig = {
        donationLinks,
        enabled,
    }

    return {
        code: 200,
        data,
        meta: {
            isLocked,
        },
    }
})
