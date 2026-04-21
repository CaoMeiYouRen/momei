import { z } from 'zod'
import { getSettingAuditLogs } from '@/server/services/setting-audit'
import { getDemoSettingAuditLogsPreview } from '@/server/utils/demo-settings'
import { requireAdmin } from '@/server/utils/permission'
import { safeParsePaginatedQuery } from '@/server/utils/pagination'
import { success } from '@/server/utils/response'

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    settingKey: z.string().trim().min(1).optional(),
})

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = safeParsePaginatedQuery(querySchema, getQuery(event))

    if (useRuntimeConfig().public.demoMode) {
        return success(getDemoSettingAuditLogsPreview(query.page, query.limit))
    }

    const data = await getSettingAuditLogs(query)

    return success({
        ...data,
        demoPreview: false,
    })
})
