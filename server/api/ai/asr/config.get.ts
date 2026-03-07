import { getSettings } from '~/server/services/setting'
import { getASRConfigStatus } from '~/server/utils/ai/asr-credentials'
import { SettingKey } from '~/types/setting'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const settings = await getSettings([
        SettingKey.ASR_ENABLED,
        SettingKey.ASR_API_KEY,
        SettingKey.ASR_SILICONFLOW_API_KEY,
        SettingKey.ASR_VOLCENGINE_APP_ID,
        SettingKey.ASR_VOLCENGINE_ACCESS_KEY,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
    ])

    const status = getASRConfigStatus(settings as Record<string, string | undefined>)

    return {
        enabled: settings[SettingKey.ASR_ENABLED] !== 'false',
        siliconflow: status.siliconflow,
        volcengine: status.volcengine,
    }
})
