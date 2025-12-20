import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' })
    }

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const tagRepo = dataSource.getRepository(Tag)

    const tag = await tagRepo.findOneBy({ id })
    if (!tag) {
        throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
    }

    // TypeORM handles ManyToMany deletion by removing entries from the join table automatically
    // when the entity is removed.
    await tagRepo.remove(tag)

    return {
        code: 200,
        message: 'Tag deleted successfully',
    }
})
