import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { success, fail } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const query = getQuery(event)
    const language = query.language as string

    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOne({
        where: {
            slug,
            ...(language ? { language } : {}),
        },
    })

    if (!tag) {
        return fail('Tag not found', 404)
    }

    return success(tag)
})
