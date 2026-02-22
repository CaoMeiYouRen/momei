import { TTSService } from '@/server/services/ai'
import { success } from '@/server/utils/response'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getSetting } from '@/server/services/setting'
import { SettingKey } from '@/types/setting'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const defaultProvider = await getSetting(SettingKey.TTS_PROVIDER, 'openai')
    const availableProviders = await TTSService.getAvailableProviders()

    const providerModes = availableProviders.reduce<Record<string, ('speech' | 'podcast')[]>>((acc, provider) => {
        if (provider === 'volcengine') {
            acc[provider] = ['speech', 'podcast']
        } else {
            acc[provider] = ['speech']
        }
        return acc
    }, {})

    return success({
        defaultProvider,
        availableProviders,
        providerModes,
    })
})
