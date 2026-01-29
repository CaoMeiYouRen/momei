import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { updateThemeConfigService } from '@/server/services/theme-config'
import { themeConfigSchema } from '@/utils/schemas/theme-config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const validated = themeConfigSchema.parse(body)

    const config = await updateThemeConfigService(id, validated)
    return success(config)
})
