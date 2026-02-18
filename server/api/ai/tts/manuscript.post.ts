import { AIService } from '~/server/services/ai/text'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { content, language = 'zh-CN' } = body

    if (!content) {
        throw createError({ statusCode: 400, message: 'Content is required' })
    }

    const manuscript = await AIService.optimizeManuscript(
        content,
        language,
        session.user.id,
    )

    return success({
        manuscript,
    })
})
