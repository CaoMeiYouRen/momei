/**
 * TTS 前端直连凭证颁发 API
 *
 * 用途: 为前端直连火山引擎 TTS API 生成临时 JWT 凭证。
 *       复用 ASR 凭证颁发模式 (server/api/ai/asr/credentials.post.ts)。
 *
 * REST: POST /api/ai/tts/credentials
 * Body: { provider: 'volcengine', mode: 'speech' | 'podcast', connectId?: string }
 * Response: { code: 200, data: TTSCredentials }
 */
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { getSettings } from '~/server/services/setting'
import { SettingKey } from '~/types/setting'
import { requireAdminOrAuthor } from '~/server/utils/permission'
import { generateTTSCredentials, resolveTTSCredentialTtlMilliseconds } from '~/server/utils/ai/tts-credentials'

const RequestSchema = z.object({
    provider: z.enum(['volcengine']),
    mode: z.enum(['speech', 'podcast']),
    connectId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
    await requireAdminOrAuthor(event)

    const body = await readValidatedBody(event, (payload) => RequestSchema.parse(payload))

    // 获取 Volcengine 配置
    const settings = await getSettings([
        SettingKey.VOLCENGINE_APP_ID,
        SettingKey.VOLCENGINE_ACCESS_KEY,
        SettingKey.TTS_CREDENTIAL_TTL_SECONDS,
    ])

    const credentials = await generateTTSCredentials({
        provider: body.provider,
        mode: body.mode,
        connectId: body.connectId || randomUUID(),
        settings: settings as Record<string, string | undefined>,
        expiresIn: resolveTTSCredentialTtlMilliseconds(settings[SettingKey.TTS_CREDENTIAL_TTL_SECONDS]),
    })

    return {
        code: 200,
        data: credentials,
    }
})
