import { categoryUpdateSchema } from '@/utils/schemas/category'
import { updateCategory } from '@/server/services/category'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => categoryUpdateSchema.parse(b))

    // 使用统一的分类更新服务逻辑
    const category = await updateCategory(id, body)

    return {
        code: 200,
        data: category,
    }
})
