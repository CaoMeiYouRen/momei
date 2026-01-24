import { z } from 'zod'
import { AIService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    title: z.string().min(1),
    content: z.string().min(10),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const slug = await AIService.suggestSlug(
        body.title,
        body.content,
        session.user.id,
    )

    return {
        code: 200,
        data: slug,
    }
})
