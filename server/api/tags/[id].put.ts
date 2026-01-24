import { tagUpdateSchema } from '@/utils/schemas/tag'
import { updateTag } from '@/server/services/tag'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => tagUpdateSchema.parse(b))

    // 使用统一的标签更新服务逻辑
    const tag = await updateTag(id, body)

    return {
        code: 200,
        data: tag,
    }
})
