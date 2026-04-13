import { tagBodySchema } from '@/utils/schemas/tag'
import { createTag } from '@/server/services/tag'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { invalidateRuntimeApiCacheNamespace } from '@/server/utils/api-runtime-cache'

const TAG_PUBLIC_LIST_CACHE_NAMESPACE = 'tags:public-list'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => tagBodySchema.parse(b))

    // 使用统一的标签创建服务逻辑
    const tag = await createTag(body)
    invalidateRuntimeApiCacheNamespace(TAG_PUBLIC_LIST_CACHE_NAMESPACE)

    return {
        code: 200,
        data: tag,
    }
})
