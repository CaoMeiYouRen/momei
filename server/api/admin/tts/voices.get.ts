import { TTSService } from '@/server/services/tts'
import { success } from '@/server/utils/response'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const providerName = query.provider as string | undefined

    const provider = await TTSService.getProvider(providerName)
    const voices = await provider.getVoices()

    return success(voices)
})
