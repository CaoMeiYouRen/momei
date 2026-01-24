import { z } from 'zod'
import { AIService } from '@/server/services/ai'

const schema = z.object({
    content: z.string().min(10),
    maxLength: z.number().optional().default(200),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const summary = await AIService.summarize(
        body.content,
        body.maxLength,
        body.language,
        session.user.id,
    )

    return {
        code: 200,
        data: summary,
    }
})
