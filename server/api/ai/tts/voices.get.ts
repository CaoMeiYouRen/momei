import { TTSService } from '~/server/services/ai/tts'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const voices = await TTSService.getVoices()

    return success(voices)
})
