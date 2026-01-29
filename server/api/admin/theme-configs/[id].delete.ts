import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { deleteThemeConfigService } from '@/server/services/theme-config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const config = await deleteThemeConfigService(id)
    return success(config)
})
