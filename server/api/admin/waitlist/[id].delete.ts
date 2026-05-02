import { z } from 'zod'
import { dataSource } from '@/server/database'
import { BenefitWaitlist } from '@/server/entities/benefit-waitlist'
import { requireAdmin } from '@/server/utils/permission'
import { isSnowflakeId } from '@/utils/shared/validate'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const { id } = await getValidatedRouterParams(event, (params) =>
        z.object({
            id: z.string().trim().refine((value) => isSnowflakeId(value), {
                message: 'Invalid waitlist entry id',
            }),
        }).parse(params),
    )

    const repo = dataSource.getRepository(BenefitWaitlist)
    const entry = await repo.findOne({ where: { id } })

    if (!entry) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Not Found',
        })
    }

    await repo.remove(entry)

    return {
        code: 200,
        message: 'Deleted successfully',
    }
})
