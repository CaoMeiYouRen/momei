import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    title: z.string().optional().default(''),
    content: z.string().optional().default(''),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const { title, content, language } = body
    const imagePrompt = await TextService.suggestImagePrompt(
        { title, content, language },
        session.user.id,
    )

    return {
        code: 200,
        data: imagePrompt,
    }
})
