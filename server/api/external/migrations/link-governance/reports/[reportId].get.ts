import { getRouterParam } from 'h3'
import { getLinkGovernanceReportById } from '@/server/services/migration-link-governance'
import { success } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const reportId = getRouterParam(event, 'reportId')
    if (!reportId) {
        throw createError({ statusCode: 400, statusMessage: 'reportId is required' })
    }

    const result = await getLinkGovernanceReportById(reportId, {
        userId: user.id,
        role: user.role,
    })

    return success(result)
})
