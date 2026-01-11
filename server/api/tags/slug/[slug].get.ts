import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { success, fail } from '@/server/utils/response'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOne({
        where: { slug },
    })

    if (!tag) {
        return fail('Tag not found', 404)
    }

    return success(tag)
})
