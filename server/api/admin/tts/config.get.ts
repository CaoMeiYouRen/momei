import { TTSService } from '@/server/services/tts'
import { success } from '@/server/utils/response'
import { requireAdmin } from '@/server/utils/permission'
import { getSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const defaultProvider = await getSetting(SettingKey.TTS_PROVIDER, 'openai')
    const availableProviders = await TTSService.getAvailableProviders()

    return success({
        defaultProvider,
        availableProviders,
    })
})
