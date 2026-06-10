import { TTSService } from '~/server/services/ai/tts'
import { toQueryString } from '~/server/utils/query-params'
import { success } from '~/server/utils/response'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const query = getQuery(event)
    const mode = toQueryString(query.mode)
    const voices = await TTSService.getVoices(toQueryString(query.provider), {
        mode: mode === 'speech' || mode === 'podcast' ? mode : undefined,
    })

    return success(voices)
})
