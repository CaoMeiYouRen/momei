import { z } from 'zod'
import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { createAgreementVersion } from '@/server/services/agreement'

const createAgreementSchema = z.object({
    type: z.enum(['user_agreement', 'privacy_policy']),
    language: z.string().min(1),
    content: z.string().min(1),
    version: z.string().optional().nullable(),
    versionDescription: z.string().optional().nullable(),
    isMainVersion: z.boolean().optional().default(false),
})

/**
 * POST /api/admin/agreements
 * 创建新的协议版本
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    try {
        const body = await readValidatedBody(event, (b) => createAgreementSchema.parse(b))

        const agreement = await createAgreementVersion(
            body.type,
            body.language,
            body.content,
            {
                version: body.version || undefined,
                versionDescription: body.versionDescription || undefined,
                isMainVersion: body.isMainVersion,
                isFromEnv: false,
            },
        )

        return success(agreement)
    } catch (error: any) {
        if (error.errors) {
            return fail(error.errors[0]?.message || 'Validation failed', 400)
        }
        return fail(error.message || 'Failed to create agreement', 500)
    }
})
