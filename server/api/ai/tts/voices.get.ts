import { TTSService } from '~/server/services/ai/tts'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const query = getQuery(event)
    const voices = await TTSService.getVoices(query.provider as string, {
        mode: query.mode as 'speech' | 'podcast' | undefined,
    })

    return success(voices)
})
