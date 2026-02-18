import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    content: z.string().min(1),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const refined = await TextService.refineVoice(
        body.content,
        body.language,
        session.user.id,
    )

    return {
        code: 200,
        data: refined,
    }
})
