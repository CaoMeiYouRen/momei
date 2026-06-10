import { z } from 'zod'
import { TextService } from '~/server/services/ai/text'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

const manuscriptBodySchema = z.object({
    content: z.string().min(1),
    language: z.string().max(10).optional().default('zh-CN'),
    mode: z.enum(['speech', 'podcast']).optional().default('speech'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const { content, language, mode } = await readValidatedBody(event, (payload) => manuscriptBodySchema.parse(payload))

    const manuscript = await TextService.optimizeManuscript(
        content,
        language,
        session.user.id,
        mode === 'podcast' ? 'podcast' : 'speech',
    )

    return success({
        manuscript,
    })
})
