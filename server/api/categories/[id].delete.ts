import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'
import { invalidateRuntimeApiCacheNamespace } from '@/server/utils/api-runtime-cache'
import { safeDeleteCategory } from '@/server/utils/category-delete'

const CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE = 'categories:public-list'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    await requireAdmin(event)

    await safeDeleteCategory(id)
    invalidateRuntimeApiCacheNamespace(CATEGORY_PUBLIC_LIST_CACHE_NAMESPACE)

    return success(null, 200)
})
