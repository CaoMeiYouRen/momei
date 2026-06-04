import { z } from 'zod'
import { ContentAuditService } from '@/server/services/ai/content-audit'
import { requireAdminOrAuthor } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success } from '@/server/utils/response'
import { isAdmin } from '@/utils/shared/roles'

const bodySchema = z.object({
    force: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
    const session = await requireAdminOrAuthor(event)
    const id = getRequiredRouterParam(event, 'id')
    const body = await readBody(event)
    const { force } = bodySchema.parse(body || {})

    const result = await ContentAuditService.audit(id, session.user.id, { force, isAdmin: isAdmin(session.user.role) })
    return success(result)
})
