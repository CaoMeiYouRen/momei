import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { probeRemoteAudio } from '@/server/utils/audio'

const querySchema = z.object({
    url: z.url(),
})

export default defineEventHandler(async (event) => {
    // 权限校验：仅管理员可调用
    await requireAdmin(event)

    // 参数校验
    const { url } = await getValidatedQuery(event, (q) => querySchema.parse(q))

    try {
        const metadata = await probeRemoteAudio(url)

        return {
            code: 200,
            data: metadata,
        }
    } catch (error: any) {
        throw createError({
            statusCode: 400,
            statusMessage: error.message || 'Failed to probe audio metadata',
        })
    }
})
