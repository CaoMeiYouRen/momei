import { categoryUpdateSchema } from '@/utils/schemas/category'
import { updateCategory } from '@/server/services/category'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => categoryUpdateSchema.parse(b))

    // 使用统一的分类更新服务逻辑
    const category = await updateCategory(id, body)

    return success(category)
})
