import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOneBy({ id })

    if (!tag) {
        throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
    }

    return {
        code: 200,
        data: tag,
    }
})
