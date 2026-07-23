import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    content: z.string().min(1),
    style: z.enum(['formal', 'casual', 'academic', 'technical', 'creative', 'concise']).optional().default('casual'),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const rewritten = await TextService.rewrite(
        body.content,
        body.style,
        body.language,
        session.user.id,
    )

    return {
        code: 200,
        data: rewritten,
    }
})
