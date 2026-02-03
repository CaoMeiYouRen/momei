import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { requireAdmin } from '@/server/utils/permission'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    await requireAdmin(event)

    const tagRepo = dataSource.getRepository(Tag)

    const tag = ensureFound(await tagRepo.findOneBy({ id }), 'Tag')

    // TypeORM handles ManyToMany deletion by removing entries from the join table automatically
    // when the entity is removed.
    await tagRepo.remove(tag)

    return success(null)
})
