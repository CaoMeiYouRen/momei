import { z } from 'zod'
import { TextService } from '@/server/services/ai'
import { requireAdminOrAuthor } from '@/server/utils/permission'

const schema = z.object({
    title: z.string().optional().default(''),
    summary: z.string().optional().default(''),
    content: z.string().optional().default(''),
    language: z.string().optional().default('zh-CN'),
    assetUsage: z.enum(['post-cover', 'post-illustration', 'topic-hero', 'event-poster']).optional().default('post-cover'),
    applyMode: z.enum(['auto-apply', 'manual-confirm']).optional(),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const { title, summary, content, language, assetUsage, applyMode } = body
    const imagePrompt = await TextService.suggestImagePrompt(
        { title, summary, content, language, assetUsage, applyMode },
        session.user.id,
    )

    return {
        code: 200,
        data: imagePrompt,
    }
})
