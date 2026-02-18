import { TTSService } from '@/server/services/ai'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { voice, text } = body

    if (!voice || !text) {
        throw createError({ statusCode: 400, message: 'Voice and text are required' })
    }

    const cost = await TTSService.estimateCost(text, voice as string)

    return success({ cost })
})
