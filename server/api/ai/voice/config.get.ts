import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'

export default defineEventHandler(async () => {
    const settings = await getSettings([
        SettingKey.ASR_SILICONFLOW_API_KEY,
        SettingKey.ASR_VOLCENGINE_APP_ID,
    ])

    return {
        siliconflow: !!settings[SettingKey.ASR_SILICONFLOW_API_KEY],
        volcengine: !!settings[SettingKey.ASR_VOLCENGINE_APP_ID],
    }
})
