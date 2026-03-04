import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import { requireAdminOrAuthor } from '~/server/utils/permission'
import { generateASRCredentials } from '~/server/utils/ai/asr-credentials'
import type { ASRProvider, ASRMode } from '~/types/asr'

const RequestSchema = z.object({
    provider: z.enum(['siliconflow', 'volcengine']),
    mode: z.enum(['batch', 'stream']),
    connectId: z.string().optional(),
})

/**
 * ASR 凭证颁发 API
 *
 * 为前端直连 AI 厂商生成临时凭证
 * 凭证有效期: 5 分钟
 */
export default defineEventHandler(async (event) => {
    // 权限验证
    const session = await requireAdminOrAuthor(event)

    // 解析请求体
    const body = await readValidatedBody(event, RequestSchema.parse)

    // 获取必要的配置
    const settings = await getSettings([
        // 通用 ASR 配置
        SettingKey.ASR_API_KEY,
        SettingKey.ASR_ENDPOINT,
        SettingKey.ASR_MODEL,
        // SiliconFlow 配置
        SettingKey.ASR_SILICONFLOW_API_KEY,
        SettingKey.ASR_SILICONFLOW_MODEL,
        // 火山引擎 ASR 专用配置 (优先)
        SettingKey.ASR_VOLCENGINE_APP_ID,
        SettingKey.ASR_VOLCENGINE_ACCESS_KEY,
        SettingKey.ASR_VOLCENGINE_SECRET_KEY,
        SettingKey.ASR_VOLCENGINE_CLUSTER_ID,
        // 火山引擎通用配置 (回退)
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
        SettingKey.VOLCENGINE_SECRET_KEY,
    ])

    // 生成临时凭证
    const credentials = generateASRCredentials({
        provider: body.provider as ASRProvider,
        mode: body.mode as ASRMode,
        userId: session.user.id,
        connectId: body.connectId || randomUUID(),
        settings: settings as Record<string, string | undefined>,
        expiresIn: 5 * 60 * 1000, // 5 分钟有效期
    })

    return {
        code: 200,
        data: credentials,
    }
})
