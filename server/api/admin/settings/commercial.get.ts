import { getSetting } from '@/server/services/setting'
import { requireAdmin } from '@/server/utils/permission'
import { SettingKey } from '@/types/setting'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const raw = await getSetting(SettingKey.COMMERCIAL_SPONSORSHIP)
    const config = raw ? JSON.parse(raw) : { enabled: false, donationLinks: [], socialLinks: [] }

    return success(config)
})
