import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    content: z.string().min(10),
    existingTags: z.array(z.string()).optional().default([]),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const tags = await TextService.recommendTags(
        body.content,
        body.existingTags,
        body.language,
        session.user.id,
    )

    return {
        code: 200,
        data: tags,
    }
})
