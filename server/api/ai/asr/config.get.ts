import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import { requireAdminOrAuthor } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const settings = await getSettings([
        SettingKey.ASR_ENABLED,
        SettingKey.ASR_API_KEY,
        SettingKey.ASR_SILICONFLOW_API_KEY,
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
    ])

    const volcengineAppId = settings[SettingKey.VOLCENGINE_APP_ID]
    const volcengineAccessKey = settings[SettingKey.VOLCENGINE_ACCESS_KEY]

    return {
        enabled: settings[SettingKey.ASR_ENABLED] !== 'false',
        siliconflow: !!(settings[SettingKey.ASR_API_KEY] || settings[SettingKey.ASR_SILICONFLOW_API_KEY]),
        volcengine: !!(volcengineAppId && volcengineAccessKey),
    }
})
