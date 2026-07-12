import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { validateApiKeyRequest } from '@/server/utils/validate-api-key'
import { isAdmin } from '@/utils/shared/roles'
import { getRequiredRouterParam } from '@/server/utils/router'
import { ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const { user } = await validateApiKeyRequest(event)

    if (!isAdmin(user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required' })
    }

    const id = getRequiredRouterParam(event, 'id')

    const tagRepo = dataSource.getRepository(Tag)
    const tag = ensureFound(await tagRepo.findOneBy({ id }), 'Tag')

    // TypeORM handles ManyToMany deletion by removing entries from the join table automatically
    await tagRepo.remove(tag)

    return {
        code: 200,
        message: 'Tag deleted successfully',
    }
})
