import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { getRequiredRouterParam } from '@/server/utils/router'
import { success, ensureFound } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const id = getRequiredRouterParam(event, 'id')

    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOneBy({ id })

    ensureFound(tag, 'Tag')

    return success(tag)
})
