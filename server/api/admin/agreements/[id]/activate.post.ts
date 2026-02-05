import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { setActiveAgreement } from '@/server/services/agreement'

const setActiveSchema = z.object({
    agreementId: z.string().min(1),
})

/**
 * POST /api/admin/agreements/[id]/activate
 * 设置指定协议版本为当前生效版本
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const type = getRouterParam(event, 'id')!
    if (!type || !['user_agreement', 'privacy_policy'].includes(type)) {
        return fail('Invalid agreement type', 400)
    }

    try {
        const body = await readValidatedBody(event, (b) => setActiveSchema.parse(b))

        const agreement = await setActiveAgreement(
            type as 'user_agreement' | 'privacy_policy',
            body.agreementId,
        )

        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }
        return fail(error.message || 'Failed to set active agreement', 500)
    }
})
