import { PostAutomationService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { aiRecommendCategoriesExternalSchema } from '@/utils/schemas/ai'
import { isAdmin } from '@/utils/shared/roles'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = await readValidatedBody(event, (value) => aiRecommendCategoriesExternalSchema.parse(value))

    const result = await PostAutomationService.recommendCategoriesForPost({
        postId: body.postId,
        targetLanguage: body.targetLanguage,
        sourceLanguage: body.sourceLanguage,
        limit: body.limit,
    }, {
        userId: user.id,
        isAdmin: isAdmin(user.role),
    })

    return {
        code: 200,
        data: result,
    }
})
