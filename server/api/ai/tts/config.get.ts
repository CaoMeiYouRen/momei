import { TTSService } from '@/server/services/ai'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const defaultProvider = await getSetting(SettingKey.TTS_PROVIDER, 'openai')
    const availableProviders = await TTSService.getAvailableProviders()

    return success({
        defaultProvider,
        availableProviders,
    })
})
