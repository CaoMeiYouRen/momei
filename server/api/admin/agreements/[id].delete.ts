import { requireAdmin } from '@/server/utils/permission'
import { success, fail } from '@/server/utils/response'
import { deleteAgreementVersion } from '@/server/services/agreement'

/**
 * DELETE /api/admin/agreements/[id]
 * 删除协议版本
 */
export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
        return fail('Agreement ID is required', 400)
    }

    try {
        await deleteAgreementVersion(id)
        return success({ message: 'Agreement deleted successfully' })
    } catch (error: any) {
        if (error.message.includes('Cannot delete') || error.message.includes('not found')) {
            return fail(error.message, 403)
        }
        return fail(error.message || 'Failed to delete agreement', 500)
    }
})
