import { TextService } from '@/server/services/ai'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { aiRecommendTagsExternalSchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = await readValidatedBody(event, (value) => aiRecommendTagsExternalSchema.parse(value))

    const tags = await TextService.recommendTags(
        body.content,
        body.existingTags,
        body.language,
        user.id,
    )

    return {
        code: 200,
        data: tags,
    }
})
