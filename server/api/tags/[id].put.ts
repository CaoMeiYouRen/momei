import { tagUpdateSchema } from '@/utils/schemas/tag'
import { updateTag } from '@/server/services/tag'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => tagUpdateSchema.parse(b))

    // 使用统一的标签更新服务逻辑
    const tag = await updateTag(id, body)

    return success(tag)
})
