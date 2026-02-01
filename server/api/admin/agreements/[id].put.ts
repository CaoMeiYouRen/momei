import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { updateAgreementContent } from '@/server/services/agreement'

const updateAgreementSchema = z.object({
    content: z.string().min(1).optional(),
    version: z.string().optional().nullable(),
    versionDescription: z.string().optional().nullable(),
    isMainVersion: z.boolean().optional(),
})

/**
 * PUT /api/admin/agreements/[id]
 * 更新协议内容
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        return fail('Agreement ID is required', 400)
    }

    try {
        const body = await readValidatedBody(event, (b) => updateAgreementSchema.parse(b))

        const agreement = await updateAgreementContent(id, body)

        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }
        if (error.message.includes('Cannot modify') || error.message.includes('not found')) {
            return fail(error.message, 403)
        }
        return fail(error.message || 'Failed to update agreement', 500)
    }
})
