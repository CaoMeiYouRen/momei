import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { aiPerspectiveCheckSchema } from '@/utils/schemas/ai'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => aiPerspectiveCheckSchema.parse(b))
    const observations = await TextService.perspectiveCheck(
        body.content,
        body.mode,
        body.language,
        session.user.id,
    )

    return {
        code: 200,
        data: observations,
    }
})
