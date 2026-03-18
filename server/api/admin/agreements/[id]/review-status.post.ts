import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { setAgreementReviewStatus } from '@/server/services/agreement'
import { agreementReviewStatusSchema } from '@/utils/schemas/agreement'
import { assertDemoSettingsWriteAllowed } from '@/server/api/admin/settings/index.put'

export default defineEventHandler(async (event) => {
    assertDemoSettingsWriteAllowed(event.method || 'POST')
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        return fail('Agreement ID is required', 400)
    }

    try {
        const body = await readValidatedBody(event, (payload) => agreementReviewStatusSchema.parse(payload))
        const agreement = await setAgreementReviewStatus(id, body.reviewStatus)
        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }

        return fail(error.message || 'Failed to update review status', 500)
    }
})
