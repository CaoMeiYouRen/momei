import { readBody } from 'h3'
import { runLinkGovernanceApply } from '@/server/services/migration-link-governance'
import { requireAdmin } from '@/server/utils/permission'
import { success } from '@/server/utils/response'
import { linkGovernanceRequestSchema } from '@/utils/schemas/migration-link-governance'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const body = linkGovernanceRequestSchema.parse(await readBody(event))
    const result = await runLinkGovernanceApply(body, session.user.id)
    return success(result)
})
