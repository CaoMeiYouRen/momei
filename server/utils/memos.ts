import { SettingKey } from '@/types/setting'
import { getSetting } from '@/server/services/setting'

export interface MemosCreatePayload {
    content: string
    visibility?: 'PUBLIC' | 'PROTECTED' | 'PRIVATE'
}

/**
 * 在受配置的 Memos 实例中创建一个 Memo
 * 遵循 Memos API v1 规范
 */
export const createMemo = async (payload: MemosCreatePayload) => {
    const isEnabled = await getSetting(SettingKey.MEMOS_ENABLED)
    if (isEnabled !== 'true' && isEnabled !== true) {
        return null
    }

    const instanceUrl = await getSetting(SettingKey.MEMOS_INSTANCE_URL)
    const accessToken = await getSetting(SettingKey.MEMOS_ACCESS_TOKEN)
    const defaultVisibility = await getSetting(SettingKey.MEMOS_DEFAULT_VISIBILITY) || 'PRIVATE'

    if (!instanceUrl || !accessToken) {
        throw new Error('Memos instance URL or access token not configured')
    }

    // 适配 URL 格式，确保不带结尾斜杠
    const baseUrl = instanceUrl.replace(/\/$/, '')
    const url = `${baseUrl}/api/v1/memos`

    const response = await $fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: {
            content: payload.content,
            visibility: payload.visibility || defaultVisibility,
        },
    }).catch((err) => {
        console.error('[Memos] Create memo failed:', err)
        throw err
    })

    return response
}
