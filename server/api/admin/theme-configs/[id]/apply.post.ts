import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { applyThemeConfigService } from '@/server/services/theme-config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const result = await applyThemeConfigService(id)
    return success(result)
})
