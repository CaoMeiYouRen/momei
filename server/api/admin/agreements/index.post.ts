import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { createAgreementVersion } from '@/server/services/agreement'
import { agreementBodySchema } from '@/utils/schemas/agreement'

/**
 * POST /api/admin/agreements
 * 创建新的协议版本
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    try {
        const body = await readValidatedBody(event, (b) => agreementBodySchema.parse(b))

        const agreement = await createAgreementVersion(body)

        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }
        return fail(error.message || 'Failed to create agreement', 500)
    }
})
