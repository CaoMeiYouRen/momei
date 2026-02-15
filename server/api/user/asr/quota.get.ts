import { dataSource } from '~/server/database'
import { ASRQuota } from '~/server/entities/asr-quota'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const repo = dataSource.getRepository(ASRQuota)
    const quotas = await repo.findBy({ userId: user.id })

    const info = {
        siliconflow: {
            used: quotas.find((q) => q.provider === 'siliconflow' && q.periodType === 'total')?.usedSeconds || 0,
            max: quotas.find((q) => q.provider === 'siliconflow' && q.periodType === 'total')?.maxSeconds || 3600,
        },
        volcengine: {
            used: quotas.find((q) => q.provider === 'volcengine' && q.periodType === 'total')?.usedSeconds || 0,
            max: quotas.find((q) => q.provider === 'volcengine' && q.periodType === 'total')?.maxSeconds || 3600,
        },
    }

    return info
})
