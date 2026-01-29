import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { getThemeConfigsService } from '@/server/services/theme-config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const configs = await getThemeConfigsService()
    return success(configs)
})
