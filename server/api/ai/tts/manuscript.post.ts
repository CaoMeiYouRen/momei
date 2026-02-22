import { TextService } from '~/server/services/ai/text'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { content, language = 'zh-CN', mode = 'speech' } = body

    if (!content) {
        throw createError({ statusCode: 400, message: 'Content is required' })
    }

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
