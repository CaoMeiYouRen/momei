import { categoryQuerySchema } from '@/utils/schemas/category'
import { paginate } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { queryCategoryPublicList } from '@/server/utils/category-public-list'

export default defineEventHandler(async (event) => {
    // Authenticate API key — user is not needed for read-only public data access
    const { user } = await validateApiKeyRequest(event)
    void user

    const query = await getValidatedQuery(event, (q) => categoryQuerySchema.parse(q))
    const result = await queryCategoryPublicList(query)

    return {
        code: 200,
        data: paginate(result.items, result.total, result.page, result.limit),
    }
})
