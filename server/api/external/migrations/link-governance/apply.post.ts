import { readBody } from 'h3'
import { runLinkGovernanceApply } from '@/server/services/migration-link-governance'
import { success } from '@/server/utils/response'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { linkGovernanceRequestSchema } from '@/utils/schemas/migration-link-governance'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)
    const body = linkGovernanceRequestSchema.parse(await readBody(event))
    const result = await runLinkGovernanceApply(body, user.id)
    return success(result)
})
