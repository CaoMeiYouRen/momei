import { z } from 'zod'
import { getSettingAuditLogs } from '@/server/services/setting-audit'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    settingKey: z.string().trim().min(1).optional(),
})

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const queryResult = querySchema.safeParse(getQuery(event))
    const query = queryResult.success ? queryResult.data : { page: 1, limit: 10 }
    const data = await getSettingAuditLogs(query)

    return success(data)
})
