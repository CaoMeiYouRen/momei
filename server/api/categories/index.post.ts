import { categoryBodySchema } from '@/utils/schemas/category'
import { createCategory } from '@/server/services/category'
import { requireAdmin } from '@/server/utils/permission'
import { invalidateRuntimeApiCacheNamespace } from '@/server/utils/api-runtime-cache'

const CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE = 'categories:public-list'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const body = await readValidatedBody(event, (b) => categoryBodySchema.parse(b))

    // 使用统一的分类创建服务逻辑
    const category = await createCategory(body)
    invalidateRuntimeApiCacheNamespace(CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE)

    return {
        code: 200,
        data: category,
    }
})
