import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { getAgreementVersions } from '@/server/services/agreement'
import { agreementAdminListQuerySchema } from '@/utils/schemas/agreement'

/**
 * GET /api/admin/agreements
 * 获取所有协议版本
 * 支持查询参数:
 * - type: user_agreement | privacy_policy
 * - language: 语言代码 (可选)
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const result = await getValidatedQuery(event, (query) => agreementAdminListQuerySchema.safeParse(query))

    if (!result.success) {
        return fail('Invalid agreement type', 400)
    }

    try {
        const versions = await getAgreementVersions(
            result.data.type,
            result.data.language,
        )
        return success(versions)
    } catch (error: any) {
        return fail(error.message || 'Failed to fetch agreements', 500)
    }
})
