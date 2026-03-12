import { getRouterParam } from 'h3'
import { getLinkGovernanceReportById } from '@/server/services/migration-link-governance'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const reportId = getRouterParam(event, 'reportId')

    if (!reportId) {
        throw createError({ statusCode: 400, statusMessage: 'reportId is required' })
    }

    const data = await getLinkGovernanceReportById(reportId, {
        userId: session.user.id,
        role: session.user.role,
    })

    return success(data)
})
