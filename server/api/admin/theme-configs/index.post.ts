import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { createThemeConfigService } from '@/server/services/theme-config'
import { themeConfigSchema } from '@/utils/schemas/theme-config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const body = await readBody(event)

    // 校验参数
    const validated = themeConfigSchema.parse(body)

    const config = await createThemeConfigService(validated)
    return success(config)
})
