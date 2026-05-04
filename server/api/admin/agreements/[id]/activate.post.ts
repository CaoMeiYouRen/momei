import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { setActiveAgreement } from '@/server/services/agreement'
import { agreementTypeParamSchema, setActiveAgreementSchema } from '@/utils/schemas/agreement'

/**
 * POST /api/admin/agreements/[id]/activate
 * 设置指定协议版本为当前生效版本
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    try {
        const { id: type } = await getValidatedRouterParams(event, (params) => agreementTypeParamSchema.parse(params))
        const body = await readValidatedBody(event, (payload) => setActiveAgreementSchema.parse(payload))

        const agreement = await setActiveAgreement(type, body.agreementId)

        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }
        return fail(error.message || 'Failed to set active agreement', 500)
    }
})
