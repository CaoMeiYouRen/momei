import { categoryBodySchema } from '@/utils/schemas/category'
import { createCategory } from '@/server/services/category'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => categoryBodySchema.parse(b))

    // 使用统一的分类创建服务逻辑
    const category = await createCategory(body)

    return {
        code: 200,
        data: category,
    }
})
