import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AIService } from '@/server/services/ai'
import { isAdmin, isAuthor } from '@/utils/shared/roles'

const schema = z.object({
    content: z.string().min(10),
    language: z.string().optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || (!isAdmin(session.user.role) && !isAuthor(session.user.role))) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => schema.parse(b))
    const titles = await AIService.suggestTitles(body.content, body.language)

    return {
        code: 200,
        data: titles,
    }
})
