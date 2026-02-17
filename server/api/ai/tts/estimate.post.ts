import { TTSService } from '@/server/services/tts'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readBody(event)
    const { provider: providerName, voice, text } = body

    if (!voice || !text) {
        throw createError({ statusCode: 400, message: 'Voice and text are required' })
    }

    const provider = await TTSService.getProvider(providerName as string)
    const cost = await provider.estimateCost(text, voice as string)

    return success({ cost })
})
