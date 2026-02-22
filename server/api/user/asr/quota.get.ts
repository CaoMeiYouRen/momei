import { dataSource } from '~/server/database'
import { ASRQuota } from '~/server/entities/asr-quota'
import { requireAuth } from '~/server/utils/permission'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userId = session.user.id

    const repo = dataSource.getRepository(ASRQuota)
    const quotas = await repo.findBy({ userId })

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
