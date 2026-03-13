import { SettingKey } from '@/types/setting'
import { getSetting } from '@/server/services/setting'

export interface MemosCreatePayload {
    content: string
    visibility?: 'PUBLIC' | 'PROTECTED' | 'PRIVATE'
}

export interface MemosCreateResponse {
    name?: string
    uid?: string
}

interface MemosConfig {
    baseUrl: string
    accessToken: string
    defaultVisibility: 'PUBLIC' | 'PROTECTED' | 'PRIVATE'
}

async function resolveMemosConfig(): Promise<MemosConfig | null> {
    const isEnabled = await getSetting(SettingKey.MEMOS_ENABLED)
    if (isEnabled !== 'true') {
        return null
    }

    const instanceUrl = await getSetting(SettingKey.MEMOS_INSTANCE_URL)
    const accessToken = await getSetting(SettingKey.MEMOS_ACCESS_TOKEN)
    const defaultVisibility = await getSetting(SettingKey.MEMOS_DEFAULT_VISIBILITY) || 'PRIVATE'

    if (!instanceUrl || !accessToken) {
        throw new Error('Memos instance URL or access token not configured')
    }

    return {
        baseUrl: instanceUrl.replace(/\/$/, ''),
        accessToken,
        defaultVisibility: (defaultVisibility || 'PRIVATE') as MemosConfig['defaultVisibility'],
    }
}

function resolveMemoName(nameOrId: string) {
    return nameOrId.startsWith('memos/') ? nameOrId : `memos/${nameOrId}`
}

function createAuthHeaders(accessToken: string) {
    return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    }
}

/**
 * 在受配置的 Memos 实例中创建一个 Memo
 * 遵循 Memos API v1 规范
 */
export const createMemo = async (payload: MemosCreatePayload): Promise<MemosCreateResponse | null> => {
    const config = await resolveMemosConfig()
    if (!config) {
        return null
    }

    const response = await $fetch<MemosCreateResponse>(`${config.baseUrl}/api/v1/memos`, {
        method: 'POST',
        headers: createAuthHeaders(config.accessToken),
        body: {
            content: payload.content,
            visibility: payload.visibility || config.defaultVisibility,
        },
    }).catch((err) => {
        console.error('[Memos] Create memo failed:', err)
        throw err
    })

    return response
}

/**
 * 更新受配置的 Memos Memo 内容
 * 优先尝试简化 REST 口径，失败后回退到带 updateMask 的标准请求体。
 */
export const updateMemo = async (nameOrId: string, payload: MemosCreatePayload): Promise<MemosCreateResponse | null> => {
    const config = await resolveMemosConfig()
    if (!config) {
        return null
    }

    const memoName = resolveMemoName(nameOrId)
    const endpoint = `${config.baseUrl}/api/v1/${memoName}`
    const visibility = payload.visibility || config.defaultVisibility

    const attempts = [
        () => $fetch<MemosCreateResponse>(endpoint, {
            method: 'PATCH',
            headers: createAuthHeaders(config.accessToken),
            body: {
                content: payload.content,
                visibility,
            },
        }),
        () => $fetch<MemosCreateResponse>(endpoint, {
            method: 'PATCH',
            headers: createAuthHeaders(config.accessToken),
            query: {
                updateMask: 'content,visibility',
            },
            body: {
                memo: {
                    name: memoName,
                    content: payload.content,
                    visibility,
                },
                updateMask: {
                    paths: ['content', 'visibility'],
                },
            },
        }),
    ]

    let lastError: unknown
    for (const attempt of attempts) {
        try {
            return await attempt()
        } catch (error) {
            lastError = error
        }
    }

    console.error('[Memos] Update memo failed:', lastError)
    throw lastError
}
